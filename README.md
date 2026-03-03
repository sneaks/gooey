# Gooey — Visual Node-Graph Agent Pipeline Builder

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/React Flow-12-blueviolet?style=flat" alt="React Flow">
  <img src="https://img.shields.io/badge/TypeScript-ESNext-green?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6-yellow?style=flat&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Anthropic-API-orange?style=flat" alt="Anthropic">
</p>

A visual node-graph agent pipeline builder inspired by MaxMSP/Node-RED. Build agent workflows by connecting typed nodes on a canvas — no code required.

## Features

- **Visual Canvas** — Drag-and-drop nodes, connect with typed wires, real-time validation
- **22 Node Types** — LLM Provider, Agent, Tool, Subagent, Router, Gate, Merge, Split, Transform, and more
- **Real LLM Execution** — Powered by Anthropic API with streaming token support
- **Tool Execution** — Built-in tools: read, bash, edit, write, grep, find, ls
- **Agent Chaining** — Pipe output from one agent to another for multi-step workflows
- **Templates** — Pre-built graphs: Research Agent, Code Review, Gated Agent, Parallel Agents
- **Export** — Export graphs as standalone pi extension files
- **Undo/Redo** — Full history support (50 levels deep)
- **Mock Mode** — Test graphs without API keys

## Quick Start

```bash
# 1. Clone and install dependencies
cd gooey
npm install

# 2. Copy environment template and add your API key
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY=sk-ant-...

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
| `npm run check` | TypeScript type check (both configs) |
| `npm run build` | Production build |

## Project Structure

```
src/
├── app/                 # Main app component, store, theme, WebSocket client
│   ├── App.tsx          # Main layout, toolbar, Run/Stop buttons
│   ├── store.ts         # Zustand state (graph, execution, undo/redo)
│   ├── wsClient.ts      # WebSocket client with auto-reconnect
│   └── mockRunner.ts    # Mock execution for prototyping
├── canvas/              # React Flow canvas
│   └── Canvas.tsx       # Node graph, minimap, controls, search overlay
├── nodes/               # 22 node type definitions and components
│   ├── nodeRegistry.ts  # All node definitions with ports & config
│   ├── AgentNode.tsx    # Agent execution with streaming preview
│   ├── OutputNode.tsx   # Display node with S/M/L sizing
│   └── ...              # Other nodes (14 more)
├── edges/               # Custom wire components
│   └── TypedEdge.tsx    # Color-coded, animated when active
├── panels/              # Sidebar and inspector
│   ├── Sidebar.tsx      # Draggable node palette
│   └── Inspector.tsx    # Config editor for selected node
├── server/              # Express + WebSocket backend
│   ├── index.ts         # Server entry, REST API for graphs
│   ├── graphRunner.ts   # Compiles and executes graphs
│   └── nodeExecutors/   # Runtime executors for each node type
├── shared/              # Shared types and utilities
│   ├── wireTypes.ts     # Wire types and compatibility
│   ├── graphTypes.ts    # Graph JSON schema
│   └── execution/       # Graph compiler (topological sort)
├── templates/           # Pre-built graph templates
│   ├── researchAgent.ts
│   ├── codeReview.ts
│   ├── gatedAgent.ts
│   └── parallelAgents.ts
└── main.tsx             # React entry point
```

## Node Types

### Core Pipeline
| Node | Description |
|------|-------------|
| **LLM Provider** | Configures model (Claude, OpenAI, OpenRouter, Ollama, etc.), thinking level |
| **Agent** | Main execution unit with tools, prompts, streaming output |
| **Tool** | Single tool (read, bash, edit, write, grep, find, ls) |
| **Tool Set** | Group multiple tools together |
| **Prompt Template** | Reusable prompt with variable placeholders |
| **Prompt Input** | User entry point for text input |
| **Subagent** | Delegate to another agent (single/parallel/chain modes) |
| **Router** | Conditional branching (contains/regex/jsonpath) |
| **Memory** | Conversation history (full/sliding-window/summary) |
| **Handoff** | Transfer context to another agent |

### I/O & Triggers
| Node | Description |
|------|-------------|
| **Output** | Display result on canvas (S/M/L sizes) |
| **File Trigger** | Watch files for changes (stub) |
| **Webhook Trigger** | HTTP endpoint trigger (stub) |

### Safety & Control
| Node | Description |
|------|-------------|
| **Gate** | Confirmation dialog before proceeding |
| **Protected Path** | Block operations on protected paths |

### Utility
| Node | Description |
|------|-------------|
| **Merge** | Combine 2-3 inputs (concatenate/array/object) |
| **Split** | Split by delimiter/lines/JSON array |
| **Transform** | Run custom JavaScript on data |
| **Custom** | User-defined node with custom code |
| **Variable** | Store a value or read from env var |

### Integrations
| Node | Description |
|------|-------------|
| **Slack** | Send/receive messages (stub) |
| **Remote Exec** | SSH remote execution (stub) |

## Wire Types

Wires are color-coded by type:

| Type | Color | Description |
|------|-------|-------------|
| `model` | Purple | LLM configuration |
| `tools` | Orange | Tool definitions |
| `message` | Blue | Single message/prompt |
| `messages` | Blue | Message history array |
| `stream` | Green | Streaming token output |
| `data` | Gray | Generic data (compatible with message) |
| `trigger` | Yellow | Flow trigger signal |
| `event` | Cyan | Event signal |
| `boolean` | Red | Boolean value |
| `config` | Violet | Configuration object |

**Type Compatibility**: Most types can flow to `data` (generic), enabling utility nodes like Merge, Transform, and Split to process any output.

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
ANTHROPIC_API_KEY=sk-ant-...    # Required for Anthropic
OPENAI_API_KEY=sk-...           # Required for OpenAI
OPENROUTER_API_KEY=sk-or-...   # Required for OpenRouter
GOOEY_PORT=4242                 # WebSocket port (default: 4242)
```

