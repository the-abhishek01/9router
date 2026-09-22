import { BaseExecutor } from "./base.js";
import { PROVIDERS } from "../config/providers.js";
import { SSE_DONE, SSE_HEADERS_NO_BUFFER } from "../utils/sseConstants.js";
import { sseChunk } from "../utils/sse.js";
import { proxyAwareFetch } from "../utils/proxyFetch.js";
import { createHash } from "node:crypto";

// Port of Sophomoresty/gemini-web2api (single-file Python proxy) into a native
// 9router executor. Protocol: POST to Gemini's public StreamGenerate endpoint
// with an f.req form body (protobuf-like array), parse the NDJSON "wrb.fr"
// response lines. Anonymous access works without cookies; a Gemini web cookie
// (with SAPISID) unlocks account-tier routing via SAPISIDHASH auth.

const GEMINI_HOST = "https://gemini.google.com";
const STREAM_PATH = "/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate";
const GEMINI_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// Fallback from gemini-web2api config; auto-refreshed from the app page on
// startup + on HTTP 405 (stale-version signature upstream).
const DEFAULT_BL = "boq_assistant-bard-web-server_20260716.08_p0";
const BL_RE = /boq_assistant-bard-web-server_\d+\.\d+_p\d+/;
const BL_REFRESH_MS = 10 * 60 * 1000;
const BL_FETCH_TIMEOUT_MS = 15000;

const PROMPT_MAX_BYTES = 60000;

// MODE_CATEGORY field [79] (from Gemini frontend 028-6eb337387583.js):
// 1=FAST, 2=THINKING, 3=PRO, 4=AUTO, 5=FAST_DYNAMIC_THINKING, 6=FLASH_LITE.
// think: thinking-depth knob (0=deepest … 4=shallowest), inner[17].
const MODEL_MAP = {
  "gemini-3.7-flash": { mode: 1, think: 4 },
  "gemini-3.6-flash": { mode: 1, think: 4 },
  "gemini-3.5-flash": { mode: 1, think: 4 },
  "gemini-3.5-flash-thinking": { mode: 2, think: 0 },
  "gemini-3.1-pro": { mode: 3, think: 4 },
  "gemini-auto": { mode: 4, think: 4 },
  "gemini-3.5-flash-thinking-lite": { mode: 5, think: 0 },
  "gemini-flash-lite": { mode: 6, think: 4 },
};

// ─── Model resolution ────────────────────────────────────────────────────────

// "@think=N" suffix on the model id overrides the thinking depth (0=deepest,
// 4=shallowest). Mirrors gemini-web2api's _resolve_model.
export function resolveModel(requestedModel) {
  let name = String(requestedModel || "").trim();
  let thinkOverride = null;
  const at = name.indexOf("@think=");
  if (at !== -1) {
    const n = parseInt(name.slice(at + 7), 10);
    if (Number.isFinite(n)) thinkOverride = n;
    name = name.slice(0, at).trim();
  }
  const cfg = MODEL_MAP[name];
  if (!cfg) return null;
  return { name, mode: cfg.mode, think: thinkOverride ?? cfg.think };
}

// ─── Prompt building (messages_to_prompt port) ──────────────────────────────

// Images are recognized but not uploaded: the Gemini upload endpoint needs a
// signed session for multimodal input (same limitation gemini-web2api notes
// for anonymous mode). They are replaced with an attachment marker.
function extractImagesAndText(content, images) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");
  const textParts = [];
  for (const c of content) {
    const type = c?.type;
    if (type === "text" || type === "input_text" || type === "output_text") {
      textParts.push(String(c?.text ?? ""));
    } else {
      images.push(null); // marker — upload unsupported without a signed session
      textParts.push("[Image attached]");
    }
  }
  return textParts.join(" ");
}

