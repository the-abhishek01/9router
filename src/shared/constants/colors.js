// Stitch-inspired Obsidian Hyper-Router palette for Aris Gateway
// Dark theme: Deep obsidian surfaces with electric emerald telemetry accents

export const COLORS = {
  // Primary - Electric Emerald
  primary: {
    DEFAULT: "#10B981",
    hover: "#059669",
    light: "#34D399",
    dark: "#047857",
  },

  // Light theme backgrounds
  light: {
    bg: "#F8FAFC",
    bgAlt: "#F1F5F9",
    surface: "#FFFFFF",
    sidebar: "rgba(248, 250, 252, 0.85)",
    border: "rgba(0, 0, 0, 0.08)",
    textMain: "#0F172A",
    textMuted: "#64748B",
  },

  // Dark theme backgrounds (Stitch Obsidian Palette)
  dark: {
    bg: "#090A0F",
    bgAlt: "#0E1117",
    surface: "#121620",
    sidebar: "rgba(14, 17, 23, 0.92)",
    border: "rgba(255, 255, 255, 0.08)",
    textMain: "#F8FAFC",
    textMuted: "#94A3B8",
  },

  // Status colors
  status: {
    success: "#10B981",
    successLight: "#D1FAE5",
    successDark: "#065F46",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningDark: "#92400E",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    errorDark: "#991B1B",
    info: "#3B82F6",
    infoLight: "#DBEAFE",
    infoDark: "#1E40AF",
  },
};

// CSS Variables mapping for Tailwind
export const CSS_VARIABLES = {
  light: {
    "--color-primary": COLORS.primary.DEFAULT,
    "--color-primary-hover": COLORS.primary.hover,
    "--color-bg": COLORS.light.bg,
    "--color-bg-alt": COLORS.light.bgAlt,
    "--color-surface": COLORS.light.surface,
    "--color-sidebar": COLORS.light.sidebar,
    "--color-border": COLORS.light.border,
    "--color-text-main": COLORS.light.textMain,
    "--color-text-muted": COLORS.light.textMuted,
  },
  dark: {
    "--color-primary": COLORS.primary.DEFAULT,
    "--color-primary-hover": COLORS.primary.hover,
    "--color-bg": COLORS.dark.bg,
    "--color-bg-alt": COLORS.dark.bgAlt,
    "--color-surface": COLORS.dark.surface,
    "--color-sidebar": COLORS.dark.sidebar,
    "--color-border": COLORS.dark.border,
    "--color-text-main": COLORS.dark.textMain,
    "--color-text-muted": COLORS.dark.textMuted,
  },
};
