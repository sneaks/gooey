# Gooey — Session Handoff Note (v2)

## What's Built — All Phases Complete (0 through 4)

The full visual node-graph agent pipeline builder is implemented through v0.4. All code compiles cleanly (`npm run check` passes). Both Vite dev server and backend server run concurrently via `npm run dev`. Real LLM execution works end-to-end via Anthropic API.

---

## Architecture

```
Browser (React + React Flow + Zustand)
    ↕ WebSocket (ws://localhost:4242)
Backend (Express + ws + Anthropic SDK)
    ↕ Anthropic API
```

- **VITE_MOCK_MODE=true** → uses `mockRunner.ts` (setTimeout-based fake execution)
- **Default (no flag)** → uses WebSocket to backend, real Anthropic API calls

---

## File Inventory

### Config & Build
```
package.json                          # React 18, React Flow 12, Zustand 4, Vite 6, Express, ws, Anthropic SDK
tsconfig.json                         # Browser TypeScript config (ESNext, DOM)
tsconfig.server.json                  # Server TypeScript config (ES2022, no DOM)
vite.config.ts                        # React plugin + @shared alias
index.html                            # Dark theme shell
.env.example                          # API key template (ANTHROPIC_API_KEY, GOOEY_PORT)
.gitignore                            # node_modules, dist, .env, logs
scripts/check.sh                      # Runs both tsc checks
```

### Entry Points
```
src/main.tsx                          # React entry
src/app/App.tsx                       # Main layout: toolbar + sidebar + canvas + inspector
                                      #   - VITE_MOCK_MODE toggle
                                      #   - WS status indicator
                                      #   - Run/Stop/Save/Load/Template/Export/Import/Extension buttons
                                      #   - Graph validation before run
                                      #   - Template picker (4 templates)
                                      #   - React Flow default node style overrides (transparent bg, width auto)
```

### App State & Communication
```
src/app/store.ts                      # Zustand store: React Flow state, execution state, persistence,
                                      #   undo/redo (50-deep history), server persistence methods,
                                      #   gate response → WS forwarding
src/app/theme.ts                      # Color constants, category colors/labels
src/app/mockRunner.ts                 # setTimeout-based fake execution (Phase 0 mode)
src/app/wsClient.ts                   # WebSocket client with auto-reconnect, status callbacks
```

### Shared (Browser + Server)
```
src/shared/wireTypes.ts               # WireType union, WIRE_COLORS, isTypeCompatible()
src/shared/graphTypes.ts              # NodeDefinition, PortDefinition, ConfigField, GraphJSON
src/shared/protocol.ts                # ClientMessage, ServerMessage, NodeStatus
src/shared/execution/types.ts         # ExecutionPlan, ExecutionStep
src/shared/execution/compiler.ts      # Graph → ExecutionPlan (Kahn's topological sort), validateGraph()
src/shared/exportExtension.ts         # Graph → standalone pi extension .ts file
src/vite-env.d.ts                     # Vite env type declarations
```

### Node Components (22 types)
```
src/nodes/nodeRegistry.ts             # 22 NodeDefinitions with ports + config fields
src/nodes/index.ts                    # nodeTypes map for React Flow (22 entries)
src/nodes/BaseNode.tsx                # Shared chrome: category header, status indicator, typed handles

# Core Pipeline (9)
src/nodes/LLMProviderNode.tsx         # Provider/model/thinking display
src/nodes/AgentNode.tsx               # Streaming preview, status, error display
src/nodes/ToolNode.tsx                # Tool type icon + name
src/nodes/ToolSetNode.tsx             # Preset tool groups (coding/readonly/all/custom)
src/nodes/PromptTemplateNode.tsx      # Content preview
src/nodes/RouterNode.tsx              # Routing mode + parsed rules display
src/nodes/SubagentNode.tsx            # Agent name, mode/scope, streaming preview
src/nodes/MemoryNode.tsx              # Strategy, window size display
src/nodes/HandoffNode.tsx             # Target agent, summary mode

# I/O & Triggers (4)
src/nodes/PromptInputNode.tsx         # Editable textarea
src/nodes/OutputNode.tsx              # Scrollable streaming text, S/M/L sizing, passthrough output
src/nodes/FileTriggerNode.tsx         # Watch path, events, glob
src/nodes/WebhookTriggerNode.tsx      # Port, path, method

# Safety & Control (2)
src/nodes/GateNode.tsx                # Inline Approve/Reject confirmation UI
src/nodes/ProtectedPathNode.tsx       # Protected paths list, mode

# Integrations (2)
src/nodes/SlackNode.tsx               # Action, channel display
src/nodes/RemoteExecNode.tsx          # SSH host/user/auth display

# Utility (3)
src/nodes/TransformNode.tsx           # Code preview, language
src/nodes/MergeNode.tsx               # Strategy display
src/nodes/SplitNode.tsx               # Split mode display
src/nodes/CustomNode.tsx              # Custom name, code preview
src/nodes/VariableNode.tsx            # Name, value/env var
```