export function buildPromptFromMessages(messages, tools) {
  const parts = [];
  const images = [];
  if (Array.isArray(tools) && tools.length) {
    const toolDefs = tools.map((tool) => {
      const fn = tool?.type === "function" ? (tool.function || tool) : tool;
      return {
        name: fn?.name ?? tool?.name ?? "",
        description: fn?.description ?? tool?.description ?? "",
        parameters: fn?.parameters ?? tool?.parameters ?? {},
      };
    });
    let toolsJson = JSON.stringify(toolDefs, null, 2);
    if (toolsJson.length > PROMPT_MAX_BYTES / 2) {
      toolsJson = JSON.stringify(toolDefs.map((t) => ({ name: t.name, description: t.description })), null, 2);
    }
    parts.push(
      "[System instruction]: You have access to tools. To call a tool, respond with:\n" +
      '```tool_call\n{"name": "func_name", "arguments": {...}}\n```\n' +
      "Only use tool_call blocks when needed.\n\n" +
      `Available tools:\n${toolsJson}`
    );
  }
  for (const msg of messages) {
    const role = String(msg?.role || "user");
    const text = extractImagesAndText(msg?.content, images);
    if (role === "system" || role === "developer") {
      parts.push(`[System instruction]: ${text}`);
    } else if (role === "assistant") {
      if (Array.isArray(msg?.tool_calls) && msg.tool_calls.length) {
        const tcStrs = msg.tool_calls.map((tc) => {
          const fn = tc?.function || {};
          return `\`\`\`tool_call\n{"name": "${fn.name}", "arguments": ${fn.arguments || "{}"}}\n\`\`\``;
        });
        parts.push(`[Assistant]: ${text || ""}\n${tcStrs.join("\n")}`);
      } else {
        parts.push(`[Assistant]: ${text}`);
      }
    } else if (role === "tool") {
      parts.push(`[Tool result for ${msg?.name || ""}]: ${text}`);
    } else {
      parts.push(text);
    }
  }
  return parts.filter(Boolean).join("\n\n");
}

// ─── Tool-call protocol (parse_tool_calls port) ─────────────────────────────

const TOOL_CALL_RE = /```tool_call\s*\n(.*?)\n```/gs;

