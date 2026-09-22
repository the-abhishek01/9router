// Ox Alpha Web provider — anonymous stealth reasoning web2api
// Directly interfaces with https://oxalpha.com/api/chat with automated
// CSRF + session token caching, enabling zero-auth 1M context reasoning.
const oxalphaWebProvider = {
  id: "oxalpha-web",
  priority: 26,
  hasFree: true,
  alias: "oxalpha-web",
  aliases: ["oxalpha", "ox", "ox-alpha"],
  uiAlias: "ox",
  display: {
    name: "Ox Alpha (Free)",
    icon: "psychology",
    color: "#6e56cf",
    textIcon: "OX",
    website: "https://oxalpha.com/chat",
    notice: {
      text: "Zero-auth access to Ox Alpha — stealth reasoning model (1M context) powered by z-ai/glm-5.3-flash. Works anonymously with no registration or API key required. Optional: paste session cookies from oxalpha.com.",
      apiKeyUrl: "https://oxalpha.com/chat",
    },
  },
  category: "freeTier",
  authType: "cookie",
  authModes: ["cookie"],
  // Credential is optional: anonymous Ox Alpha access works without any cookie.
  noAuth: true,
  authHint: "Optional — leave blank for anonymous zero-auth access, or paste your oxalpha.com Cookie header value.",
  transport: {
    baseUrl: "https://oxalpha.com/api/chat",
    format: "oxalpha-web",
    authType: "cookie",
    noAuth: true,
  },
  models: [
    { id: "ox-alpha", name: "Ox Alpha (Stealth Reasoning 1M)" },
    { id: "glm-5.3-flash", name: "GLM 5.3 Flash (Ox Alpha)" },
    { id: "z-ai/glm-5.3-flash", name: "Z-AI GLM 5.3 Flash" },
  ],
  serviceKinds: ["llm"],
};

export default oxalphaWebProvider;
