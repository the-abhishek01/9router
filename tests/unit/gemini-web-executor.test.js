import { describe, it, expect, beforeAll } from "vitest";
import {
  GeminiWebExecutor,
  resolveModel,
  buildFReq,
  buildStreamGenerateUrl,
  buildPromptFromMessages,
  parseToolCalls,
  collectGeminiText,
  streamGeminiDeltas,
  normalizeCookie,
  makeSapisidhash,
  cleanGeminiText,
} from "../../open-sse/executors/gemini-web.js";
import { getExecutor, hasSpecializedExecutor } from "../../open-sse/executors/index.js";
import { PROVIDERS, PROVIDER_MODELS } from "../../open-sse/providers/index.js";
import { FREE_TIER_PROVIDERS } from "../../src/shared/constants/providers.js";

describe("gemini-web registry", () => {
  it("registers transport + models", () => {
    const cfg = PROVIDERS["gemini-web"];
    expect(cfg).toBeTruthy();
    expect(cfg.baseUrl).toContain("assistant.lamda.BardFrontendService/StreamGenerate");
    expect(cfg.format).toBe("gemini-web");
    expect(cfg.noAuth).toBe(true);

    const models = PROVIDER_MODELS["gemini-web"];
    expect(models?.some((m) => m.id === "gemini-3.6-flash")).toBe(true);
    expect(models?.some((m) => m.id === "gemini-3.1-pro")).toBe(true);
    expect(models?.some((m) => m.id === "gemini-3.5-flash-thinking")).toBe(true);
    expect(models?.some((m) => m.id === "gemini-flash-lite")).toBe(true);
  });

  it("is listed as freeTier provider for dashboard", () => {
    expect(FREE_TIER_PROVIDERS["gemini-web"]).toBeTruthy();
    expect(FREE_TIER_PROVIDERS["gemini-web"].authType).toBe("cookie");
    expect(FREE_TIER_PROVIDERS["gemini-web"].noAuth).toBe(true);
  });

  it("is registered on executor map", () => {
    expect(hasSpecializedExecutor("gemini-web")).toBe(true);
    expect(getExecutor("gemini-web")).toBeInstanceOf(GeminiWebExecutor);
  });
});

describe("resolveModel", () => {
  it("maps model ids to MODE_CATEGORY modes", () => {
    expect(resolveModel("gemini-3.6-flash")).toEqual({ name: "gemini-3.6-flash", mode: 1, think: 4 });
    expect(resolveModel("gemini-3.5-flash-thinking")).toEqual({ name: "gemini-3.5-flash-thinking", mode: 2, think: 0 });
    expect(resolveModel("gemini-3.1-pro")).toEqual({ name: "gemini-3.1-pro", mode: 3, think: 4 });
    expect(resolveModel("gemini-auto")).toEqual({ name: "gemini-auto", mode: 4, think: 4 });
    expect(resolveModel("gemini-3.5-flash-thinking-lite")).toEqual({ name: "gemini-3.5-flash-thinking-lite", mode: 5, think: 0 });
    expect(resolveModel("gemini-flash-lite")).toEqual({ name: "gemini-flash-lite", mode: 6, think: 4 });
    expect(resolveModel("gemini-3.7-flash")).toEqual({ name: "gemini-3.7-flash", mode: 1, think: 4 });
  });

  it("parses @think=N override suffix", () => {
    expect(resolveModel("gemini-3.6-flash@think=0")).toEqual({ name: "gemini-3.6-flash", mode: 1, think: 0 });
    expect(resolveModel("gemini-3.6-flash@think=2")).toEqual({ name: "gemini-3.6-flash", mode: 1, think: 2 });
    expect(resolveModel("gemini-3.5-flash-thinking@think=3")).toEqual({ name: "gemini-3.5-flash-thinking", mode: 2, think: 3 });
  });

  it("returns null for unknown models", () => {
    expect(resolveModel("gpt-4o")).toBe(null);
    expect(resolveModel("")).toBe(null);
  });
});

describe("buildFReq payload", () => {
  it("fills MODE_CATEGORY [79] and thinking [17]", () => {
    const outer = JSON.parse(buildFReq("hi", 3, 1));
    const inner = JSON.parse(outer[1]);
    expect(outer[0]).toBe(null);
    expect(inner[79]).toBe(3);
    expect(inner[17]).toEqual([[1]]);
    expect(inner[0][0]).toBe("hi");
    expect(inner[1]).toEqual(["en"]);
    expect(typeof inner[59]).toBe("string");
  });

  it("applies temporary-chat persistence flags", () => {
    const temp = JSON.parse(JSON.parse(buildFReq("hi", 1, 4, true))[1]);
    expect(temp[41]).toEqual([1]);
    expect(temp[45]).toBe(1);

    const persistent = JSON.parse(JSON.parse(buildFReq("hi", 1, 4, false))[1]);
    expect(persistent[41]).toEqual([2]);
    expect(persistent[45]).toBe(null);
  });
});