export function parseToolCalls(text) {
  const toolCalls = [];
  for (const match of text.matchAll(TOOL_CALL_RE)) {
    try {
      const data = JSON.parse(match[1].trim());
      if (data && data.name) {
        toolCalls.push({
          id: `call_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
          type: "function",
          function: {
            name: String(data.name),
            arguments: JSON.stringify(data.arguments ?? {}),
          },
        });
      }
    } catch {
      /* skip malformed blocks */
    }
  }
  const clean = text.replace(TOOL_CALL_RE, "").trim();
  return { clean, toolCalls };
}

// ─── Payload construction (gemini_stream_generate port) ─────────────────────

export function buildFReq(prompt, mode, thinkMode, temporaryChats = false) {
  const inner = new Array(80).fill(null);
  inner[0] = [prompt, 0, null, null, null, null, 0];
  inner[1] = ["en"];
  inner[2] = ["", "", "", null, null, null, null, null, null, ""];
  inner[6] = [0];
  inner[7] = 1;
  inner[10] = 1;
  inner[11] = 0;
  inner[17] = [[thinkMode]];
  inner[18] = 0;
  inner[27] = 1;
  inner[30] = [4];
  // Chat persistence: [1]+[45]=1 → temporary chats, [2] → persistent history.
  if (temporaryChats) {
    inner[41] = [1];
    inner[45] = 1;
  } else {
    inner[41] = [2];
  }
  inner[53] = 0;
  inner[59] = crypto.randomUUID();
  inner[61] = [];
  inner[68] = 1;
  inner[79] = mode;
  return JSON.stringify([null, JSON.stringify(inner)]);
}

export function buildStreamGenerateUrl(authUser, bl) {
  const prefix = authUser !== undefined && authUser !== null && authUser !== "" ? `/u/${authUser}` : "";
  const reqid = Math.floor(Date.now() / 1000) % 1000000;
  return `${GEMINI_HOST}${prefix}${STREAM_PATH}?bl=${encodeURIComponent(bl)}&hl=en&_reqid=${reqid}&rt=c`;
}

// ─── Cookie / SAPISIDHASH auth ───────────────────────────────────────────────

// Accepts a raw Cookie header value, an "cookie=..." prefixed paste, or a JSON
// {"cookie": "...", "sapisid": "..."} blob (gemini-web2api cookie_file format).
export function normalizeCookie(raw) {
  if (!raw) return { cookie: "", sapisid: null, authUser: null, xsrfToken: null, geminiBl: null };
  let value = String(raw).trim();
  if (value.startsWith("{")) {
    try {
      const data = JSON.parse(value);
      const cookie = data.cookie || "";
      return {
        cookie,
        sapisid: data.sapisid || extractSapisid(cookie),
        authUser: data.auth_user ?? null,
        xsrfToken: data.xsrf_token ?? data.xsrfToken ?? null,
        geminiBl: data.gemini_bl ?? data.geminiBl ?? null,
      };
    } catch { /* fall through to plain cookie parsing */ }
  }
  if (/^cookie\s*:/i.test(value)) value = value.replace(/^cookie\s*:\s*/i, "").trim();
  else if (/^cookie=/i.test(value)) value = value.replace(/^cookie\s*=\s*/i, "").trim();
  return { cookie: value, sapisid: extractSapisid(value), authUser: null, xsrfToken: null, geminiBl: null };
}

function extractSapisid(cookieStr) {
  for (const pair of String(cookieStr || "").split(";")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    if (key === "SAPISID" || key === "__Secure-3PAPISID") {
      return pair.slice(eq + 1).trim();
    }
  }
  return null;
}

// SAPISIDHASH authorization: sha1("{ts} {sapisid} https://gemini.google.com").
export function makeSapisidhash(sapisid) {
  const ts = Math.floor(Date.now() / 1000);
  const h = createHash("sha1").update(`${ts} ${sapisid} ${GEMINI_HOST}`).digest("hex");
  return `SAPISIDHASH ${ts}_${h}`;
}

// ─── BL (backend version) auto-fetch with cache ─────────────────────────────

let blState = { value: DEFAULT_BL, fetchedAt: 0, inflight: null };

export function resetBlCache() {
  blState = { value: DEFAULT_BL, fetchedAt: 0, inflight: null };
}

async function fetchLatestBl(proxyOptions, log) {
  try {
    const res = await proxyAwareFetch(`${GEMINI_HOST}/app`, {
      headers: { "User-Agent": GEMINI_UA },
      signal: AbortSignal.timeout(BL_FETCH_TIMEOUT_MS),
    }, proxyOptions);
    const html = await res.text();
    const m = html.match(BL_RE);
    if (m) return m[0];
  } catch (e) {
    log?.debug?.("GEMINI-WEB", `BL fetch failed: ${e?.message || e}`);
  }
  return null;
}

async function getBl(proxyOptions, log, force = false) {
  const now = Date.now();
  if (!force && now - blState.fetchedAt < BL_REFRESH_MS) return blState.value;
  if (!blState.inflight) {
    blState.inflight = fetchLatestBl(proxyOptions, log)
      .then((bl) => {
        blState.inflight = null;
        if (bl && bl !== blState.value) {
          log?.info?.("GEMINI-WEB", `BL updated: ${blState.value} → ${bl}`);
          blState.value = bl;
        }
        blState.fetchedAt = Date.now();
        return blState.value;
      })
      .catch(() => {
        blState.inflight = null;
        blState.fetchedAt = Date.now();
        return blState.value;
      });
  }
  return blState.inflight;
}

// ─── Response parsing (extract_response_text / stream iter port) ────────────

export function cleanGeminiText(text, strip = true) {
  // Remove internal code-execution artifacts.
  const cleaned = String(text).replace(
    /```(?:python|javascript|text)\?code_(?:reference|stdout)&code_event_index=\d+\n.*?```\n?/gs,
    ""
  );
  return strip ? cleaned.trim() : cleaned;
}

function checkBardError(raw) {
  const m = raw.match(/BardErrorInfo\s*\[(\d+)\]/);
  return m ? `Gemini upstream rejected request: BardErrorInfo [${m[1]}]` : null;
}

// Collect every candidate text from StreamGenerate lines; returns the last
// non-empty one (the final generation snapshot). Throws on BardErrorInfo.
export function collectGeminiText(raw) {
  const bardErr = checkBardError(raw);
  if (bardErr) {
    const err = new Error(bardErr);
    err.bardError = true;
    throw err;
  }
  const texts = [];
  for (const line of raw.split("\n")) {
    if (!line.includes('"wrb.fr"') || line.length < 200) continue;
    let arr;
    try { arr = JSON.parse(line); } catch { continue; }
    const innerStr = arr?.[0]?.[2];
    if (!innerStr || innerStr.length < 50) continue;
    let inner;
    try { inner = JSON.parse(innerStr); } catch { continue; }
    if (Array.isArray(inner) && inner.length > 4 && inner[4]) {
      for (const part of inner[4]) {
        if (Array.isArray(part) && part.length > 1 && part[1] && Array.isArray(part[1])) {
          for (const t of part[1]) {
            if (typeof t === "string" && t.length > 0) texts.push(t);
          }
        }
      }
    }
  }
  let text = "";
  for (let i = texts.length - 1; i >= 0; i--) {
    if (texts[i].trim()) {
      text = texts[i];
      break;
    }
  }
  return cleanGeminiText(text);
}

// NDJSON line reader over the fetch body.
async function* readLines(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      while (true) {
        const idx = buffer.indexOf("\n");
        if (idx < 0) break;
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line) yield line;
      }
    }
    buffer += decoder.decode();
    if (buffer) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

// Streaming delta extractor. StreamGenerate snapshots grow monotonically, so
// whenever a candidate string is longer than everything seen before it, the
// suffix `t.slice(prevText.length)` is new content (mirrors gemini-web2api).
export async function* streamGeminiDeltas(body, signal) {
  let prevText = "";
  for await (const line of readLines(body, signal)) {
    const bardErr = checkBardError(line);
    if (bardErr) {
      yield { error: bardErr };
      return;
    }
    if (!line.includes('"wrb.fr"') || line.length < 200) continue;
    let arr;
    try { arr = JSON.parse(line); } catch { continue; }
    const innerStr = arr?.[0]?.[2];
    if (!innerStr || innerStr.length < 50) continue;
    let inner;
    try { inner = JSON.parse(innerStr); } catch { continue; }
    if (Array.isArray(inner) && inner.length > 4 && inner[4]) {
      for (const part of inner[4]) {
        if (Array.isArray(part) && part.length > 1 && part[1] && Array.isArray(part[1])) {
          for (const t of part[1]) {
            if (typeof t === "string" && t.length > prevText.length) {
              const delta = cleanGeminiText(t.slice(prevText.length), false);
              prevText = t;
              if (delta) yield { delta };
            }
          }
        }
      }
    }
  }
  yield { done: true };
}

// ─── SSE response builders ───────────────────────────────────────────────────

function sseRoleChunk(cid, created, model) {
  return sseChunk({
    id: cid, object: "chat.completion.chunk", created, model, system_fingerprint: null,
    choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null, logprobs: null }],
  });
}

function sseContentChunk(cid, created, model, content) {
  return sseChunk({
    id: cid, object: "chat.completion.chunk", created, model, system_fingerprint: null,
    choices: [{ index: 0, delta: { content }, finish_reason: null, logprobs: null }],
  });
}

function sseToolCallsChunk(cid, created, model, toolCalls) {
  return sseChunk({
    id: cid, object: "chat.completion.chunk", created, model, system_fingerprint: null,
    choices: [{
      index: 0,
      delta: { tool_calls: toolCalls.map((tc, i) => ({ index: i, id: tc.id, type: tc.type, function: tc.function })) },
      finish_reason: null, logprobs: null,
    }],
  });
}

function sseFinishChunk(cid, created, model, finishReason) {
  return sseChunk({
    id: cid, object: "chat.completion.chunk", created, model, system_fingerprint: null,
    choices: [{ index: 0, delta: {}, finish_reason: finishReason, logprobs: null }],
  });
}

function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

// ─── Executor ────────────────────────────────────────────────────────────────

export class GeminiWebExecutor extends BaseExecutor {
  constructor() {
    super("gemini-web", PROVIDERS["gemini-web"]);
  }

  errorResponse(message, type, status, url, transformedBody) {
    const errResp = new Response(
      JSON.stringify({ error: { message, type, code: `GEMINI_WEB_${status}` } }),
      { status: status >= 400 && status < 600 ? status : 502, headers: { "Content-Type": "application/json" } }
    );
    return { response: errResp, url, headers: {}, transformedBody };
  }

  async execute({ model, body, stream, credentials, signal, log, proxyOptions }) {
    const streamUrl = PROVIDERS["gemini-web"].baseUrl;

    const messages = body?.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return this.errorResponse("Missing or empty messages array", "invalid_request", 400, streamUrl, body);
    }

    const resolved = resolveModel(model);
    if (!resolved) log?.info?.("GEMINI-WEB", `Unmapped model ${model}, defaulting to gemini-3.6-flash`);
    const modelInfo = resolved || { name: "gemini-3.6-flash", mode: 1, think: 4 };
    const modelName = modelInfo.name;

    const tools = Array.isArray(body?.tools) && body.tools.length ? body.tools : null;
    const prompt = buildPromptFromMessages(messages, tools);
    if (!prompt.trim()) {
      return this.errorResponse("Empty prompt after processing", "invalid_request", 400, streamUrl, body);
    }
    if (prompt.length > PROMPT_MAX_BYTES * 2) {
      log?.warn?.("GEMINI-WEB", `Prompt very large (${prompt.length} chars) — may be truncated upstream`);
    }

    // Credentials: cookie optional (anonymous mode), authUser via providerSpecificData.
    const { cookie, sapisid, authUser: cookieAuthUser, xsrfToken: cookieXsrf, geminiBl: cookieBl } = normalizeCookie(credentials?.apiKey);
    const authUser = credentials?.providerSpecificData?.authUser ?? cookieAuthUser;
    const xsrfToken = credentials?.providerSpecificData?.xsrfToken ?? cookieXsrf;
    const temporaryChats = credentials?.providerSpecificData?.temporaryChats ?? false;

    const bl = cookieBl || await getBl(proxyOptions, log);
    const params = new URLSearchParams();
    params.set("f.req", buildFReq(prompt, modelInfo.mode, modelInfo.think, temporaryChats));
    if (xsrfToken) params.set("at", xsrfToken);
    const bodyStr = params.toString();

    const prefix = authUser !== undefined && authUser !== null && authUser !== "" ? `/u/${authUser}` : "";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: GEMINI_HOST,
      Referer: `${GEMINI_HOST}${prefix}/app`,
      "X-Same-Domain": "1",
      "User-Agent": GEMINI_UA,
    };
    if (cookie) headers["Cookie"] = cookie;
    if (sapisid) headers["Authorization"] = makeSapisidhash(sapisid);
    if (prefix) headers["X-Goog-AuthUser"] = String(authUser);

    log?.info?.("GEMINI-WEB", `Query ${modelName} (mode=${modelInfo.mode}, think=${modelInfo.think}), prompt=${prompt.length} chars, cookie=${cookie ? "yes" : "anonymous"}`);

    // Fetch with one auto-retry on 405 (stale BL → force-refresh + rebuild URL).
    let response = null;
    let usedUrl = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const currentBl = attempt === 0 ? bl : await getBl(proxyOptions, log, true);
      usedUrl = buildStreamGenerateUrl(authUser, currentBl);
      try {
        response = await proxyAwareFetch(usedUrl, {
          method: "POST",
          headers,
          body: bodyStr,
          signal,
        }, proxyOptions);
        if (response.status === 405 && attempt === 0) {
          log?.info?.("GEMINI-WEB", "HTTP 405 — refreshing BL and retrying once");
          continue;
        }
        break;
      } catch (err) {
        log?.error?.("GEMINI-WEB", `Fetch failed: ${err?.message || err}`);
        return this.errorResponse(
          `Gemini connection failed: ${err?.message || String(err)}`,
          "upstream_error", 502, usedUrl, { f_req: bodyStr }
        );
      }
    }

    if (!response.ok) {
      const status = response.status;
      let errMsg = `Gemini Web returned HTTP ${status}`;
      if (status === 401 || status === 403) {
        errMsg = "Gemini rejected the cookie — re-paste your gemini.google.com Cookie header value (or clear it for anonymous mode).";
      } else if (status === 429) {
        errMsg = "Gemini rate limited. Wait a moment and retry, or rotate cookies.";
      } else if (status === 405) {
        errMsg = `Gemini Web backend version changed (HTTP 405, bl=${bl}). Retry shortly — the version auto-refreshes.`;
      }
      log?.warn?.("GEMINI-WEB", errMsg);
      return this.errorResponse(errMsg, "upstream_error", status, usedUrl, { f_req: bodyStr });
    }

    if (!response.body) {
      return this.errorResponse("Gemini returned empty response body", "upstream_error", 502, usedUrl, { f_req: bodyStr });
    }

    const cid = `chatcmpl-gemini-web-${crypto.randomUUID().slice(0, 12)}`;
    const created = Math.floor(Date.now() / 1000);

    // Tool calling needs the full response to extract ```tool_call blocks.
    let finalResponse;
    if (stream && !tools) {
      finalResponse = buildStreamingResponse(response.body, modelName, cid, created, signal);
    } else {
      finalResponse = await buildBufferedResponse(response.body, modelName, cid, created, prompt, !!tools, stream, signal, this);
    }
    return { response: finalResponse, url: usedUrl, headers, transformedBody: { f_req: bodyStr }, responseFormat: "openai" };
  }
}

function buildStreamingResponse(eventStream, model, cid, created, signal) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(sseRoleChunk(cid, created, model)));
        for await (const item of streamGeminiDeltas(eventStream, signal)) {
          if (item.error) {
            controller.enqueue(encoder.encode(sseContentChunk(cid, created, model, `[Error: ${item.error}]`)));
            break;
          }
          if (item.done) break;
          if (item.delta) {
            controller.enqueue(encoder.encode(sseContentChunk(cid, created, model, item.delta)));
          }
        }
        controller.enqueue(encoder.encode(sseFinishChunk(cid, created, model, "stop")));
        controller.enqueue(encoder.encode(SSE_DONE));
      } catch (err) {
        if (err?.name !== "AbortError") {
          try {
            controller.enqueue(encoder.encode(sseContentChunk(cid, created, model, `[Error: ${err?.message || err}]`)));
            controller.enqueue(encoder.encode(sseFinishChunk(cid, created, model, "stop")));
            controller.enqueue(encoder.encode(SSE_DONE));
          } catch { /* stream already closed */ }
        }
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  }), { status: 200, headers: { ...SSE_HEADERS_NO_BUFFER } });
}