### Edges
```
src/edges/TypedEdge.tsx               # Wire color from port type, animated dash when active
src/edges/index.ts                    # edgeTypes map
```

### Canvas & Panels
```
src/canvas/Canvas.tsx                 # React Flow wrapper: drag-drop, connection validation,
                                      #   minimap, controls, node search overlay (/ or Cmd+K),
                                      #   keyboard shortcuts (Cmd+Z undo, Cmd+Shift+Z redo)
src/panels/Sidebar.tsx                # Draggable node palette grouped by category (5 categories)
src/panels/Inspector.tsx              # Config field editor, port info, runtime output display,
                                      #   copy button, status, delete button
```

### Templates
```
src/templates/researchAgent.ts        # Prompt + LLM + 2 Tools → Agent → Output
src/templates/codeReview.ts           # Prompt + LLM + ToolSet(readonly) → Agent → Output
src/templates/gatedAgent.ts           # Prompt + LLM + Tool(bash) → Agent → Gate → Output
src/templates/parallelAgents.ts       # Prompt + LLM → 2 Agents → Merge → Output
```

### Server (Backend)
```
src/server/index.ts                   # Express + WebSocket server, CORS, graph CRUD REST API
                                      #   GET/PUT/DELETE /api/graphs/:name
src/server/graphRunner.ts             # Compiles & runs ExecutionPlan, parallel groups, gate resolution
src/server/sessionPool.ts             # Tracks active sessions for cleanup
src/server/nodeExecutors/index.ts     # Dispatcher for all 22 node types
src/server/nodeExecutors/agentExecutor.ts    # Anthropic streaming agent loop, multi-turn tool use,
                                             #   rate limit retry, tool result truncation (10k chars)
src/server/nodeExecutors/llmProviderExecutor.ts  # Resolves model config + API key from env
src/server/nodeExecutors/toolExecutor.ts         # Produces tool descriptors
src/server/nodeExecutors/subagentExecutor.ts     # Single/parallel/chain modes
src/server/nodeExecutors/routerExecutor.ts       # Contains/regex/jsonpath pattern matching
```

---

## Node Types (22)

| Category | Type | Ports In | Ports Out |
|----------|------|----------|-----------|
| core | llm-provider | — | model |
| core | agent | model*, tools, systemPrompt, userMessage*, context | response(stream), textOutput(message), messages, done(trigger) |
| core | tool | — | tool(tools) |
| core | tool-set | — | tools |
| core | prompt-template | — | content(message) |
| core | router | input(data)* | route-1, route-2, default (all data) |
| core | subagent | task(message)*, context(messages) | result(data), messages, usage(data) |
| core | memory | messages(in) | context(messages) |
| core | handoff | context(messages)*, model | result(data), messages |
| io | prompt-input | — | prompt(message) |
| io | output | input(stream)* | passthrough(data) |
| io | file-trigger | — | content(data), path(data), trigger |
| io | webhook-trigger | — | body(data), headers(data), trigger |
| safety | gate | input(data)* | approved(data), rejected(data) |
| safety | protected-path | agent(data) | constraint(config) |
| integration | slack | message | response(data), trigger |
| integration | remote-exec | command(data)* | stdout, stderr, exitCode (all data) |
| utility | transform | input(data)* | output(data) |
| utility | merge | input-1*, input-2, input-3 (all data) | output(data) |
| utility | split | input(data)* | item-1, item-2, item-3 (all data) |
| utility | custom | input(data), config | output(data) |
| utility | variable | — | value(data) |

`*` = required port

