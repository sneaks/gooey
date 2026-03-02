import type { GraphJSON } from "../shared/graphTypes";

/**
 * Reference test graph: Research Agent
 *
 * [Prompt Input] ──→ [Agent] ──→ [Output]
 *                       ↑
 * [LLM Provider] ───────┤
 *                       ↑
 * [Tool: read] ──────────┤
 * [Tool: grep] ──────────┘
 */
export const RESEARCH_AGENT_TEMPLATE: GraphJSON = {
  version: 1,
  nodes: [
    {
      id: "prompt-input-1",
      type: "prompt-input",
      position: { x: 50, y: 200 },
      data: { prompt: "Summarize the README in this project" },
    },
    {
      id: "llm-provider-1",
      type: "llm-provider",
      position: { x: 50, y: 50 },
      data: {
        provider: "anthropic",
        modelId: "claude-sonnet-4-20250514",
        thinkingLevel: "off",
        apiKeyEnvVar: "ANTHROPIC_API_KEY",
      },
    },
    {
      id: "tool-1",
      type: "tool",
      position: { x: 50, y: 380 },
      data: { toolType: "read", cwd: "." },
    },
    {
      id: "tool-2",
      type: "tool",
      position: { x: 50, y: 480 },
      data: { toolType: "grep", cwd: "." },
    },
    {
      id: "agent-1",
      type: "agent",
      position: { x: 350, y: 180 },
      data: { maxTurns: 10, compactionEnabled: false },
    },
    {
      id: "output-1",
      type: "output",
      position: { x: 650, y: 200 },
      data: { format: "markdown" },
    },
  ],
  edges: [
    {
      id: "e-llm-agent",
      source: "llm-provider-1",
      sourceHandle: "model",
      target: "agent-1",
      targetHandle: "model",
    },
    {
      id: "e-prompt-agent",
      source: "prompt-input-1",
      sourceHandle: "prompt",
      target: "agent-1",
      targetHandle: "userMessage",
    },
    {
      id: "e-tool1-agent",
      source: "tool-1",
      sourceHandle: "tool",
      target: "agent-1",
      targetHandle: "tools",
    },
    {
      id: "e-tool2-agent",
      source: "tool-2",
      sourceHandle: "tool",
      target: "agent-1",
      targetHandle: "tools",
    },
    {
      id: "e-agent-output",
      source: "agent-1",
      sourceHandle: "response",
      target: "output-1",
      targetHandle: "input",
    },
  ],
};
