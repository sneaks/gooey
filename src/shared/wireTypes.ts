export type WireType =
  | "model"
  | "tools"
  | "message"
  | "messages"
  | "stream"
  | "data"
  | "trigger"
  | "event"
  | "boolean"
  | "config";

export const WIRE_COLORS: Record<WireType, string> = {
  model: "#a855f7",    // purple
  tools: "#f97316",    // orange
  message: "#3b82f6",  // blue
  messages: "#3b82f6", // blue
  stream: "#22c55e",   // green
  data: "#9ca3af",     // gray
  trigger: "#eab308",  // yellow
  event: "#06b6d4",    // cyan
  boolean: "#ef4444",  // red
  config: "#8b5cf6",   // violet
};

// Type compatibility: source type → set of acceptable target types
const COMPAT: Record<WireType, WireType[]> = {
  model: ["model", "data"],
  tools: ["tools", "data"],
  message: ["message", "data"],
  messages: ["messages", "data"],
  stream: ["stream", "data"],
  data: ["data", "message"],
  trigger: ["trigger"],
  event: ["event", "data"],
  boolean: ["boolean", "data"],
  config: ["config", "data"],
};

export function isTypeCompatible(
  sourceType: WireType,
  targetType: WireType
): boolean {
  return COMPAT[sourceType]?.includes(targetType) ?? false;
}