---

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| React Flow default node style overridden to `background: transparent; width: auto` | RF sets white bg + 150px width by default, breaking dark theme and node sizing |
| Output node has S/M/L size buttons instead of CSS resize | More predictable sizing within React Flow's coordinate system |
| Agent node has both `response` (stream) and `textOutput` (message) outputs | `response` for Output nodes, `textOutput` for chaining Agent→Agent |
| Output node has `passthrough` data output | Enables Output→downstream chains without losing display |
| Undo/redo uses structuredClone snapshots (max 50) | Simple, reliable, no dependency on immer/patches |
| WS client reconnects indefinitely (no max attempts) | Server may start slower than Vite; client should keep trying |
| Tool results truncated to 10k chars | Prevents token explosion in multi-turn agent loops |
| `max_tokens: 4096` default | Keeps costs reasonable, prevents snowballing conversations |
| Rate limit retry with exponential backoff (3 attempts) | Handles 429 errors gracefully |
| Graph validation checks required ports client-side before sending | Immediate feedback, avoids wasted API calls |

---

## How to Run

```bash
cd /Users/jojo/AI/gooey

# Copy and configure API key
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY=sk-ant-...

# Start both servers
npm run dev
# → Vite on http://localhost:5173
# → Backend on ws://localhost:4242

# Or mock mode (no backend needed)
VITE_MOCK_MODE=true npm run dev:client
```

### Keyboard Shortcuts
- `Cmd+Z` — Undo
- `Cmd+Shift+Z` / `Cmd+Y` — Redo
- `/` or `Cmd+K` — Node search
- `Escape` — Close search / deselect
- `Backspace` / `Delete` — Delete selected node

### npm Scripts
- `npm run dev` — Start Vite + backend concurrently
- `npm run dev:client` — Vite only
- `npm run dev:server` — Backend only
- `npm run check` — TypeScript check (both configs)

---

## What Works End-to-End

1. ✅ Load template graph or build from scratch
2. ✅ Drag nodes from sidebar, connect with typed wires
3. ✅ Invalid connections rejected (type mismatch)
4. ✅ Click node → Inspector shows config, editable
5. ✅ Click Run → backend executes graph via Anthropic API
6. ✅ Agent streams tokens in real-time to canvas
7. ✅ Agent uses tools (read, bash, edit, write, grep, find, ls)
8. ✅ Gate node shows confirmation, approve/reject works
9. ✅ Output node displays streamed text, resizable S/M/L
10. ✅ Save/load to localStorage and server filesystem
11. ✅ Export graph as JSON or pi extension .ts
12. ✅ Undo/redo with keyboard shortcuts
13. ✅ Node search with fuzzy filter

---

## What's Stubbed / Future Work

| Feature | Status | Notes |
|---------|--------|-------|
| File Trigger (real fs.watch) | Stub | Currently emits trigger signal once, doesn't actually watch |
| Webhook Trigger (real HTTP listener) | Stub | Would need dynamic port binding |
| Slack integration | Stub | Would need Slack SDK + bot token |
| Remote Exec (SSH) | Stub | Would need ssh2 library |
| Memory "summary" strategy | Stub | Would need LLM call to summarize |
| Subagent parallel mode | Basic | Splits task by newlines, could be smarter |
| Handoff auto-summary | Basic | Passes context through, real summarization needs LLM |
| Custom node sandboxing | None | Uses `new Function()` — no security sandbox |
| Multi-user / collaborative | Not started | Architecture supports it (WS rooms) |
| Graph cycles (retry loops) | Detected | Compiler warns but doesn't execute cycles |

---

## Potential Next Steps

1. **Polish UX** — Better connection feedback, edge labels, node grouping/comments
2. **Execution log panel** — Show tool calls, timing, token usage in a collapsible panel
3. **Real triggers** — File watcher, webhook listener as long-running background processes
4. **Multi-provider support** — OpenAI, Google, xAI executors (currently Anthropic only)
5. **Pi SDK integration** — Replace direct Anthropic SDK with `createAgentSession()` for full pi extension ecosystem
6. **Graph validation** — More checks: cycle detection warning, unreachable nodes, type mismatches
7. **Collaborative editing** — WebSocket rooms, cursor sharing
8. **Deployment** — Package as Electron app or Docker container
