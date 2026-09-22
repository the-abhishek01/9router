# Gemini Web (Free) — `gemini-web` provider

Native 9router integration of [Sophomoresty/gemini-web2api](https://github.com/Sophomoresty/gemini-web2api):
it talks **directly** to Gemini Web's public `StreamGenerate` endpoint, so no
sidecar Python server is needed. The original project's protocol, model
mapping, tool-calling convention and cookie handling were ported into
`open-sse/executors/gemini-web.js`.

## What you get

- **Zero-auth access**: anonymous mode works without any cookie or API key.
- **OpenAI-compatible**: route any client (`/v1/chat/completions`,
  `/v1/messages`, …) through 9router to Gemini Web.
- **Tool calling**: OpenAI `tools` are translated into Gemini Web's
  ` ```tool_call ``` ` block protocol and parsed back into `tool_calls`.
- **Streaming**: SSE deltas from Gemini's snapshot protocol.
- **Thinking depth**: model ids accept an `@think=N` suffix
  (`0` = deepest … `4` = shallowest), e.g. `gemini-3.6-flash@think=2`.
- **Web search**: Gemini Web's built-in search (no toggle needed).

## Models

| Model id | Mode [79] | Notes |
|---|---|---|
| `gemini-3.7-flash` | 1 (FAST) | Latest all-around model |
| `gemini-3.6-flash` | 1 (FAST) | All-around model (default) |
| `gemini-3.5-flash` | 1 (FAST) | Alias — backend upgraded to 3.6 |
| `gemini-3.5-flash-thinking` | 2 (THINKING) | Deep thinking, ~20k char output |
| `gemini-3.1-pro` | 3 (PRO) | Real Pro routing needs a cookie |
| `gemini-auto` | 4 (AUTO) | Auto model selection |
| `gemini-3.5-flash-thinking-lite` | 5 (FAST_DYNAMIC_THINKING) | Adaptive depth |
| `gemini-flash-lite` | 6 (FLASH_LITE) | Lightweight fast model |

## Setup

1. Open the 9router dashboard → Providers → **Gemini Web (Free)** (`gweb`).
2. Create a connection:
   - **Anonymous** (recommended start): leave the cookie field empty.
   - **Cookie mode**: paste your `gemini.google.com` **Cookie header value**
     (DevTools → Network → any request → `Cookie` request header, copy the
     whole value). A cookie with `SAPISID` also enables `SAPISIDHASH`
     authorization, unlocking account-tier routing (real Pro, higher limits).
     The JSON format `{"cookie": "...", "sapisid": "..."}` (or exported
     `gemini-auth.json` from `tools/gemini-cookie-sync-extension`) is also accepted.
   - **Chrome Extension**: load `tools/gemini-cookie-sync-extension` unpacked in
     `chrome://extensions` to easily export fresh session cookies and tokens.
   - **Multi-account**: set `authUser` (e.g. `1`) in the connection's
     provider-specific data to target `/u/1` (Google account switcher index).

## How it works

1. The executor fetches the current backend version (`bl=boq_assistant-…`)
   from `gemini.google.com/app` (cached 10 min, force-refreshed on HTTP 405).
2. It builds the `f.req` form payload — a protobuf-like array where slot
   `[0]` carries the prompt, `[17]` the thinking depth, `[41]/[45]` chat
   persistence, and `[79]` the `MODE_CATEGORY` model selection — and POSTs it
   to `…/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate`.
3. The NDJSON response (`"wrb.fr"` lines) is parsed; candidate texts grow
   monotonically, so deltas stream as `t.slice(prevText.length)`.
4. `BardErrorInfo [N]` markers are surfaced as upstream errors.

## Limitations (inherited from gemini-web2api)

- **Image upload** is not supported anonymously — the Gemini upload endpoint
  needs a signed session. Images in the request are replaced with an
  `[Image attached]` marker (text-only mode). Use the official `gemini`
  provider for multimodal.
- **Not real Pro/Ultra** without a paid-subscription cookie: `gemini-3.1-pro`
  routes to the same Flash backend when anonymous.
- **Single-turn protocol**: multi-turn context is simulated by folding all
  messages into one prompt (`[System instruction]`, `[Assistant]`, …).
- **Rate limits**: Google may throttle sustained anonymous use.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `HTTP 405` | Backend version changed — the executor auto-refreshes `bl`; retry. Persistent 405s mean Google changed the endpoint shape. |
| `401/403` with a cookie | Cookie expired — re-paste the Cookie header value. |
| `BardErrorInfo [N]` | Upstream rejection (often rate/abuse flags). Slow down, switch model, or add a cookie. |
| Empty responses | Try a different model (`gemini-auto`), or use a cookie. |
