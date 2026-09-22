import { describe, it, expect, vi } from "vitest";
import { OxAlphaWebExecutor } from "../../open-sse/executors/oxalpha-web.js";
import { getExecutor, hasSpecializedExecutor } from "../../open-sse/executors/index.js";
import { PROVIDERS, PROVIDER_MODELS } from "../../open-sse/providers/index.js";
import REGISTRY from "../../open-sse/providers/registry/index.js";

describe("oxalpha-web registry", () => {
  it("registers transport + models", () => {
    const cfg = PROVIDERS["oxalpha-web"];
    expect(cfg).toBeTruthy();
    expect(cfg.baseUrl).toContain("https://oxalpha.com/api/chat");
    expect(cfg.format).toBe("oxalpha-web");
    expect(cfg.noAuth).toBe(true);

    const models = PROVIDER_MODELS["oxalpha-web"];
    expect(models?.some((m) => m.id === "ox-alpha")).toBe(true);
    expect(models?.some((m) => m.id === "glm-5.3-flash")).toBe(true);
    expect(models?.some((m) => m.id === "z-ai/glm-5.3-flash")).toBe(true);
  });

  it("is listed as freeTier provider for dashboard with zero-auth", () => {
    const entry = REGISTRY.find((p) => p.id === "oxalpha-web");
    expect(entry).toBeTruthy();
    expect(entry.category).toBe("freeTier");
    expect(entry.authType).toBe("cookie");
    expect(entry.noAuth).toBe(true);
    expect(entry.hasFree).toBe(true);
  });

  it("is registered in executor map with aliases", () => {
    expect(hasSpecializedExecutor("oxalpha-web")).toBe(true);
    expect(hasSpecializedExecutor("oxalpha")).toBe(true);
    expect(hasSpecializedExecutor("ox")).toBe(true);
    expect(getExecutor("oxalpha-web")).toBeInstanceOf(OxAlphaWebExecutor);
    expect(getExecutor("oxalpha")).toBeInstanceOf(OxAlphaWebExecutor);
  });
});

describe("OxAlphaWebExecutor implementation", () => {
  it("resolves model names to upstream model id", () => {
    const exec = new OxAlphaWebExecutor();
    expect(exec.resolveUpstreamModel("ox-alpha")).toBe("z-ai/glm-5.3-flash");
    expect(exec.resolveUpstreamModel("glm-5.3-flash")).toBe("z-ai/glm-5.3-flash");
    expect(exec.resolveUpstreamModel("z-ai/glm-5.3-flash")).toBe("z-ai/glm-5.3-flash");
  });

  it("formats messages properly into role/content pairs without invalid system role", () => {
    const exec = new OxAlphaWebExecutor();
    const formatted = exec.formatMessages([
      { role: "developer", content: "You are a helpful assistant." },
      {
        role: "user",
        content: [
          { type: "text", text: "Hello" },
          { type: "text", text: "world" },
        ],
      },
      { role: "assistant", content: "Hi there!" },
      { role: "tool", name: "calculator", content: "42" },
      { role: "user", content: "   " },
    ]);
    expect(formatted).toEqual([
      {
        role: "user",
        content: "[System Instructions]\nYou are a helpful assistant.\n\nHello\nworld",
      },
      { role: "assistant", content: "Hi there!" },
      { role: "user", content: "[Tool Result (calculator)]:\n42" },
      { role: "user", content: "(empty)" },
    ]);
  });

  it("extracts custom session cookies and turnstile tokens", async () => {
    const exec = new OxAlphaWebExecutor();
    const session = await exec.getSession({
      apiKey: "ox_alpha_session=fake-session; XSRF-TOKEN=test-token",
    });
    expect(session.cookieHeader).toBe("ox_alpha_session=fake-session; XSRF-TOKEN=test-token");
    expect(session.csrfToken).toBe("test-token");
  });

  it("handles JSON credential containing turnstileToken and cookie", async () => {
    const exec = new OxAlphaWebExecutor();
    const session = await exec.getSession({
      apiKey: JSON.stringify({
        cookie: "ox_alpha_session=custom-session; XSRF-TOKEN=token123",
        turnstileToken: "turnstile-token-xyz",
      }),
    });
    expect(session.cookieHeader).toBe("ox_alpha_session=custom-session; XSRF-TOKEN=token123");
    expect(session.csrfToken).toBe("token123");
    expect(session.turnstileToken).toBe("turnstile-token-xyz");
  });

  it("returns 400 error when messages array is empty", async () => {
    const exec = new OxAlphaWebExecutor();
    const result = await exec.execute({
      model: "ox-alpha",
      body: { messages: [] },
      stream: false,
    });
    expect(result.response.status).toBe(400);
    const data = await result.response.json();
    expect(data.error.message).toContain("Missing or empty messages array");
  });

  it("builds a complete non-streaming response from SSE chunks", async () => {
    const exec = new OxAlphaWebExecutor();

    const mockChunks = [
      `data: {"id":"gen-1","object":"chat.completion.chunk","model":"z-ai/glm-5.3-flash","choices":[{"index":0,"delta":{"role":"assistant","content":"","reasoning":"Thinking step"}}]}\n\n`,
      `data: {"id":"gen-1","object":"chat.completion.chunk","model":"z-ai/glm-5.3-flash","choices":[{"index":0,"delta":{"content":"Hello!"}}]}\n\n`,
      `data: {"id":"gen-1","object":"chat.completion.chunk","model":"z-ai/glm-5.3-flash","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15}}\n\n`,
      `data: [DONE]\n\n`,
    ];

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of mockChunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    const response = await exec.buildNonStreamingResponse(stream, "ox-alpha");
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.object).toBe("chat.completion");
    expect(data.model).toBe("ox-alpha");
    expect(data.choices[0].message.content).toBe("Hello!");
    expect(data.choices[0].message.reasoning).toBe("Thinking step");
    expect(data.choices[0].message.reasoning_content).toBe("Thinking step");
    expect(data.choices[0].finish_reason).toBe("stop");
    expect(data.usage.total_tokens).toBe(15);
  });
});