## Supported Providers

| Provider | API Type | Example Base URL | Example Models |
|----------|----------|------------------|----------------|
| **Anthropic** | Anthropic | (default) | claude-sonnet-4-20250514, claude-opus-4-5 |
| **OpenAI** | OpenAI | https://api.openai.com/v1 | gpt-4o, gpt-4-turbo |
| **OpenRouter** | OpenAI | https://openrouter.ai/v1 | meta-llama-3.1-70b-instruct, mistralai/mixtral-8x7b |
| **OpenAI Compatible** | OpenAI | http://localhost:11434/v1 (Ollama), http://localhost:8080/v1 (vLLM), http://localhost:1234/v1 (LM Studio) | llama3.1, mistral, qwen2.5 |
| **Groq** | OpenAI | https://api.groq.com/openai/v1 | llama-3.1-70b-versatile |
| **Google** | Anthropic-style | (not implemented yet) | gemini-2.5-pro |
| **xAI** | Anthropic-style | (not implemented yet) | grok-2 |

### Using Ollama / LM Studio / vLLM

1. Set Provider to **OpenAI Compatible**
2. Set Base URL to:
   - **Ollama**: `http://localhost:11434/v1`
   - **LM Studio**: `http://localhost:1234/v1`
   - **vLLM**: `http://localhost:8080/v1`
3. Set API Key to any non-empty string (or leave empty if disabled in settings)
4. Set Model to the model name running locally (e.g., `llama3.1`, `mistral`, `qwen2.5`)

## Architecture

```
Browser (React + React Flow + Zustand)
    ↕ WebSocket (ws://localhost:4242)
Backend (Express + ws + Anthropic SDK)
    ↕ Anthropic API
```

- **Mock Mode**: Set `VITE_MOCK_MODE=true` to test without API keys (uses fake execution)

## Templates

### Research Agent
Prompt → LLM + Tools → Agent → Output

### Code Review
Prompt → LLM + ToolSet(readonly) → Agent → Output

### Gated Agent
Prompt → LLM + Tool(bash) → Agent → Gate → Output

### Parallel Agents
Prompt → LLM → 2 Agents → Merge → Output

## Known Limitations

- File Trigger and Webhook Trigger are stubs (don't actually watch files/webhooks yet)
- Slack and Remote Exec integrations are stubs
- Memory "summary" strategy is basic
- No multi-user collaborative editing
- Graph cycles are detected but not executed

## Tech Stack

- **Frontend**: React 18, React Flow 12, Zustand 4, TypeScript
- **Build**: Vite 6
- **Backend**: Express, ws, Anthropic SDK
- **Runtime**: Node.js (tsx for TypeScript execution)

## License

MIT
