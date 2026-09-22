import { BaseExecutor } from "./base.js";
import { PROVIDERS } from "../config/providers.js";
import { SSE_DONE, SSE_HEADERS_NO_BUFFER } from "../utils/sseConstants.js";
import { sseChunk } from "../utils/sse.js";
import { proxyAwareFetch } from "../utils/proxyFetch.js";

const OXALPHA_BASE_URL = "https://oxalpha.com";
const OXALPHA_CHAT_PAGE = `${OXALPHA_BASE_URL}/chat`;
const OXALPHA_API_CHAT = `${OXALPHA_BASE_URL}/api/chat`;
const DEFAULT_MODEL = "z-ai/glm-5.3-flash";

const DEFAULT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export class OxAlphaWebExecutor extends BaseExecutor {
  constructor() {
    super("oxalpha-web", PROVIDERS["oxalpha-web"]);
    this.cachedSession = null;
  }

  /**
   * Resolve and normalize requested model to Ox Alpha upstream model id.
   */
  resolveUpstreamModel(model) {
    const m = String(model || "").toLowerCase();
    if (m === "ox-alpha" || m === "glm-5.3-flash" || m === "z-ai/glm-5.3-flash") {
      return DEFAULT_MODEL;
    }
    return DEFAULT_MODEL;
  }

  /**
   * Fetch a fresh anonymous session (CSRF token + cookies) from https://oxalpha.com/chat.
   */
  async refreshSession(log) {
    log?.info?.("OXALPHA-WEB", "Fetching fresh session from https://oxalpha.com/chat");
    const res = await proxyAwareFetch(OXALPHA_CHAT_PAGE, {
      method: "GET",
      headers: {
        "User-Agent": DEFAULT_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to initialize Ox Alpha session: HTTP ${res.status}`);
    }

    const html = await res.text();
    const csrfMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/i);
    if (!csrfMatch) {
      throw new Error("Could not extract csrf-token from Ox Alpha chat page");
    }
    const csrfToken = csrfMatch[1];

    let cookieHeader = "";
    if (typeof res.headers.getSetCookie === "function") {
      cookieHeader = res.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
    } else if (res.headers.get("set-cookie")) {
      cookieHeader = res.headers
        .get("set-cookie")
        .split(",")
        .map((c) => c.split(";")[0].trim())
        .join("; ");
    }

    this.cachedSession = {
      csrfToken,
      cookieHeader,
      expiresAt: Date.now() + 50 * 60 * 1000, // 50 minutes TTL
    };

    return this.cachedSession;
  }

  /**
   * Get session credentials, honoring user-supplied cookies if present.
   */
  async getSession(credentials, forceRefresh = false, log) {
    let userCookie = credentials?.apiKey || credentials?.cookie;
    let turnstileToken = credentials?.turnstileToken || null;

    if (userCookie && typeof userCookie === "string") {
      userCookie = userCookie.trim();
      if (userCookie.startsWith("{") && userCookie.endsWith("}")) {
        try {
          const parsed = JSON.parse(userCookie);
          userCookie = parsed.cookie || parsed.apiKey || null;
          turnstileToken = parsed.turnstileToken || parsed.turnstile || turnstileToken;
        } catch {
          // ignore JSON parse error
        }
      } else if (userCookie.startsWith("0.") || userCookie.startsWith("0x")) {
        // Appears to be a raw Turnstile token
        turnstileToken = userCookie;
        userCookie = null;
      }
    }

    if (userCookie && !forceRefresh) {
      let csrfToken = null;
      const csrfMatch = userCookie.match(/XSRF-TOKEN=([^;]+)/i);
      if (csrfMatch) {
        try {
          csrfToken = decodeURIComponent(csrfMatch[1]);
        } catch {
          csrfToken = csrfMatch[1];
        }
      }
      if (!csrfToken) {
        if (!this.cachedSession || Date.now() >= this.cachedSession.expiresAt) {
          await this.refreshSession(log);
        }
        csrfToken = this.cachedSession?.csrfToken;
      }
      return { csrfToken, cookieHeader: userCookie, turnstileToken };
    }

    if (forceRefresh || !this.cachedSession || Date.now() >= this.cachedSession.expiresAt) {
      await this.refreshSession(log);
    }
    return { ...this.cachedSession, turnstileToken };
  }

  /**
   * Format OpenAI chat messages to Ox Alpha payload messages.
   * Ox Alpha /api/chat strictly requires:
   * 1. Only "user" and "assistant" roles (422 {"error":"Invalid messages"} on "system", "developer", "tool").
   * 2. Non-empty string content (422 {"error":"Invalid messages"} on empty or whitespace-only content).
   * 3. System instructions must be merged into the prompt.
   */
  formatMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    const systemParts = [];
    const formatted = [];

    for (const m of messages) {
      if (!m) continue;

      let content = "";
      if (typeof m.content === "string") {
        content = m.content.trim();
      } else if (Array.isArray(m.content)) {
        content = m.content
          .filter((part) => part && (part.type === "text" || typeof part.text === "string"))
          .map((part) => part.text || "")
          .join("\n")
          .trim();
      } else if (m.content !== undefined && m.content !== null) {
        content = String(m.content).trim();
      }

      // Handle assistant messages with tool calls but empty content
      if (!content && m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
        content = m.tool_calls
          .map((tc) => `[Tool Call: ${tc?.function?.name || "unknown"}(${tc?.function?.arguments || ""})]`)
          .join("\n");
      }

      const role = String(m.role || "user").toLowerCase();

      // Ox Alpha 422s on system/developer role; accumulate to merge into user prompt
      if (role === "system" || role === "developer") {
        if (content) {
          systemParts.push(content);
        }
        continue;
      }

      // Ox Alpha 422s on tool/function role; map to user message
      if (role === "tool" || role === "function") {
        const toolLabel = m.name || m.tool_call_id || "tool";
        formatted.push({
          role: "user",
          content: `[Tool Result (${toolLabel})]:\n${content || "(empty result)"}`,
        });
        continue;
      }

      const effectiveRole = role === "assistant" ? "assistant" : "user";
      // Ox Alpha 422s on empty string content; provide non-empty fallback
      const safeContent = content || "(empty)";
      formatted.push({
        role: effectiveRole,
        content: safeContent,
      });
    }

    // Merge accumulated system instructions into the first user message
    if (systemParts.length > 0) {
      const combinedSystem = systemParts.join("\n\n");
      const firstUserIdx = formatted.findIndex((m) => m.role === "user");
      if (firstUserIdx !== -1) {
        formatted[firstUserIdx].content = `[System Instructions]\n${combinedSystem}\n\n${formatted[firstUserIdx].content}`;
      } else {
        // Prepend as a user message if no user message exists
        formatted.unshift({
          role: "user",
          content: `[System Instructions]\n${combinedSystem}`,
        });
      }
    }

    return formatted.filter((m) => typeof m.content === "string" && m.content.length > 0);
  }

  async execute({ model, body, stream = true, credentials = {}, signal, log }) {
    const requestedModel = model || "ox-alpha";
    const upstreamModel = this.resolveUpstreamModel(requestedModel);
    const messages = this.formatMessages(body?.messages);

    if (messages.length === 0) {
      const errResp = new Response(
        JSON.stringify({
          error: { message: "Missing or empty messages array", type: "invalid_request_error" },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
      return { response: errResp, url: OXALPHA_API_CHAT, headers: {}, transformedBody: body };
    }

    const payload = {
      model: upstreamModel,
      messages,
    };

    let session = await this.getSession(credentials, false, log);
    let upstreamRes = await this.sendChatRequest(payload, session, signal);

    // If session expired or CSRF invalid (HTTP 419 / 401 / 403), retry once with fresh session
    if (!upstreamRes.ok && (upstreamRes.status === 419 || upstreamRes.status === 401 || upstreamRes.status === 403)) {
      log?.warn?.("OXALPHA-WEB", `Ox Alpha session invalid (status ${upstreamRes.status}), refreshing...`);
      session = await this.getSession(credentials, true, log);
      upstreamRes = await this.sendChatRequest(payload, session, signal);
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      log?.error?.("OXALPHA-WEB", `Upstream error ${upstreamRes.status}: ${errText}`);
      let userMsg = `Ox Alpha upstream error (${upstreamRes.status}): ${errText || upstreamRes.statusText}`;
      if (upstreamRes.status === 428) {
        userMsg =
          "Ox Alpha rate check / verification required (Turnstile). Anonymous daily quota reached from this IP. Paste your oxalpha.com session cookie (DevTools → Application → Cookies) or provide a Turnstile token in credentials.";
      }
      const errResp = new Response(
        JSON.stringify({
          error: {
            message: userMsg,
            type: upstreamRes.status === 428 ? "turnstile_required" : "upstream_error",
            code: upstreamRes.status,
          },
        }),
        { status: upstreamRes.status, headers: { "Content-Type": "application/json" } }
      );
      return { response: errResp, url: OXALPHA_API_CHAT, headers: {}, transformedBody: payload };
    }

    if (!upstreamRes.body) {
      const errResp = new Response(
        JSON.stringify({
          error: { message: "Ox Alpha returned empty response body", type: "upstream_error" },
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
      return { response: errResp, url: OXALPHA_API_CHAT, headers: {}, transformedBody: payload };
    }

    if (stream) {
      const sseStream = this.buildStreamingStream(upstreamRes.body, requestedModel, signal);
      const finalResp = new Response(sseStream, {
        status: 200,
        headers: { ...SSE_HEADERS_NO_BUFFER },
      });
      return { response: finalResp, url: OXALPHA_API_CHAT, headers: SSE_HEADERS_NO_BUFFER, transformedBody: payload };
    } else {
      const nonStreamResp = await this.buildNonStreamingResponse(upstreamRes.body, requestedModel, signal);
      return { response: nonStreamResp, url: OXALPHA_API_CHAT, headers: { "Content-Type": "application/json" }, transformedBody: payload };
    }
  }

  async sendChatRequest(payload, session, signal) {
    const headers = {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": session?.csrfToken || "",
      Cookie: session?.cookieHeader || "",
      "User-Agent": DEFAULT_UA,
      Referer: OXALPHA_CHAT_PAGE,
      Origin: OXALPHA_BASE_URL,
      Accept: "text/event-stream, */*",
    };

    if (session?.turnstileToken) {
      headers["X-Turnstile-Token"] = session.turnstileToken;
    }

    return proxyAwareFetch(OXALPHA_API_CHAT, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal,
    });
  }

  buildStreamingStream(bodyStream, requestedModel, signal) {
    const reader = bodyStream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            if (signal?.aborted) {
              controller.close();
              return;
            }

            const { value, done } = await reader.read();
            if (done) {
              controller.enqueue(new TextEncoder().encode(SSE_DONE));
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              if (trimmed === "data: [DONE]") {
                controller.enqueue(new TextEncoder().encode(SSE_DONE));
                continue;
              }

              if (trimmed.startsWith("data: ")) {
                try {
                  const chunk = JSON.parse(trimmed.slice(6));
                  // Normalize model name to requested model
                  chunk.model = requestedModel;

                  // Normalize reasoning fields so both .reasoning and .reasoning_content are available
                  const delta = chunk.choices?.[0]?.delta;
                  if (delta) {
                    if (delta.reasoning && !delta.reasoning_content) {
                      delta.reasoning_content = delta.reasoning;
                    } else if (delta.reasoning_content && !delta.reasoning) {
                      delta.reasoning = delta.reasoning_content;
                    }
                  }

                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
                } catch {
                  // Forward raw data line if JSON parse fails
                  controller.enqueue(new TextEncoder().encode(`${trimmed}\n\n`));
                }
              }
            }
          }
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  }

  async buildNonStreamingResponse(bodyStream, requestedModel, signal) {
    const reader = bodyStream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let reasoning = "";
    let completionId = `chatcmpl-ox-${crypto.randomUUID().slice(0, 12)}`;
    let finishReason = "stop";
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    while (true) {
      if (signal?.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]" || !trimmed.startsWith("data: ")) continue;

        try {
          const chunk = JSON.parse(trimmed.slice(6));
          if (chunk.id) completionId = chunk.id;
          const choice = chunk.choices?.[0];
          if (choice?.delta?.content) content += choice.delta.content;
          if (choice?.delta?.reasoning) reasoning += choice.delta.reasoning;
          if (choice?.delta?.reasoning_content) reasoning += choice.delta.reasoning_content;
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          if (chunk.usage) usage = chunk.usage;
        } catch {
          // ignore
        }
      }
    }

    const resBody = {
      id: completionId,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: requestedModel,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
            ...(reasoning ? { reasoning_content: reasoning, reasoning } : {}),
          },
          finish_reason: finishReason,
        },
      ],
      usage,
    };

    return new Response(JSON.stringify(resBody), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default OxAlphaWebExecutor;
