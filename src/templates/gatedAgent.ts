import type { GraphJSON } from "../shared/graphTypes";

/**
 * Gated Agent template:
 * [Prompt Input] ──→ [Agent] ──→ [Gate] ──→ [Output]
 *                      ↑
 * [LLM Provider] ──────┤
 *                      ↑
 * [Tool: bash] ─────────┘
 *
 * The gate intercepts the agent's output for approval before it reaches the output.
 */
export const GATED_AGENT_TEMPLATE: GraphJSON = {
  version: 1,
  nodes: [
    {
      id: "prompt-input-1",
      type: "prompt-input",
      position: { x: 50, y: 200 },
      data: { prompt: "List the files in the current directory" },
    },
    {
      id: "llm-provider-1",
      type: "llm-provider",
      position: { x: 50, y: 50 },
      data: { provider: "anthropic", modelId: "claude-sonnet-4-20250514", thinkingLevel: "off", apiKeyEnvVar: "ANTHROPIC_API_KEY" },
    },
    {
      id: "tool-1",
      type: "tool",
      position: { x: 50, y: 380 },
      data: { toolType: "bash", cwd: "." },
    },
    {
      id: "agent-1",
      type: "agent",
      position: { x: 350, y: 180 },
      data: { maxTurns: 3, compactionEnabled: false },
    },
    {
      id: "gate-1",
      type: "gate",
      position: { x: 650, y: 200 },
      data: { mode: "confirm", patterns: "rm\\s+-rf\nsudo", message: "Approve this output?" },
    },
    {
      id: "output-1",
      type: "output",
      position: { x: 950, y: 200 },
      data: { format: "markdown" },
    },
  ],
  edges: [
    { id: "e1", source: "llm-provider-1", sourceHandle: "model", target: "agent-1", targetHandle: "model" },
    { id: "e2", source: "prompt-input-1", sourceHandle: "prompt", target: "agent-1", targetHandle: "userMessage" },
    { id: "e3", source: "tool-1", sourceHandle: "tool", target: "agent-1", targetHandle: "tools" },
    { id: "e4", source: "agent-1", sourceHandle: "response", target: "gate-1", targetHandle: "input" },
    { id: "e5", source: "gate-1", sourceHandle: "approved", target: "output-1", targetHandle: "input" },
  ],
};
