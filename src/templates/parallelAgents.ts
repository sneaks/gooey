import type { GraphJSON } from "../shared/graphTypes";

/**
 * Parallel Agents template:
 * Two agents run in parallel on the same prompt, outputs merged.
 *
 * [Prompt Input] ──→ [Agent 1] ──→ [Merge] ──→ [Output]
 *        │                            ↑
 *        └──────────→ [Agent 2] ──────┘
 *
 * [LLM Provider] ──→ both agents
 */
export const PARALLEL_AGENTS_TEMPLATE: GraphJSON = {
  version: 1,
  nodes: [
    {
      id: "prompt-input-1",
      type: "prompt-input",
      position: { x: 50, y: 250 },
      data: { prompt: "Write a haiku about coding" },
    },
    {
      id: "llm-provider-1",
      type: "llm-provider",
      position: { x: 50, y: 50 },
      data: { provider: "anthropic", modelId: "claude-sonnet-4-20250514", thinkingLevel: "off", apiKeyEnvVar: "ANTHROPIC_API_KEY" },
    },
    {
      id: "agent-1",
      type: "agent",
      position: { x: 350, y: 100 },
      data: { maxTurns: 1, compactionEnabled: false },
    },
    {
      id: "agent-2",
      type: "agent",
      position: { x: 350, y: 380 },
      data: { maxTurns: 1, compactionEnabled: false },
    },
    {
      id: "merge-1",
      type: "merge",
      position: { x: 650, y: 230 },
      data: { strategy: "concatenate", separator: "\\n\\n---\\n\\n" },
    },
    {
      id: "output-1",
      type: "output",
      position: { x: 950, y: 230 },
      data: { format: "markdown" },
    },
  ],
  edges: [
    { id: "e1", source: "llm-provider-1", sourceHandle: "model", target: "agent-1", targetHandle: "model" },
    { id: "e2", source: "llm-provider-1", sourceHandle: "model", target: "agent-2", targetHandle: "model" },
    { id: "e3", source: "prompt-input-1", sourceHandle: "prompt", target: "agent-1", targetHandle: "userMessage" },
    { id: "e4", source: "prompt-input-1", sourceHandle: "prompt", target: "agent-2", targetHandle: "userMessage" },
    { id: "e5", source: "agent-1", sourceHandle: "response", target: "merge-1", targetHandle: "input-1" },
    { id: "e6", source: "agent-2", sourceHandle: "response", target: "merge-1", targetHandle: "input-2" },
    { id: "e7", source: "merge-1", sourceHandle: "output", target: "output-1", targetHandle: "input" },
  ],
};
