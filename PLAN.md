# Gooey — Visual Node-Graph Agent Pipeline Builder

## Context

Build a MaxMSP/Node-RED style visual canvas for composing agent pipelines on top of the pi-mono framework. Users connect typed nodes with wires to define how prompts flow through LLM providers, tools, subagents, gates, and outputs. The graph *is* the program.

**Target stack:** React + React Flow + TypeScript  
**Runtime integration:** `@mariozechner/pi-coding-agent` SDK (`createAgentSession`, `AgentSession`, extensions, tools)

---

## 1. Node Taxonomy (Validated & Expanded)

### Core Pipeline

| Node | Maps to pi-mono | Purpose |
|------|-----------------|---------|
| **LLM Provider** | `Model` from pi-ai, `ModelRegistry` | Configures provider/model/thinkingLevel. Exposes `Model` on output port. |
| **Agent** | `createAgentSession()` + `AgentSession` | The main execution unit. Input: model, tools, system prompt, user message. Output: assistant response stream. |
| **Tool** | `AgentTool` / built-in tools (`readTool`, `bashTool`, etc.) or custom `ToolDefinition` | Exposes a single tool. Output port connects to Agent's tool-set input. |
| **Tool Set** | `codingTools`, `readOnlyTools`, or custom arrays | Groups multiple tools into a set for an Agent node. |
| **Subagent** | Subagent extension pattern (`createAgentSession()` with isolated config) | Delegates task to named agent config. Input: task string. Output: result + usage. |
| **Memory / Context** | `SessionManager` + `AgentMessage[]` | Manages conversation state. Can inject, filter, or transform messages via `transformContext`. |
| **Router** | Custom logic node | Conditional branching: routes output to different downstream nodes based on content/regex/LLM classification. |
| **Handoff** | Handoff extension pattern (`newSession` + context transfer) | Summarizes current context and starts a new agent session with focused prompt. |
| **Prompt Template** | `PromptTemplate` / skill content | Stores reusable prompt text. Output: string content injected into Agent. |

### I/O & Triggers

| Node | Maps to pi-mono | Purpose |
|------|-----------------|---------|
| **Prompt Input** | Entry point (user text) | Graph entry node. Provides the initial user prompt. |
| **File Trigger** | `fs.watch` pattern (file-trigger extension) | Watches a file/directory, emits content when changed. |
| **Webhook Trigger** | New (HTTP listener) | Listens on a port, emits request body as data. |
| **Cron Trigger** | New (timer) | Emits on schedule. |
| **Output** | Sink node | Displays result in canvas UI, writes to file, or forwards to integration. |
| **Remote Exec** | SSH extension pattern (`createRemoteOps`) | Wraps tools with remote SSH operations. Modifies Tool nodes. |

### Safety / Control

| Node | Maps to pi-mono | Purpose |
|------|-----------------|---------|
| **Gate** | `tool_call` event handler pattern (permission-gate extension) | Intercepts wire traffic, prompts confirmation. Configurable patterns. |
| **Protected Path** | Protected-paths extension pattern | Blocks writes to specified paths. Attaches to Agent as a constraint. |
| **Rate Limiter** | New | Throttles requests per time window. Sits on any wire. |

### Integrations

| Node | Maps to pi-mono | Purpose |
|------|-----------------|---------|
| **Slack** | pi-mom patterns | Send/receive Slack messages. |
| **Web UI Output** | pi-web-ui | Renders result in browser component. |
| **TUI Output** | pi-tui | Renders in terminal (for hybrid workflows). |

### Utility

| Node | Purpose |
|------|---------|
| **Transform** | JavaScript/TypeScript function node. Input → custom transform → Output. |
| **Merge** | Combines multiple inputs into one (concatenate, array, object merge). |
| **Split** | Splits array/object into individual items for parallel processing. |
| **Delay** | Adds configurable delay to a wire. |
| **Log** | Logs wire traffic to console/file for debugging. |
| **Comment** | Non-functional annotation node for documentation. |

---

## 2. Node Schema

Every node has:

