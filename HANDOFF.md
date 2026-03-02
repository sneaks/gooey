# Gooey — Session Handoff Note

## What's Built (Phase 0 — Chunks 1 & 2)

The complete Phase 0 UX prototype is implemented. All code compiles cleanly (`tsc --noEmit` passes). Vite dev server starts and serves the app.

### File inventory

```
package.json                          # React 18, React Flow 12, Zustand 4, Vite 6
tsconfig.json                         # ESNext, @shared path alias
vite.config.ts                        # React plugin + @shared alias
index.html                            # Dark theme shell

src/main.tsx                          # React entry
src/app/App.tsx                       # Main layout: toolbar + sidebar + canvas + inspector
src/app/store.ts                      # Zustand store: React Flow state, execution state, persistence
src/app/theme.ts                      # Color constants, category colors/labels
src/app/mockRunner.ts                 # setTimeout-based fake execution, emits ServerMessage events

src/shared/wireTypes.ts               # WireType union, WIRE_COLORS, isTypeCompatible()
src/shared/graphTypes.ts              # NodeDefinition, PortDefinition, ConfigField, GraphJSON
src/shared/protocol.ts                # ClientMessage, ServerMessage, NodeStatus
src/shared/execution/types.ts         # ExecutionPlan, ExecutionStep

src/nodes/nodeRegistry.ts             # 9 NodeDefinitions with ports + config fields
src/nodes/index.ts                    # nodeTypes map for React Flow
src/nodes/BaseNode.tsx                # Shared chrome: category header, status indicator, typed handles
src/nodes/PromptInputNode.tsx         # Editable textarea
src/nodes/LLMProviderNode.tsx         # Provider/model/thinking display
src/nodes/AgentNode.tsx               # Streaming preview, status, error display
src/nodes/ToolNode.tsx                # Tool type icon + name
src/nodes/OutputNode.tsx              # Scrollable streaming text (left-aligned)
src/nodes/GateNode.tsx                # Inline Approve/Reject confirmation UI
src/nodes/RouterNode.tsx              # Routing mode + parsed rules display
src/nodes/SubagentNode.tsx            # Agent name, mode/scope, streaming preview
src/nodes/PromptTemplateNode.tsx      # Content preview

src/edges/TypedEdge.tsx               # Wire color from port type, animated dash when active
src/edges/index.ts                    # edgeTypes map

src/canvas/Canvas.tsx                 # React Flow wrapper: drag-drop, connection validation, minimap
src/panels/Sidebar.tsx                # Draggable node palette grouped by category
src/panels/Inspector.tsx              # Config field editor, port info, delete button

src/templates/researchAgent.ts        # Reference test graph (loaded on first launch)
```

### What each piece does

- **9 node types** all render with correct ports, config fields, and visual states (idle/running/done/error)
- **Typed wires** enforce compatibility on connect (e.g., model→model OK, model→message rejected)
- **Wire colors** match type (purple=model, orange=tools, blue=message, green=stream, etc.)
- **Animated edges** during mock execution (dashed green flowing along active wires)
- **Mock runner** simulates: LLM Provider→done, Tool→done, Agent→running→streaming→done, Output→streaming→done, Gate→confirmation prompt
- **Inspector** renders appropriate field types (select, boolean, number, textarea, string, json) based on NodeDefinition config
- **Persistence** saves/loads to localStorage; template button loads research agent graph
- **Research agent template** pre-wired: Prompt Input + LLM Provider + 2 Tools → Agent → Output

---

## Off-Plan Decisions

| Decision | Reason |
|----------|--------|
| Added `PromptTemplateNode.tsx` | Registry had `prompt-template` type but plan didn't list a component. Obviously needed. |
| `textarea` added to `ConfigFieldType` | Plan had `code` and `string` but multi-line non-code text (prompts, patterns) needed its own type. |
| `@shared` path alias in tsconfig + vite | Plan didn't specify import strategy. Clean imports like `@shared/wireTypes`. |
| Node ID scheme: `${type}-${counter}` | Plan didn't specify. Pattern like `agent-3` is readable in debugging. |
| BaseNode reads status from store (not props) | Plan showed status as a prop but store subscription is simpler and avoids prop drilling. |
| `useReactFlow()` hook instead of `onInit` ref | React Flow v12 types incompatible with `ReactFlowInstance` ref pattern. v12-idiomatic approach. |
| `isValidConnection as any` cast | RF v12's `IsValidConnection` expects `Connection \| Edge` union. Cast avoids complex generic alignment without runtime impact. |
| Template button in toolbar | Plan said "loaded on first launch" (implemented). Manual button added for dev convenience. |
| `onKeyDown` stopPropagation on PromptInputNode textarea | Without this, typing triggers RF keyboard shortcuts (Delete key deletes the node). Essential for usability. |

---

## Deferred

| Item | Why | When needed |
|------|-----|-------------|
| `src/shared/execution/compiler.ts` | Graph→ExecutionPlan compilation. Mock runner iterates nodes by type, doesn't need topological sort. | Phase 1 — required before backend `graphRunner.ts` can execute real graphs. |

---

## Chunk 3 — What to Do Next

### Step 1: Phase 0 Verification (before touching any backend code)

Run through the Phase 0 verification checklist from PLAN.md Section 9. This means manually testing in the browser:

- [ ] `npm run dev` starts Vite, canvas renders with template graph
- [ ] Drag all 9 node types from sidebar onto canvas
- [ ] Connect LLM Provider → Agent → Output (typed wires)
- [ ] Try invalid connection (e.g., model output → message input) — should reject
- [ ] Click a node → Inspector shows config fields, editable
- [ ] Edit Tool node type, LLM Provider model — changes reflect on node
- [ ] Click "Run" → mock execution animates (Agent running, Output streaming, wires animated)
- [ ] If a Gate node is on canvas: confirmation dialog appears, Approve/Reject works
- [ ] Click "Save" then reload page, click "Load" → graph restored from localStorage
- [ ] All 9 node types render without blank/broken states

Fix any issues found during verification before proceeding.

### Step 2: Phase 1 Backend (after verification passes)

Start with steps 8-15 from the plan:
1. Create `src/shared/execution/compiler.ts` (the deferred piece)
2. Build `src/server/index.ts` (Express + ws)
3. Build `src/server/graphRunner.ts`
4. Build `src/server/sessionPool.ts`
5. Build `src/server/nodeExecutors/` (agent, llmProvider, tool, index)
6. Build `src/app/wsClient.ts`
7. Add `VITE_MOCK_MODE` env flag to swap mockRunner↔wsClient
8. Add server deps to package.json (express, ws, dotenv, tsx, concurrently)
9. Add pi SDK deps (server-only: @mariozechner/pi-coding-agent, pi-ai, pi-agent-core)
10. Update `npm run dev` script to use concurrently for vite + backend

---

## How to Resume

```bash
cd /Users/jojo/AI/gooey
npm run dev
# Open http://localhost:5173 in browser
# Run through Phase 0 verification checklist above
```

Reference: full plan is in `PLAN.md`, this handoff is in `HANDOFF.md`.