describe("buildStreamGenerateUrl", () => {
  it("builds anonymous StreamGenerate URL", () => {
    const url = buildStreamGenerateUrl(null, "boq_assistant-bard-web-server_1.2_p3");
    expect(url).toContain("https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate");
    expect(url).toContain("bl=boq_assistant-bard-web-server_1.2_p3");
    expect(url).toContain("hl=en");
    expect(url).toContain("rt=c");
  });

  it("prefixes /u/{n} for account switching", () => {
    const url = buildStreamGenerateUrl(2, "bl");
    expect(url).toContain("https://gemini.google.com/u/2/_/BardChatUi");
  });
});

describe("buildPromptFromMessages", () => {
  it("folds roles into the gemini-web prompt convention", () => {
    const prompt = buildPromptFromMessages([
      { role: "system", content: "Be terse." },
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
      { role: "user", content: "Bye" },
    ], null);
    expect(prompt).toBe("[System instruction]: Be terse.\n\nHello\n\n[Assistant]: Hi there\n\nBye");
  });

  it("serializes assistant tool_calls back into tool_call blocks", () => {
    const prompt = buildPromptFromMessages([
      { role: "assistant", content: "", tool_calls: [{ function: { name: "get_weather", arguments: '{"city":"Tokyo"}' } }] },
      { role: "tool", name: "get_weather", content: "Sunny" },
    ], null);
    expect(prompt).toContain('```tool_call\n{"name": "get_weather", "arguments": {"city":"Tokyo"}}\n```');
    expect(prompt).toContain("[Tool result for get_weather]: Sunny");
  });

  it("injects a tools instruction block", () => {
    const prompt = buildPromptFromMessages([{ role: "user", content: "Weather in Tokyo?" }], [
      { type: "function", function: { name: "get_weather", description: "Get weather", parameters: { type: "object", properties: { city: { type: "string" } } } } },
    ]);
    expect(prompt).toContain("[System instruction]: You have access to tools.");
    expect(prompt).toContain('"name": "get_weather"');
  });

  it("marks images as attached (upload unsupported anonymously)", () => {
    const prompt = buildPromptFromMessages([
      { role: "user", content: [{ type: "text", text: "Describe" }, { type: "image_url", image_url: { url: "data:image/png;base64,AAAA" } }] },
    ], null);
    expect(prompt).toContain("Describe");
    expect(prompt).toContain("[Image attached]");
  });
});

describe("parseToolCalls", () => {
  it("extracts tool_call blocks into OpenAI tool_calls", () => {
    const text = 'Sure.\n```tool_call\n{"name": "get_weather", "arguments": {"city": "Tokyo"}}\n```\nDone.';
    const { clean, toolCalls } = parseToolCalls(text);
    // Python parity: re.sub removes the fenced block only; the surrounding
    // newlines stay ("Sure.\n" + "\nDone."), then .trim() runs.
    expect(clean).toBe("Sure.\n\nDone.");
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].type).toBe("function");
    expect(toolCalls[0].id).toMatch(/^call_/);
    expect(toolCalls[0].function.name).toBe("get_weather");
    expect(JSON.parse(toolCalls[0].function.arguments)).toEqual({ city: "Tokyo" });
  });

  it("skips malformed blocks", () => {
    const { clean, toolCalls } = parseToolCalls("```tool_call\nnot json\n```");
    expect(toolCalls).toHaveLength(0);
    expect(clean).toBe("");
  });
});

// Build a minimal StreamGenerate NDJSON fixture (the real shape: each line is
// [ ["wrb.fr", null, "<json inner>"] ] where inner[4] parts hold the growing
// snapshot texts in part[1]). The inner JSON carries a long filler string so
// it passes the >50-char sanity guard the protocol parser uses.
function wrbLine(snapshotText, pad = 260) {
  const inner = [null, null, null, null, [[null, [snapshotText]]], "f".repeat(80)];
  return JSON.stringify([["wrb.fr", null, JSON.stringify(inner)]]) + " ".repeat(Math.max(0, pad - 200));
}

