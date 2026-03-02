import type { NodeCategory } from "../shared/graphTypes";

export const colors = {
  bg: "#1a1a2e",
  bgSecondary: "#16213e",
  bgTertiary: "#0f3460",
  surface: "#1e293b",
  surfaceHover: "#334155",
  border: "#334155",
  borderActive: "#60a5fa",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  accent: "#60a5fa",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
  // Node header colors by category
  nodeCore: "#3b82f6",
  nodeIo: "#22c55e",
  nodeSafety: "#ef4444",
  nodeIntegration: "#a855f7",
  nodeUtility: "#6b7280",
};

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  core: colors.nodeCore,
  io: colors.nodeIo,
  safety: colors.nodeSafety,
  integration: colors.nodeIntegration,
  utility: colors.nodeUtility,
};

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  core: "Core Pipeline",
  io: "I/O & Triggers",
  safety: "Safety & Control",
  integration: "Integrations",
  utility: "Utility",
};