async function buildBufferedResponse(eventStream, model, cid, created, prompt, hasTools, stream, signal, executor) {
  // Read the full body, then take the final snapshot text.
  const decoder = new TextDecoder();
  const reader = eventStream.getReader();
  let raw = "";
  try {
    while (true) {
      if (signal?.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch (err) {
    if (err?.name !== "AbortError") {
      return executor.errorResponse(`Gemini stream read failed: ${err?.message || err}`, "upstream_error", 502, "", null);
    }
  } finally {
    try { reader.releaseLock(); } catch { /* already released */ }
  }

  let text;
  try {
    text = collectGeminiText(raw);
  } catch (err) {
    return executor.errorResponse(err?.message || "Gemini upstream error", "upstream_error", 502, "", null);
  }

  let toolCalls = null;
  if (hasTools && text) {
    const parsed = parseToolCalls(text);
    text = parsed.clean;
    toolCalls = parsed.toolCalls.length ? parsed.toolCalls : null;
  }

  const msg = { role: "assistant", content: text || null };
  if (toolCalls) msg.tool_calls = toolCalls;

  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(text);

  if (stream) {
    const encoder = new TextEncoder();
    const chunks = [
      sseRoleChunk(cid, created, model),
      ...(text ? [sseContentChunk(cid, created, model, text)] : []),
      ...(toolCalls ? [sseToolCallsChunk(cid, created, model, toolCalls)] : []),
      sseFinishChunk(cid, created, model, toolCalls ? "tool_calls" : "stop"),
      SSE_DONE,
    ];
    return new Response(new ReadableStream({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    }), { status: 200, headers: { ...SSE_HEADERS_NO_BUFFER } });
  }

  return new Response(JSON.stringify({
    id: cid, object: "chat.completion", created, model,
    choices: [{ index: 0, message: msg, finish_reason: toolCalls ? "tool_calls" : "stop", logprobs: null }],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

export default GeminiWebExecutor;







