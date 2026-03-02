import type { NodeDefinition } from "../shared/graphTypes";

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // === Core Pipeline ===
  {
    type: "llm-provider",
    label: "LLM Provider",
    category: "core",
    icon: "🧠",
    inputs: [],
    outputs: [{ id: "model", label: "Model", type: "model" }],
    config: [
      {
        key: "provider",
        label: "Provider",
        type: "select",
        default: "anthropic",
        options: [
          { label: "Anthropic", value: "anthropic" },
          { label: "OpenAI", value: "openai" },
          { label: "Google", value: "google" },
          { label: "xAI", value: "xai" },
          { label: "Groq", value: "groq" },
        ],
      },
      {
        key: "modelId",
        label: "Model",
        type: "select",
        default: "claude-sonnet-4-20250514",
        options: [
          { label: "Claude Sonnet 4", value: "claude-sonnet-4-20250514" },
          { label: "Claude Opus 4.5", value: "claude-opus-4-5" },
          { label: "GPT-4o", value: "gpt-4o" },
          { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
        ],
      },
      {
        key: "thinkingLevel",
        label: "Thinking",
        type: "select",
        default: "off",
        options: [
          { label: "Off", value: "off" },
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ],
      },
      {
        key: "apiKeyEnvVar",
        label: "API Key Env Var",
        type: "string",
        default: "ANTHROPIC_API_KEY",
        description: "Environment variable name (resolved server-side)",
      },
    ],
  },
  {
    type: "agent",
    label: "Agent",
    category: "core",
    icon: "🤖",
    inputs: [
      { id: "model", label: "Model", type: "model", required: true },
      { id: "tools", label: "Tools", type: "tools", multiple: true },
      { id: "systemPrompt", label: "System Prompt", type: "message" },
      { id: "userMessage", label: "User Message", type: "message", required: true },
      { id: "context", label: "Context", type: "messages" },
    ],
    outputs: [
      { id: "response", label: "Response", type: "stream" },
      { id: "messages", label: "Messages", type: "messages" },
      { id: "done", label: "Done", type: "trigger" },
    ],
    config: [
      { key: "maxTurns", label: "Max Turns", type: "number", default: 10 },
      { key: "compactionEnabled", label: "Auto-Compact", type: "boolean", default: false },
    ],
  },
  {
    type: "tool",
    label: "Tool",
    category: "core",
    icon: "🔧",
    inputs: [],
    outputs: [{ id: "tool", label: "Tool", type: "tools" }],
    config: [
      {
        key: "toolType",
        label: "Tool Type",
        type: "select",
        default: "read",
        options: [
          { label: "Read", value: "read" },
          { label: "Bash", value: "bash" },
          { label: "Edit", value: "edit" },
          { label: "Write", value: "write" },
          { label: "Grep", value: "grep" },
          { label: "Find", value: "find" },
          { label: "LS", value: "ls" },
        ],
      },
      { key: "cwd", label: "Working Directory", type: "string", default: "." },
    ],
  },
  {
    type: "prompt-template",
    label: "Prompt Template",
    category: "core",
    icon: "📝",
    inputs: [],
    outputs: [{ id: "content", label: "Content", type: "message" }],
    config: [
      { key: "content", label: "Template", type: "textarea", default: "" },
    ],
  },

  // === I/O & Triggers ===
  {
    type: "prompt-input",
    label: "Prompt Input",
    category: "io",
    icon: "💬",
    inputs: [],
    outputs: [{ id: "prompt", label: "Prompt", type: "message" }],
    config: [
      { key: "prompt", label: "Prompt", type: "textarea", default: "" },
    ],
  },
  {
    type: "output",
    label: "Output",
    category: "io",
    icon: "📤",
    inputs: [
      { id: "input", label: "Input", type: "stream", required: true },
    ],
    outputs: [],
    config: [
      {
        key: "format",
        label: "Format",
        type: "select",
        default: "markdown",
        options: [
          { label: "Markdown", value: "markdown" },
          { label: "Plain Text", value: "plain" },
          { label: "JSON", value: "json" },
        ],
      },
    ],
  },

  // === Safety & Control ===
  {
    type: "gate",
    label: "Gate",
    category: "safety",
    icon: "🛡️",
    inputs: [{ id: "input", label: "Input", type: "data", required: true }],
    outputs: [
      { id: "approved", label: "Approved", type: "data" },
      { id: "rejected", label: "Rejected", type: "data" },
    ],
    config: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        default: "confirm",
        options: [
          { label: "Auto-Approve", value: "auto-approve" },
          { label: "Confirm", value: "confirm" },
          { label: "Block", value: "block" },
        ],
      },
      {
        key: "patterns",
        label: "Patterns (regex, one per line)",
        type: "textarea",
        default: "rm\\s+-rf\nsudo\nchmod.*777",
      },
      {
        key: "message",
        label: "Confirmation Message",
        type: "string",
        default: "Allow this operation?",
      },
    ],
  },

  // === Router ===
  {
    type: "router",
    label: "Router",
    category: "core",
    icon: "🔀",
    inputs: [{ id: "input", label: "Input", type: "data", required: true }],
    outputs: [
      { id: "route-1", label: "Route 1", type: "data" },
      { id: "route-2", label: "Route 2", type: "data" },
      { id: "default", label: "Default", type: "data" },
    ],
    config: [
      {
        key: "routingMode",
        label: "Routing Mode",
        type: "select",
        default: "contains",
        options: [
          { label: "Contains", value: "contains" },
          { label: "Regex", value: "regex" },
          { label: "JSON Path", value: "jsonpath" },
        ],
      },
      {
        key: "rules",
        label: "Rules (JSON)",
        type: "json",
        default: '[{"pattern": "error", "output": "route-1"}, {"pattern": "success", "output": "route-2"}]',
      },
    ],
  },

  // === Subagent ===
  {
    type: "subagent",
    label: "Subagent",
    category: "core",
    icon: "👥",
    inputs: [
      { id: "task", label: "Task", type: "message", required: true },
      { id: "context", label: "Context", type: "messages" },
    ],
    outputs: [
      { id: "result", label: "Result", type: "data" },
      { id: "messages", label: "Messages", type: "messages" },
      { id: "usage", label: "Usage", type: "data" },
    ],
    config: [
      { key: "agentName", label: "Agent Name", type: "string", default: "" },
      {
        key: "mode",
        label: "Mode",
        type: "select",
        default: "single",
        options: [
          { label: "Single", value: "single" },
          { label: "Parallel", value: "parallel" },
          { label: "Chain", value: "chain" },
        ],
      },
      {
        key: "agentScope",
        label: "Agent Scope",
        type: "select",
        default: "user",
        options: [
          { label: "User", value: "user" },
          { label: "Project", value: "project" },
          { label: "Both", value: "both" },
        ],
      },
    ],
  },
  // === Protected Path ===
  {
    type: "protected-path",
    label: "Protected Path",
    category: "safety",
    icon: "🔒",
    inputs: [{ id: "agent", label: "Agent", type: "data" }],
    outputs: [{ id: "constraint", label: "Constraint", type: "config" }],
    config: [
      {
        key: "paths",
        label: "Protected Paths (one per line)",
        type: "textarea",
        default: "/etc\n/usr\n~/.ssh",
      },
      {
        key: "mode",
        label: "Mode",
        type: "select",
        default: "block-writes",
        options: [
          { label: "Block Writes", value: "block-writes" },
          { label: "Block All", value: "block-all" },
          { label: "Warn Only", value: "warn" },
        ],
      },
    ],
  },

  // === Tool Set ===
  {
    type: "tool-set",
    label: "Tool Set",
    category: "core",
    icon: "🧰",
    inputs: [],
    outputs: [{ id: "tools", label: "Tools", type: "tools" }],
    config: [
      {
        key: "preset",
        label: "Preset",
        type: "select",
        default: "coding",
        options: [
          { label: "Coding (read/bash/edit/write)", value: "coding" },
          { label: "Read-Only (read/grep/find/ls)", value: "readonly" },
          { label: "All Tools", value: "all" },
          { label: "Custom", value: "custom" },
        ],
      },
      {
        key: "customTools",
        label: "Custom Tools (comma-separated)",
        type: "string",
        default: "",
        description: "Only used when preset is Custom",
      },
    ],
  },

  // === Memory / Context ===
  {
    type: "memory",
    label: "Memory",
    category: "core",
    icon: "🧠",
    inputs: [{ id: "messages", label: "Messages In", type: "messages" }],
    outputs: [{ id: "context", label: "Context", type: "messages" }],
    config: [
      {
        key: "strategy",
        label: "Strategy",
        type: "select",
        default: "full-history",
        options: [
          { label: "Full History", value: "full-history" },
          { label: "Sliding Window", value: "sliding-window" },
          { label: "Summary", value: "summary" },
        ],
      },
      {
        key: "maxMessages",
        label: "Max Messages",
        type: "number",
        default: 100,
      },
      {
        key: "windowSize",
        label: "Window Size",
        type: "number",
        default: 20,
        description: "For sliding-window strategy",
      },
      {
        key: "summarizeAfter",
        label: "Summarize After",
        type: "number",
        default: 50,
        description: "For summary strategy",
      },
    ],
  },
];

// Index by type for fast lookup
export const NODE_DEFS_BY_TYPE: Record<string, NodeDefinition> = {};
for (const def of NODE_DEFINITIONS) {
  NODE_DEFS_BY_TYPE[def.type] = def;
}
