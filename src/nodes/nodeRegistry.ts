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
          { label: "OpenRouter", value: "openrouter" },
          { label: "OpenAI Compatible", value: "openai-compatible" },
          { label: "Google", value: "google" },
          { label: "xAI", value: "xai" },
          { label: "Groq", value: "groq" },
        ],
      },
      {
        key: "modelId",
        label: "Model",
        type: "string",
        default: "claude-sonnet-4-20250514",
        description: "Model ID (e.g., claude-sonnet-4-20250514, gpt-4o, llama-3.1)",
      },
      {
        key: "baseURL",
        label: "Base URL",
        type: "string",
        default: "",
        description: "For OpenRouter/OpenAI Compatible (e.g., https://openrouter.ai/v1, http://localhost:11434/v1)",
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
        description: "Leave empty for local LLMs (Ollama, LM Studio, vLLM)",
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
      { id: "textOutput", label: "Text Output", type: "message" },
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
    outputs: [
      { id: "passthrough", label: "Passthrough", type: "data" },
    ],
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
  // === v0.3 — Triggers ===
  {
    type: "file-trigger",
    label: "File Trigger",
    category: "io",
    icon: "📁",
    inputs: [],
    outputs: [
      { id: "content", label: "Content", type: "data" },
      { id: "path", label: "Path", type: "data" },
      { id: "trigger", label: "Trigger", type: "trigger" },
    ],
    config: [
      { key: "watchPath", label: "Watch Path", type: "string", default: "." },
      {
        key: "events",
        label: "Events",
        type: "select",
        default: "change",
        options: [
          { label: "Change", value: "change" },
          { label: "Create", value: "create" },
          { label: "Delete", value: "delete" },
          { label: "All", value: "all" },
        ],
      },
      { key: "glob", label: "Glob Pattern", type: "string", default: "", description: "e.g. **/*.ts" },
      { key: "debounceMs", label: "Debounce (ms)", type: "number", default: 500 },
    ],
  },
  {
    type: "webhook-trigger",
    label: "Webhook Trigger",
    category: "io",
    icon: "🌐",
    inputs: [],
    outputs: [
      { id: "body", label: "Body", type: "data" },
      { id: "headers", label: "Headers", type: "data" },
      { id: "trigger", label: "Trigger", type: "trigger" },
    ],
    config: [
      { key: "port", label: "Port", type: "number", default: 8080 },
      { key: "path", label: "Path", type: "string", default: "/webhook" },
      {
        key: "method",
        label: "Method",
        type: "select",
        default: "POST",
        options: [
          { label: "POST", value: "POST" },
          { label: "GET", value: "GET" },
          { label: "PUT", value: "PUT" },
        ],
      },
    ],
  },

  // === v0.3 — Utility ===
  {
    type: "transform",
    label: "Transform",
    category: "utility",
    icon: "⚡",
    inputs: [{ id: "input", label: "Input", type: "data", required: true }],
    outputs: [{ id: "output", label: "Output", type: "data" }],
    config: [
      {
        key: "language",
        label: "Language",
        type: "select",
        default: "javascript",
        options: [
          { label: "JavaScript", value: "javascript" },
          { label: "JSONPath", value: "jsonpath" },
        ],
      },
      {
        key: "code",
        label: "Code",
        type: "code",
        default: "// input is available as `data`\nreturn data;",
        description: "Transform function body. `data` is the input value.",
      },
    ],
  },
  {
    type: "merge",
    label: "Merge",
    category: "utility",
    icon: "🔗",
    inputs: [
      { id: "input-1", label: "Input 1", type: "data", required: true },
      { id: "input-2", label: "Input 2", type: "data" },
      { id: "input-3", label: "Input 3", type: "data" },
    ],
    outputs: [{ id: "output", label: "Output", type: "data" }],
    config: [
      {
        key: "strategy",
        label: "Strategy",
        type: "select",
        default: "concatenate",
        options: [
          { label: "Concatenate", value: "concatenate" },
          { label: "Array", value: "array" },
          { label: "Object Merge", value: "object" },
        ],
      },
      { key: "separator", label: "Separator", type: "string", default: "\\n", description: "For concatenate mode" },
    ],
  },
  {
    type: "split",
    label: "Split",
    category: "utility",
    icon: "✂️",
    inputs: [{ id: "input", label: "Input", type: "data", required: true }],
    outputs: [
      { id: "item-1", label: "Item 1", type: "data" },
      { id: "item-2", label: "Item 2", type: "data" },
      { id: "item-3", label: "Item 3", type: "data" },
    ],
    config: [
      {
        key: "splitMode",
        label: "Split Mode",
        type: "select",
        default: "lines",
        options: [
          { label: "Lines", value: "lines" },
          { label: "Delimiter", value: "delimiter" },
          { label: "JSON Array", value: "json-array" },
        ],
      },
      { key: "delimiter", label: "Delimiter", type: "string", default: ",", description: "For delimiter mode" },
    ],
  },

  // === v0.3 — Integrations ===
  {
    type: "slack",
    label: "Slack",
    category: "integration",
    icon: "💬",
    inputs: [{ id: "message", label: "Message", type: "message" }],
    outputs: [
      { id: "response", label: "Response", type: "data" },
      { id: "trigger", label: "Trigger", type: "trigger" },
    ],
    config: [
      {
        key: "action",
        label: "Action",
        type: "select",
        default: "send",
        options: [
          { label: "Send Message", value: "send" },
          { label: "Listen", value: "listen" },
        ],
      },
      { key: "channel", label: "Channel", type: "string", default: "#general" },
      { key: "botTokenEnvVar", label: "Bot Token Env Var", type: "string", default: "SLACK_BOT_TOKEN" },
    ],
  },
  // === v0.4 — Advanced ===
  {
    type: "handoff",
    label: "Handoff",
    category: "core",
    icon: "🤝",
    inputs: [
      { id: "context", label: "Context", type: "messages", required: true },
      { id: "model", label: "Model", type: "model" },
    ],
    outputs: [
      { id: "result", label: "Result", type: "data" },
      { id: "messages", label: "Messages", type: "messages" },
    ],
    config: [
      { key: "targetAgent", label: "Target Agent Name", type: "string", default: "" },
      {
        key: "summaryMode",
        label: "Summary Mode",
        type: "select",
        default: "auto",
        options: [
          { label: "Auto (LLM summarizes)", value: "auto" },
          { label: "Full Context", value: "full" },
          { label: "Last N Messages", value: "last-n" },
        ],
      },
      { key: "summaryCount", label: "Last N Messages", type: "number", default: 10, description: "For 'Last N' mode" },
      { key: "handoffPrompt", label: "Handoff Prompt", type: "textarea", default: "Continue the task with the following context:" },
    ],
  },
  {
    type: "remote-exec",
    label: "Remote Exec",
    category: "integration",
    icon: "🖥️",
    inputs: [{ id: "command", label: "Command", type: "data", required: true }],
    outputs: [
      { id: "stdout", label: "Stdout", type: "data" },
      { id: "stderr", label: "Stderr", type: "data" },
      { id: "exitCode", label: "Exit Code", type: "data" },
    ],
    config: [
      { key: "host", label: "Host", type: "string", default: "" },
      { key: "port", label: "Port", type: "number", default: 22 },
      { key: "user", label: "User", type: "string", default: "root" },
      {
        key: "authMethod",
        label: "Auth Method",
        type: "select",
        default: "key",
        options: [
          { label: "SSH Key", value: "key" },
          { label: "Password (env var)", value: "password" },
        ],
      },
      { key: "keyPath", label: "SSH Key Path", type: "string", default: "~/.ssh/id_rsa" },
      { key: "passwordEnvVar", label: "Password Env Var", type: "string", default: "" },
    ],
  },
  {
    type: "custom",
    label: "Custom Node",
    category: "utility",
    icon: "🧩",
    inputs: [
      { id: "input", label: "Input", type: "data" },
      { id: "config", label: "Config", type: "config" },
    ],
    outputs: [{ id: "output", label: "Output", type: "data" }],
    config: [
      { key: "customName", label: "Node Name", type: "string", default: "My Node" },
      { key: "description", label: "Description", type: "string", default: "" },
      {
        key: "executeCode",
        label: "Execute Code",
        type: "code",
        default: "// `data` is the input, `config` is the config input\nreturn data;",
        description: "JavaScript function body. Return the output value.",
      },
    ],
  },
  {
    type: "variable",
    label: "Variable",
    category: "utility",
    icon: "📌",
    inputs: [],
    outputs: [{ id: "value", label: "Value", type: "data" }],
    config: [
      { key: "varName", label: "Variable Name", type: "string", default: "" },
      { key: "value", label: "Value", type: "string", default: "" },
      { key: "envVar", label: "From Env Var", type: "string", default: "", description: "If set, value is read from this env var (server-side)" },
    ],
  },
];

// Index by type for fast lookup
export const NODE_DEFS_BY_TYPE: Record<string, NodeDefinition> = {};
for (const def of NODE_DEFINITIONS) {
  NODE_DEFS_BY_TYPE[def.type] = def;
}
