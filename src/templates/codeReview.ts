import type { GraphJSON } from "../shared/graphTypes";

/**
 * Code Review template:
 * [Prompt Input] ──→ [Agent] ──→ [Output]
 *                      ↑
 * [LLM Provider] ──────┤
 *                      ↑
 * [Tool Set: readonly] ─┘
 */
export const CODE_REVIEW_TEMPLATE: GraphJSON = {
  version: 1,
  nodes: [
    {
      id: "prompt-input-1",
      type: "prompt-input",
      position: { x: 50, y: 200 },
      data: { prompt: "Review the code in src/ for bugs, style issues, and potential improvements." },
    },
    {
      id: "llm-provider-1",
      type: "llm-provider",
      position: { x: 50, y: 50 },
      data: { provider: "anthropic", modelId: "claude-sonnet-4-20250514", thinkingLevel: "off", apiKeyEnvVar: "ANTHROPIC_API_KEY" },
    },
    {
      id: "tool-set-1",
      type: "tool-set",
      position: { x: 50, y: 380 },
      data: { preset: "readonly" },
    },
    {
      id: "agent-1",
      type: "agent",
      position: { x: 350, y: 180 },
      data: { maxTurns: 5, compactionEnabled: false },
    },
    {
      id: "output-1",
      type: "output",
      position: { x: 650, y: 200 },
      data: { format: "markdown" },
    },
  ],
  edges: [
    { id: "e1", source: "llm-provider-1", sourceHandle: "model", target: "agent-1", targetHandle: "model" },
    { id: "e2", source: "prompt-input-1", sourceHandle: "prompt", target: "agent-1", targetHandle: "userMessage" },
    { id: "e3", source: "tool-set-1", sourceHandle: "tools", target: "agent-1", targetHandle: "tools" },
    { id: "e4", source: "agent-1", sourceHandle: "response", target: "output-1", targetHandle: "input" },
  ],
};