```typescript
interface NodeDefinition {
  type: string;                    // e.g. "llm-provider", "agent", "tool"
  label: string;                   // Display name
  category: "core" | "io" | "safety" | "integration" | "utility";
  icon: string;                    // Icon identifier
  
  inputs: PortDefinition[];        // Input ports
  outputs: PortDefinition[];       // Output ports
  config: ConfigField[];           // User-configurable properties (shown in inspector panel)
}

interface PortDefinition {
  id: string;                      // Unique within node
  label: string;
  type: WireType;                  // What kind of data flows through
  dataSchema?: JSONSchema;         // Optional: structured schema for validation
  multiple?: boolean;              // Can accept multiple connections (default: false)
  required?: boolean;              // Must be connected for node to execute
}

type WireType = 
  | "model"            // Model config object
  | "tools"            // AgentTool[] array
  | "message"          // AgentMessage or string
  | "messages"         // AgentMessage[] conversation history
  | "stream"           // Streaming assistant response (token events)
  | "data"             // Generic JSON/string data
  | "trigger"          // Control signal (no payload, just "go")
  | "event"            // Typed event from event bus
  | "boolean"          // For gates/routers
  | "config"           // Configuration object passthrough

interface ConfigField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select" | "code" | "json" | "model-picker";
  default?: any;
  options?: { label: string; value: any }[];  // For select type
  description?: string;
}
```

### Key Node Schemas

#### LLM Provider
- **Inputs:** none
- **Outputs:** `model` (Model object)
- **Config:** provider (select: anthropic/openai/google/...), modelId (select, filtered by provider), thinkingLevel (select), apiKeyEnvVar (string)

#### Agent
- **Inputs:** `model` (required), `tools` (multiple, optional), `systemPrompt` (message, optional), `userMessage` (message, required), `context` (messages, optional)
- **Outputs:** `response` (stream), `messages` (conversation history after run), `done` (trigger, fires on completion)
- **Config:** maxTurns (number), compactionEnabled (boolean)

#### Tool
- **Inputs:** none (or `config` for parameterized tools)
- **Outputs:** `tool` (single AgentTool)
- **Config:** toolType (select: read/bash/edit/write/grep/find/ls/custom), cwd (string), for custom: name, description, parameterSchema (json), executeCode (code)

#### Router
- **Inputs:** `input` (data)
- **Outputs:** dynamic named outputs (user adds/removes routes)
- **Config:** routingMode (select: regex/contains/llm-classify/jsonpath), rules (json array of {pattern, outputPort})

#### Gate
- **Inputs:** `input` (data)
- **Outputs:** `approved` (data), `rejected` (data)
- **Config:** mode (select: auto-approve/confirm/block), patterns (string[], regex patterns to match), message (string, confirmation prompt)

#### Subagent
- **Inputs:** `task` (message, required), `context` (messages, optional)
- **Outputs:** `result` (data), `messages` (full conversation), `usage` (data)
- **Config:** agentName (string), agentScope (select: user/project/both), model (string, optional override), tools (string[], optional), systemPrompt (code)

---

## 3. Wire Semantics

### Edge Data Model

Informed by the event-bus extension pattern (`pi.events.on/emit`):

```typescript
interface WireDefinition {
  id: string;
  source: { nodeId: string; portId: string };
  target: { nodeId: string; portId: string };
  type: WireType;                   // Must match source output type
  
  // Visual
  animated?: boolean;               // Animated dash for active/streaming wires
  color?: string;                   // Derived from WireType
}
```

### What flows over wires

| WireType | Payload | Semantics |
|----------|---------|-----------|
| `model` | `Model` object from pi-ai | Static config, evaluated once at graph start |
| `tools` | `AgentTool[]` | Collected from multiple Tool nodes, merged into array |
| `message` | `string \| AgentMessage` | Single message (prompt, response, custom) |
| `messages` | `AgentMessage[]` | Full conversation context |
| `stream` | `AsyncIterable<AgentEvent>` | Live token stream from agent. Consumers see `message_update`, `tool_execution_*`, etc. |
| `data` | `any` (JSON-serializable) | Generic structured data between utility nodes |
| `trigger` | `void` | Control signal. No data — just "this node completed" |
| `event` | `{ type: string; payload: any }` | Named event (mirrors `pi.events` bus) |
| `boolean` | `boolean` | Gate/router decisions |
| `config` | `Record<string, any>` | Configuration passthrough |

### Wire Colors (by type)

| Type | Color |
|------|-------|
| model | purple |
| tools | orange |
| message/messages | blue |
| stream | green (animated) |
| data | gray |
| trigger | yellow |
| event | cyan |
| boolean | red |

### Type Compatibility