describe("collectGeminiText", () => {
  it("returns the last non-empty snapshot", () => {
    const raw = [wrbLine("Hello"), wrbLine("Hello world")].join("\n");
    expect(collectGeminiText(raw)).toBe("Hello world");
  });

  it("cleans code-execution artifacts", () => {
    // Artifact on its own line (realistic shape): regex eats the fence + the
    // trailing newline; the leading "\n" before the fence survives (Python parity).
    const dirty = 'before\n```python?code_reference&code_event_index=1\nprint("x")```\nafter';
    expect(cleanGeminiText(dirty)).toBe("before\nafter");
  });

  it("throws on BardErrorInfo", () => {
    const raw = wrbLine("x") + "\nsomething BardErrorInfo [3] y";
    expect(() => collectGeminiText(raw)).toThrow(/BardErrorInfo \[3\]/);
  });
});

describe("streamGeminiDeltas", () => {
  function streamOf(text) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text));
        controller.close();
      },
    });
  }

  it("yields only the growing suffix as deltas", async () => {
    const lines = [wrbLine("Hello", 260), "ignore-me", wrbLine("Hello world", 260)].join("\n");
    const deltas = [];
    for await (const item of streamGeminiDeltas(streamOf(lines), null)) {
      if (item.delta) deltas.push(item.delta);
      if (item.done) break;
    }
    expect(deltas).toEqual(["Hello", " world"]);
  });

  it("surfaces BardErrorInfo as an error item and stops", async () => {
    const lines = [wrbLine("Hi"), "Oops BardErrorInfo [7] end", wrbLine("Hi more")].join("\n");
    const items = [];
    for await (const item of streamGeminiDeltas(streamOf(lines), null)) {
      items.push(item);
    }
    // Line 1 streams a delta; line 2 must abort with the upstream error and
    // return immediately (no trailing done item, no line-3 content).
    expect(items[0].delta).toBe("Hi");
    const err = items.find((i) => i.error);
    expect(err.error).toMatch(/BardErrorInfo \[7\]/);
    expect(items[items.length - 1]).toBe(err);
    expect(items.some((i) => i.done)).toBe(false);
  });
});

// Opt-in live check against the real Gemini Web StreamGenerate endpoint.
// Run with: GEMINI_WEB_LIVE=1 npx vitest run unit/gemini-web-executor.test.js
// Exercises the full executor path: BL auto-fetch → f.req payload → cookie
// (anonymous) → NDJSON parse → OpenAI response. Network + upstream drift make
// this unsuitable for default CI, so it is skipped unless opted in.
const LIVE = process.env.GEMINI_WEB_LIVE === "1";

describe.skipIf(!LIVE)("GeminiWebExecutor live (anonymous)", () => {
  it("returns a real completion for gemini-3.6-flash", async () => {
    const executor = getExecutor("gemini-web");
    const { response } = await executor.execute({
      model: "gemini-3.6-flash",
      body: { messages: [{ role: "user", content: "Reply with exactly one word: pong" }] },
      stream: false,
      credentials: { apiKey: "" }, // anonymous mode
      signal: AbortSignal.timeout(90000),
      log: null,
      proxyOptions: null,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    console.log("[live] gemini-web content:", JSON.stringify(content.slice(0, 200)));
    expect(content.trim().length).toBeGreaterThan(0);
    expect(data.model).toBe("gemini-3.6-flash");
    expect(data.usage.total_tokens).toBeGreaterThan(0);
  }, 120000);
});

describe("cookie handling", () => {
  it("normalizes pasted Cookie header and extracts SAPISID", () => {
    const { cookie, sapisid } = normalizeCookie("Cookie: SAPISID=abc123; __Secure-1PSID=xyz; NID=1");
    expect(cookie).toBe("SAPISID=abc123; __Secure-1PSID=xyz; NID=1");
    expect(sapisid).toBe("abc123");
  });

  it("strips a leading cookie= paste", () => {
    const { cookie, sapisid } = normalizeCookie("cookie=SAPISID=zzz");
    expect(cookie).toBe("SAPISID=zzz");
    expect(sapisid).toBe("zzz");
  });

  it("accepts the gemini-web2api JSON cookie-file format and extracts tokens", () => {
    const jsonStr = JSON.stringify({
      cookie: "SAPISID=j1; A=B",
      sapisid: "j1",
      auth_user: 1,
      xsrf_token: "xsrf123",
      gemini_bl: "bl456",
    });
    const parsed = normalizeCookie(jsonStr);
    expect(parsed.cookie).toBe("SAPISID=j1; A=B");
    expect(parsed.sapisid).toBe("j1");
    expect(parsed.authUser).toBe(1);
    expect(parsed.xsrfToken).toBe("xsrf123");
    expect(parsed.geminiBl).toBe("bl456");
  });

  it("builds SAPISIDHASH authorization", () => {
    const auth = makeSapisidhash("abc");
    expect(auth).toMatch(/^SAPISIDHASH \d+_[0-9a-f]{40}$/);
  });
});




