# Gooey — Visual Node-Graph Agent Pipeline Builder

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/React Flow-12-blueviolet?style=flat" alt="React Flow">
  <img src="https://img.shields.io/badge/TypeScript-ESNext-green?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6-yellow?style=flat&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Anthropic-API-orange?style=flat" alt="Anthropic">
</p>

A visual node-graph agent pipeline builder inspired by Max/MSP and Node-RED. Build agent workflows by connecting typed nodes on a canvas — no code required.

## Features

- **Visual Canvas** — Drag-and-drop nodes, connect with typed wires, real-time validation
- **27 Node Types** — LLM Provider, Agent, Tool, Router, Gate, Transform, KV Store, Gmail, HTTP Request, Schedule, and more
- **Real LLM Execution** — Anthropic, OpenAI, OpenRouter, Ollama, and any OpenAI-compatible provider
- **Streaming** — Token-by-token streaming with live node previews
- **Scheduled Agents** — Run graphs on a timer; agents can self-deactivate based on conditions
- **KV Store** — Persistent key-value memory between scheduled runs
- **Gmail Integration** — List, read, and send email from the graph
- **HTTP Requests** — Call any external API as a node
- **Logs Panel** — Live execution log with filtering by level and tool calls
- **Templates** — Pre-built graphs: Research Agent, Code Review, Gated Agent, Parallel Agents
- **Export** — Export graphs as standalone pi extension files
- **Undo/Redo** — Full history support (50 levels deep)
- **Mock Mode** — Test graphs without API keys

## Quick Start

```bash
# 1. Clone and install dependencies
cd gooey
npm install

# 2. Copy environment template and add your keys
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# 3. Start development servers
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: ws://localhost:4242

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + backend concurrently |
| `npm run dev:client` | Vite frontend only |
| `npm run dev:server` | Backend server only |
| `npm run check` | TypeScript type check |
| `npm run build` | Production build |

## Project Structure

```
src/
├── app/                 # Main app, store, WebSocket client
│   ├── App.tsx          # Layout, toolbar, Run/Stop/Activate buttons
│   ├── store.ts         # Zustand state (graph, execution, schedule, logs)
│   └── wsClient.ts      # WebSocket client with auto-reconnect
├── canvas/              # React Flow canvas
├── nodes/               # 27 node type definitions and React components
│   ├── nodeRegistry.ts  # All node definitions (ports, config, categories)
│   └── ...
├── panels/
│   ├── Sidebar.tsx      # Draggable node palette
│   ├── Inspector.tsx    # Config editor for selected node
│   ├── FileBrowser.tsx  # Save/load graph dialog
│   └── LogsPanel.tsx    # Execution log with filtering
├── server/
│   ├── index.ts         # Express + WebSocket server
│   ├── graphRunner.ts   # Compiles and executes graphs (topological sort)
│   ├── scheduleManager.ts  # Singleton — persists scheduled runs between ticks
│   ├── kvStore.ts       # Singleton — in-memory KV store between runs
│   └── nodeExecutors/   # Runtime executor for each node type
├── shared/
│   ├── protocol.ts      # WebSocket message types
│   ├── graphTypes.ts    # Graph JSON schema
│   └── execution/       # Graph compiler
└── templates/           # Pre-built graph JSON templates
```

## Node Types

### Core Pipeline
| Node | Description |
|------|-------------|
| **LLM Provider** | Model config (Claude, OpenAI, OpenRouter, Ollama, etc.) |
| **Agent** | Main execution unit — tools, prompts, streaming output |
| **Tool** | Single tool (read, bash, edit, write, grep, find, ls) |
| **Tool Set** | Group multiple tools |
| **Prompt Template** | Reusable prompt with variable placeholders |
| **Prompt Input** | User text entry point |
| **Subagent** | Delegate to another agent (single/parallel/chain modes) |
| **Router** | Conditional branching (contains/regex/jsonpath) |
| **Memory** | Conversation history (full/sliding-window/summary) |
| **Handoff** | Transfer context to another agent |

### I/O & Triggers
| Node | Description |
|------|-------------|
| **Output** | Display result on canvas (S/M/L sizes, markdown) |
| **Schedule** | Run the graph on a timer (seconds/minutes/hours) |
| **Deactivate Schedule** | Stop the scheduler when reached — agents can self-terminate |
| **File Trigger** | Watch files for changes (stub) |
| **Webhook Trigger** | HTTP endpoint trigger (stub) |

### Integrations
| Node | Description |
|------|-------------|
| **Gmail** | List, read, or send email via OAuth refresh token |
| **HTTP Request** | Call any REST API (GET/POST/PUT/PATCH/DELETE) |
| **Slack** | Send/receive messages (stub) |
| **Remote Exec** | SSH remote execution (stub) |

### Safety & Control
| Node | Description |
|------|-------------|
| **Gate** | Human-in-the-loop confirmation before proceeding |
| **Protected Path** | Block operations on protected paths |

### Utility
| Node | Description |
|------|-------------|
| **KV Store** | Get/set/delete/get-all — persists between scheduled ticks |
| **Transform** | Run custom JavaScript on any data |
| **Merge** | Combine 2-3 inputs (concatenate/array/object) |
| **Split** | Split by delimiter/lines/JSON array |
| **Variable** | Store a value or read from env var |
| **Custom** | User-defined node with custom code |

## Scheduling Pattern

The Schedule node works like a `metro` + `bang` in Max/MSP. Activate it from the toolbar and the graph fires at the configured interval. The KV Store persists state between ticks, enabling patterns like:

**Run counter — stop after N ticks:**
```
Schedule → KV Get("run_count") → Transform (increment)
                                        ├→ KV Set (save)
                                        └→ Transform (>= 5 ?) → Router → Deactivate