Wires enforce type compatibility: a `message` output can connect to a `message` or `data` input (data is a supertype), but a `model` output cannot connect to a `message` input. The editor validates connections on drag.

---

## 4. Execution Model

### How the graph maps to pi-agent-core's runtime

**Key insight:** The graph is not a simple DAG executor. Agent nodes run `createAgentSession()` which has its own internal loop (turn_start → LLM call → tool_call → tool_result → turn_end → repeat). The graph orchestrates *between* agent sessions, not within them.

### Execution Phases

1. **Resolve static config** — Traverse the graph topologically. Evaluate nodes with no dependencies first (LLM Provider, Tool, Prompt Template, constants). These produce their outputs synchronously.

2. **Collect inputs** — For each Agent node, gather: model (from LLM Provider), tools (from connected Tool/ToolSet nodes), system prompt (from Prompt Template), user message (from Prompt Input or upstream node).

3. **Execute Agent nodes** — Call `createAgentSession()` with collected config:
   ```typescript
   const { session } = await createAgentSession({
     model: resolvedModel,
     tools: collectedTools,
     sessionManager: SessionManager.inMemory(),
     // extensions from connected Gate/ProtectedPath nodes become event handlers
   });
   
   session.subscribe((event) => {
     // Forward events to connected stream outputs
     // Update canvas UI with streaming state
   });
   
   await session.prompt(userMessage);
   ```

4. **Propagate results** — When an Agent completes, push its output to downstream nodes (Output, Router, another Agent, Transform, etc.)

5. **Handle branching** — Router nodes inspect the output and activate one of their output ports, continuing execution down that branch.

6. **Handle loops** — If the graph has cycles (e.g., Router → Agent → Router for retry loops), maintain a max-iteration count to prevent infinite loops.

### Safety nodes as middleware

Gate and ProtectedPath nodes don't run as separate execution steps. Instead, they compile into event handlers attached to the Agent's extension runtime:

```typescript
// Gate node compiles to:
pi.on("tool_call", async (event, ctx) => {
  if (gateConfig.patterns.some(p => new RegExp(p).test(event.input.command))) {
    // Emit to Gate node's UI for confirmation
    const approved = await confirmInCanvas(gateNodeId, event);
    if (!approved) return { block: true, reason: "Blocked by gate" };
  }
});
```

### Parallel execution

Multiple Agent nodes that don't depend on each other execute concurrently (Promise.all). The canvas shows live streaming state for all active agents simultaneously.

### Graph Compilation

The graph is compiled to an execution plan before running:

```typescript
interface ExecutionPlan {
  steps: ExecutionStep[];       // Topologically sorted
  parallelGroups: string[][];   // Steps that can run concurrently
}

interface ExecutionStep {
  nodeId: string;
  type: string;
  inputs: Map<string, { sourceNodeId: string; sourcePortId: string }>;
  config: Record<string, any>;
}
```

---

## 5. MVP Feature Scope

### Phase 0 (v0.0) — UX Prototype (no backend)

**Goal:** Validate the visual design and interaction model with hardcoded mock data. No backend, no pi SDK, no WebSocket. Pure React + React Flow.

- [ ] **Canvas** — React Flow canvas with pan/zoom, grid snap
- [ ] **All node types through v0.2 rendered with mock data** (prototyping complex interactions early, ahead of implementation schedule):
  - Prompt Input — text entry, editable
  - LLM Provider — model picker dropdown (hardcoded model list)
  - Agent — shows mock streaming state (idle → running → done)
  - Tool — tool type selector with config fields
  - Output — displays mock streaming text
  - Gate — shows mock confirmation dialog inline
  - Router — dynamic output ports, rule display
  - Subagent — shows mock parallel/chain status
- [ ] **Wire system** — Typed connections with color coding, drag-to-connect, type validation on connect
- [ ] **Inspector panel** — Right sidebar: click node → shows editable config fields
- [ ] **Mock execution** — "Run" button fires mock events via `setTimeout` to simulate:
  - Node state transitions (idle → running → done)
  - Token streaming in Output node (character-by-character mock text)
  - Animated wires during "execution"
  - Gate node showing confirmation prompt, waiting for click
- [ ] **Persistence** — Save/load graph as JSON (localStorage for prototype)
- [ ] **Sidebar** — Draggable node palette organized by category

