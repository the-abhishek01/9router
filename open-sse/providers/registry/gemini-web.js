// Gemini Web provider — merge of Sophomoresty/gemini-web2api.
// Talks directly to Gemini's public StreamGenerate endpoint (the same protocol
// gemini-web2api.py implements), so 9router needs no sidecar server.
export default {
  id: "gemini-web",
  priority: 25,
  hasFree: true,
  alias: "gemini-web",
  aliases: ["geminiweb", "gweb"],
  uiAlias: "gweb",
  display: {
    name: "Gemini Web (Free)",
    icon: "auto_awesome",
    color: "#8E44AD",
    textIcon: "GW",
    website: "https://gemini.google.com",
    notice: {
      text: "Zero-auth access to Gemini Web — anonymous mode needs no cookie. Paste your gemini.google.com Cookie header value for account-tier routing (real Pro, longer outputs). Model ids accept an @think=N suffix (0=deepest, 4=shallowest).",
      apiKeyUrl: "https://gemini.google.com/app",
    },
  },
  category: "freeTier",
  authType: "cookie",
  authModes: ["cookie"],
  // Credential is optional: anonymous Gemini Web access works with no cookie.
  noAuth: true,
  authHint: "Optional — paste your gemini.google.com Cookie header value (DevTools → Network → any request → Cookie). Anonymous mode works without a cookie; a cookie unlocks account-tier models.",
  transport: {
    baseUrl: "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate",
    format: "gemini-web",
    authType: "cookie",
    noAuth: true,
  },
  // MODE_CATEGORY field [79] mapping from Gemini's frontend (028-6eb337387583.js):
  // 1=FAST, 2=THINKING, 3=PRO, 4=AUTO, 5=FAST_DYNAMIC_THINKING, 6=FLASH_LITE
  models: [
    { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash" },
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
    { id: "gemini-3.5-flash-thinking", name: "Gemini 3.5 Flash Thinking" },
    { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro" },
    { id: "gemini-auto", name: "Gemini Auto" },
    { id: "gemini-3.5-flash-thinking-lite", name: "Gemini 3.5 Flash Thinking Lite" },
    { id: "gemini-flash-lite", name: "Gemini Flash Lite" },
  ],
  serviceKinds: ["llm"],
};
