export default {
  id: "jev-ai",
  priority: 45,
  alias: "jev-ai",
  aliases: ["jev"],
  display: {
    name: "Jev AI",
    icon: "psychology",
    color: "#6366F1",
    textIcon: "JEV",
    website: "https://jev-ai.pro",
    notice: {
      apiKeyUrl: "https://jev-ai.pro",
    },
  },
  category: "apikey",
  authType: "apikey",
  serviceKinds: ["llm", "systemone"],
  transport: {
    baseUrl: "https://jev-ai.pro/api/v1/systemone",
  },
  systemoneConfig: {
    baseUrl: "https://jev-ai.pro/api/v1/systemone",
  },
  passthroughModels: true,
  models: [
    { id: "jev-latest", name: "Jev Latest", kind: "systemone", kinds: ["llm", "systemone"] },
    { id: "jev-preview", name: "Jev Preview", kind: "systemone", kinds: ["llm", "systemone"] },
    { id: "jev-1.13.0", name: "Jev 1.13.0", kind: "systemone", kinds: ["llm", "systemone"] },
    { id: "jev-1.13", name: "Jev 1.13", kind: "systemone", kinds: ["llm", "systemone"] },
  ],
};