**Mock execution strategy:** Phase 0 has no WebSocket backend, so `wsClient.ts` is replaced by `mockRunner.ts` which fires the same `ServerMessage` events locally via `setTimeout`. The Zustand store's `handleServerMessage` works identically in both phases — Phase 1 just swaps the event source from mock to real WebSocket. Use a `VITE_MOCK_MODE=true` env flag (default in Phase 0) to select the mock runner.

**What this validates:** All node types look right, wiring feels intuitive, inspector is usable, the streaming animation conveys execution state clearly. No real AI calls — just the UX shell.

### Phase 1 (v0.1) — Wire up real backend

**Goal:** Replace mock events with actual pi SDK execution via WebSocket backend.

- [ ] **Backend server** — Express + ws, receives graph JSON, runs ExecutionPlan
- [ ] **WebSocket client** — Browser connects, sends run/stop, receives streamed events
- [ ] **Swap mock state for real state** — Nodes already exist from Phase 0, just replace `setTimeout` mock events with `handleServerMessage` dispatching real `ServerMessage` events
- [ ] **Agent execution** — `createAgentSession()` on backend, stream `AgentEvent`s to canvas
- [ ] **Tool execution** — Built-in tools (read, bash, edit, write) run server-side
- [ ] **Gate flow** — Backend sends `gate_request`, canvas shows confirmation, sends `gate_response`
- [ ] **API key resolution** — `.env` on server, LLM Provider config stores env var name only

- [ ] **Persistence migration** — Migrate from localStorage (Phase 0) to file-system JSON. Existing prototype graphs exportable from localStorage to file.

**What this enables:** The user visually wires up an LLM provider → agent → output, configures the model and tools, types a prompt, hits run, and sees the real streaming response. Equivalent to a basic `pi` session but visual.

### v0.2 — Multi-agent & safety

- [ ] Subagent node (parallel + chain modes)
- [ ] Router node (conditional branching)
- [ ] Gate node (confirmation dialogs in canvas)
- [ ] Protected Path node
- [ ] Tool Set node (group tools)
- [ ] Memory/Context node (persist conversation across runs)
- [ ] Multiple Agent nodes in one graph (parallel execution)

### v0.3 — Triggers & integrations

- [ ] File Trigger node
- [ ] Webhook Trigger node
- [ ] Transform node (custom JS/TS)
- [ ] Merge/Split nodes
- [ ] Slack integration node
- [ ] Graph templates / presets

### v0.4 — Advanced

- [ ] Handoff node
- [ ] Remote Exec node (SSH)
- [ ] Custom node API (user-defined nodes via extensions)
- [ ] Graph-level variables and environment management
- [ ] Undo/redo
- [ ] Minimap, node search, keyboard shortcuts
- [ ] Export graph as standalone pi extension

---

## 6. Architecture

### Browser ↔ Backend Split

**Decision:** Browser (React + React Flow) ↔ WebSocket ↔ Node.js backend (Express + ws)

The backend owns all pi SDK calls. The browser is pure UI — no pi SDK dependency, no secrets exposure.

#### Backend Responsibilities
- Receives graph JSON from browser
- Compiles `ExecutionPlan` (topological sort, validation)
- Runs agent sessions via pi SDK (`createAgentSession`, `AgentSession`)
- Streams `AgentEvent`s to browser over WebSocket
- Manages session lifecycle (start, stop, pause)
- Resolves env vars / API keys server-side (never exposed to browser)

#### Browser Responsibilities
- Renders React Flow canvas with typed nodes and edges
- Sends graph JSON + run/stop commands to backend
- Receives streamed execution events, updates node visual state in real-time
- Handles Gate node confirmation UI (receives request, sends approval/rejection)

### WebSocket Message Protocol

```typescript
// Browser → Backend
type ClientMessage =
  | { type: "run"; graph: GraphJSON }
  | { type: "stop" }
  | { type: "gate_response"; commandId: string; approved: boolean }

// Backend → Browser
type ServerMessage =
  | { type: "node_state"; nodeId: string; status: "running" | "done" | "error" }
  | { type: "stream_token"; nodeId: string; token: string }
  | { type: "tool_call"; nodeId: string; tool: string; input: any }
  | { type: "tool_result"; nodeId: string; tool: string; output: any }
  | { type: "gate_request"; nodeId: string; message: string; commandId: string }
  | { type: "error"; nodeId: string; message: string }
  | { type: "done" }
```

### Gate Node Resolution Flow