```

**Condition-based stop — stop when email matches:**
```
Schedule → Gmail → Transform (check sender) → Router
                                               ├─ match → Deactivate Schedule
                                               └─ no match → Agent → Output
```

The schedule persists server-side — closing the browser tab doesn't stop it.

## Wire Types

| Type | Color | Description |
|------|-------|-------------|
| `model` | Purple | LLM configuration |
| `tools` | Orange | Tool definitions |
| `message` | Blue | Single message/prompt |
| `data` | Gray | Generic data |
| `trigger` | Yellow | Flow trigger signal |
| `stream` | Green | Streaming token output |
| `boolean` | Red | Boolean value |
| `config` | Violet | Configuration object |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` / `Cmd+Y` | Redo |
| `/` or `Cmd+K` | Node search |
| `Escape` | Close search / deselect |
| `Backspace` / `Delete` | Delete selected node |

## Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...       # Anthropic Claude
OPENAI_API_KEY=sk-...              # OpenAI
OPENROUTER_API_KEY=sk-or-...       # OpenRouter
GMAIL_CREDENTIALS={"client_id":"...","client_secret":"...","refresh_token":"..."}
GOOEY_PORT=4242                    # WebSocket port (default: 4242)
```

To get Gmail credentials run:
```bash
node scripts/get-gmail-token.mjs
```

## Supported LLM Providers

| Provider | Type | Notes |
|----------|------|-------|
| **Anthropic** | Anthropic API | Claude Sonnet, Haiku, Opus |
| **OpenAI** | OpenAI API | GPT-4o, GPT-4-turbo |
| **OpenRouter** | OpenAI-compatible | 200+ models |
| **Ollama** | OpenAI-compatible | `http://localhost:11434/v1` |
| **LM Studio** | OpenAI-compatible | `http://localhost:1234/v1` |
| **vLLM** | OpenAI-compatible | `http://localhost:8080/v1` |
| **Groq** | OpenAI-compatible | `https://api.groq.com/openai/v1` |

## Architecture

```
Browser (React + React Flow + Zustand)
    ↕ WebSocket (ws://localhost:4242)
Backend (Express + ws)
    ├─ GraphRunner      — topological sort + node execution
    ├─ ScheduleManager  — singleton, survives individual runs
    ├─ KVStore          — singleton, persists between ticks
    └─ nodeExecutors/   — one file per node type
        ↕ External APIs (Anthropic, OpenRouter, Gmail, HTTP...)
```

## Known Limitations

- File Trigger and Webhook Trigger are stubs
- Slack and Remote Exec are stubs
- KV Store is in-memory only (resets on server restart)
- No multi-user collaborative editing
- Graph cycles are detected and rejected

## Tech Stack

- **Frontend**: React 18, React Flow 12, Zustand 4, TypeScript
- **Build**: Vite 6
- **Backend**: Express, ws, Anthropic SDK, googleapis
- **Runtime**: Node.js 18+ (tsx)

## License

MIT