1. Backend encounters Gate node during agent execution (tool_call event matches gate pattern)
2. Backend sends `gate_request` to browser with `commandId`
3. Canvas renders confirmation UI on the Gate node
4. User approves/rejects → browser sends `gate_response` with `commandId`
5. Backend unblocks the agent session and continues or blocks the tool call

### Secrets / Environment

API keys live in `.env` on the Node server. LLM Provider node config stores only the env var name (e.g. `ANTHROPIC_API_KEY`). Backend resolves `process.env[envVarName]` at runtime — never sent to browser.

### MVP Transport

WebSocket on `ws://localhost:4242` for local dev. No auth for MVP — single user, local machine only.

### Project Structure

```
src/
├── server/                        # Node.js backend (Express + ws)
│   ├── index.ts                   # Express + WebSocket server entry point
│   ├── graphRunner.ts             # Receives GraphJSON, compiles & runs ExecutionPlan
│   ├── sessionPool.ts             # Tracks active AgentSession instances by runId
│   └── nodeExecutors/             # Server-side execution (uses pi SDK directly)
│       ├── agentExecutor.ts       # createAgentSession + prompt + event streaming
│       ├── llmProviderExecutor.ts # Resolve Model from config via ModelRegistry
│       ├── toolExecutor.ts        # Create AgentTool from config via tool factories
│       ├── routerExecutor.ts      # Evaluate routing rules
│       └── index.ts               # Registry of executors by node type
│
├── app/                           # Browser React app
│   ├── App.tsx                    # Main layout: sidebar + canvas + inspector
│   ├── store.ts                   # Zustand store for graph state + WS event handling
│   ├── theme.ts                   # Colors, wire type → color map
│   └── wsClient.ts               # WebSocket client, dispatches ServerMessages to store
│
├── canvas/
│   ├── Canvas.tsx                 # React Flow wrapper, handles connections
│   ├── MiniMap.tsx                # Minimap overlay
│   └── Controls.tsx               # Zoom, fit, run button
│
├── nodes/
│   ├── BaseNode.tsx               # Shared node chrome (header, ports, collapse)
│   ├── PromptInputNode.tsx        # Text input with submit
│   ├── LLMProviderNode.tsx        # Model/provider selector
│   ├── AgentNode.tsx              # Shows streaming state, turn count
│   ├── ToolNode.tsx               # Tool type selector, config
│   ├── OutputNode.tsx             # Streaming text display, markdown render
│   ├── RouterNode.tsx             # Dynamic output ports, rule config
│   ├── GateNode.tsx               # Approval UI inline
│   ├── SubagentNode.tsx           # Task display, parallel/chain mode
│   ├── TransformNode.tsx          # Code editor
│   └── nodeRegistry.ts           # Maps node type → component + definition
│
├── edges/
│   ├── TypedEdge.tsx              # Custom edge with type-based color/animation
│   └── edgeUtils.ts              # Type compatibility checking
│
├── panels/
│   ├── Sidebar.tsx                # Node palette (drag to add), organized by category
│   ├── Inspector.tsx              # Selected node config editor
│   └── ExecutionLog.tsx           # Run history, streaming events log
│
├── shared/                        # Shared between browser and server
│   ├── protocol.ts                # ClientMessage + ServerMessage types
│   ├── graphTypes.ts              # GraphJSON, NodeDefinition, PortDefinition, ConfigField
│   ├── wireTypes.ts               # WireType enum, type compatibility rules
│   └── execution/
│       ├── compiler.ts            # Graph → ExecutionPlan (topological sort, validation)
│       └── types.ts               # ExecutionPlan, ExecutionStep
│
└── persistence/
    ├── serializer.ts              # Graph ↔ JSON
    └── templates.ts               # Built-in graph templates
```

### Key Components

#### BaseNode (shared chrome)

```tsx
// Every node wraps in BaseNode for consistent look
<BaseNode 
  type={type}
  label={label} 
  icon={icon}
  status={executionStatus}       // idle | running | done | error
  selected={selected}
  onDelete={onDelete}
>
  {/* Node-specific content */}
  <Handle type="target" id="model" position={Position.Left} />
  <Handle type="source" id="response" position={Position.Right} />
  {children}
</BaseNode>
```

#### Canvas connection validation

```tsx
// In Canvas.tsx
const isValidConnection = useCallback((connection: Connection) => {
  const sourceNode = getNode(connection.source);
  const targetNode = getNode(connection.target);
  const sourcePort = getOutputPort(sourceNode, connection.sourceHandle);
  const targetPort = getInputPort(targetNode, connection.targetHandle);
  
  return isTypeCompatible(sourcePort.type, targetPort.type);
}, []);
```

#### Zustand Store

```typescript
interface GraphStore {
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  
  // Execution state (driven by ServerMessages over WebSocket)
  executionState: "idle" | "running" | "paused" | "error";
  nodeStates: Map<string, NodeRuntimeState>;  // Per-node streaming state
  pendingGates: Map<string, GateRequest>;     // Gate confirmations awaiting user
  
  // Actions
  addNode: (type: string, position: XYPosition) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  runGraph: () => void;     // Sends { type: "run", graph } via WS
  stopGraph: () => void;    // Sends { type: "stop" } via WS
  respondToGate: (commandId: string, approved: boolean) => void;  // Sends gate_response
  
  // WS event handlers (called by wsClient)
  handleServerMessage: (msg: ServerMessage) => void;
  
  // Persistence
  saveGraph: () => GraphJSON;
  loadGraph: (json: GraphJSON) => void;
}
```

### Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@xyflow/react": "^12",
    "zustand": "^4",
    "express": "^4",
    "ws": "^8",
    "@mariozechner/pi-coding-agent": "^0.55",
    "@mariozechner/pi-ai": "^0.55",
    "@mariozechner/pi-agent-core": "^0.55",
    "@sinclair/typebox": "^0.34",
    "dotenv": "^16"
  },
  "devDependencies": {
    "typescript": "^5.7",
    "vite": "^6",
    "@vitejs/plugin-react": "^4",
    "@types/express": "^4",
    "@types/ws": "^8",
    "tsx": "^4",
    "concurrently": "^9"
  }
}
```

> **Note:** pi SDK packages (`pi-coding-agent`, `pi-ai`, `pi-agent-core`) are server-only dependencies. The browser bundle does NOT include them — Vite's build excludes server code. The browser imports only from `src/shared/` and `src/app/`.

---

## 7. Reuse from pi-mono

| What | Where | How it's used |
|------|-------|---------------|
| `createAgentSession()` | pi-coding-agent SDK | Agent node executor creates sessions |
| `SessionManager.inMemory()` | pi-coding-agent SDK | Each Agent node gets an in-memory session |
| `ModelRegistry` + `AuthStorage` | pi-coding-agent SDK | LLM Provider node resolves models and API keys |
| `codingTools`, `readOnlyTools`, tool factories | pi-coding-agent SDK | Tool nodes wrap built-in tools |
| `DefaultResourceLoader` | pi-coding-agent SDK | Loads extensions, skills, prompts for Agent nodes |
| `AgentSession.subscribe()` | pi-coding-agent SDK | Stream events to canvas UI |
| `AgentEvent` types | pi-agent-core | Type the event stream flowing through `stream` wires |
| `pi.events` (EventBus) | pi-coding-agent | Event wire type maps directly to inter-node events |
| Extension patterns (gate, protected-paths) | pi-coding-agent examples | Safety nodes compile to extension event handlers |
| Subagent extension | pi-coding-agent examples | Subagent node reuses the spawn-and-stream pattern |

---

## 8. Files to Create (MVP)

### Server

| File | Purpose |
|------|---------|
| `src/server/index.ts` | Express + WebSocket server entry point |
| `src/server/graphRunner.ts` | Receives GraphJSON, compiles & runs execution plan |
| `src/server/sessionPool.ts` | Tracks active AgentSession instances by runId |
| `src/server/nodeExecutors/agentExecutor.ts` | createAgentSession + prompt + stream events to WS |
| `src/server/nodeExecutors/llmProviderExecutor.ts` | Resolve Model via ModelRegistry |
| `src/server/nodeExecutors/toolExecutor.ts` | Create AgentTool via tool factories |
| `src/server/nodeExecutors/index.ts` | Executor registry |

### Shared (browser + server)

| File | Purpose |
|------|---------|
| `src/shared/protocol.ts` | ClientMessage + ServerMessage types |
| `src/shared/graphTypes.ts` | GraphJSON, NodeDefinition, PortDefinition, ConfigField |
| `src/shared/wireTypes.ts` | WireType enum, type compatibility rules |
| `src/shared/execution/compiler.ts` | Graph → ExecutionPlan (topological sort, validation) |
| `src/shared/execution/types.ts` | ExecutionPlan, ExecutionStep |

### Browser

| File | Purpose |
|------|---------|
| `package.json` | Project config with deps |
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite + React (browser only) |
| `index.html` | Entry HTML |
| `src/main.tsx` | React entry |
| `src/app/App.tsx` | Main layout |
| `src/app/store.ts` | Zustand graph store + WS event dispatch |
| `src/app/theme.ts` | Wire colors, node colors |
| `src/app/wsClient.ts` | WebSocket client, dispatches ServerMessages to store |
| `src/canvas/Canvas.tsx` | React Flow canvas |
| `src/nodes/BaseNode.tsx` | Shared node wrapper |
| `src/nodes/PromptInputNode.tsx` | Prompt entry |
| `src/nodes/LLMProviderNode.tsx` | Model picker |
| `src/nodes/AgentNode.tsx` | Agent execution display |
| `src/nodes/ToolNode.tsx` | Tool selector |
| `src/nodes/OutputNode.tsx` | Result display |
| `src/nodes/nodeRegistry.ts` | Type → component map |
| `src/edges/TypedEdge.tsx` | Colored/animated edge |
| `src/edges/edgeUtils.ts` | Type compatibility |
| `src/panels/Sidebar.tsx` | Node palette |
| `src/panels/Inspector.tsx` | Config editor |
| `src/persistence/serializer.ts` | Save/load graph JSON |

---

## 9. Verification

### Phase 0 (UX Prototype)

- [ ] `npm run dev` starts Vite dev server, canvas renders
- [ ] Can drag all node types from sidebar onto canvas
- [ ] Can connect LLM Provider → Agent → Output with typed wires
- [ ] Invalid connections (wrong type) are rejected visually with feedback
- [ ] Click a node → Inspector panel shows its config fields, editable
- [ ] Can select tools in Tool node, configure model in LLM Provider
- [ ] "Run" button triggers mock execution:
  - Agent node transitions idle → running → done
  - Output node streams mock text character-by-character
  - Wires animate during mock execution
- [ ] Gate node shows mock confirmation dialog, approve/reject changes node state
- [ ] Save graph to JSON (localStorage), reload page, load graph — state restored
- [ ] All node types render correctly with mock data (no blank/broken nodes)

### Phase 1 (Real Backend)

- [ ] `npm run dev` starts both Vite + backend server concurrently
- [ ] Browser connects to backend via WebSocket on `ws://localhost:4242`
- [ ] Run button sends graph JSON to backend and executes:
  - Backend sends `node_state` events → Agent node shows "running"
  - Backend sends `stream_token` events → Output node renders real LLM tokens
  - Wires animate during streaming
  - Backend sends `done` → Agent node shows "done"
- [ ] Gate node flow works end-to-end:
  - Agent triggers a tool call matching gate pattern
  - Backend sends `gate_request` → canvas shows confirmation UI on Gate node
  - User approves → backend unblocks, agent continues
  - User rejects → backend blocks tool call, agent receives block reason
- [ ] Save/load graph persists to JSON file and restores correctly
- [ ] Persistence migrated from localStorage to file system — existing prototype graphs exportable
- [ ] Graph with disconnected required ports shows validation error before run
- [ ] API keys resolved server-side from `.env`, never appear in browser

---

## 10. Reference Test Graph (Research Agent)

Canonical graph for end-to-end testing of Phase 1.

```
[Prompt Input] ──→ [Agent] ──→ [Output]
                      ↑
[LLM Provider] ──────┤
                      ↑
[Tool: read] ─────────┤
[Tool: grep] ─────────┘
```

**Prompt:** `"Summarize the README in /path/to/project"`

**Exercises:** model resolution, multi-tool wiring (read + grep connected to Agent tool-set input), streaming output to Output node.

**Saved as:** `src/templates/research-agent.json`  
**Loaded by default on first launch** (both Phase 0 with mock execution and Phase 1 with real backend).

---

## 11. Resolved Decisions

1. **Runtime architecture:** Browser ↔ WebSocket ↔ Node.js backend. Backend imports pi SDK directly. Browser is pure UI with no pi SDK dependency and no secrets exposure. No RPC mode needed.

2. **Graph persistence format:** Custom JSON format for MVP. Extension `.ts` export is a v0.4 feature.

3. **Multi-user / collaborative editing:** Out of scope for MVP. Architecture supports it later (WebSocket is already the transport; adding rooms/cursors is additive).
