import type { ServerMessage } from "../shared/protocol";
import type { GraphJSON } from "../shared/graphTypes";

const MOCK_RESPONSE = `## Summary

This project implements a visual node-graph pipeline builder called **Gooey**. It uses React Flow for the canvas and connects to a Node.js backend via WebSocket.

### Key Features
- Typed wire connections between nodes
- Real-time streaming output display
- Gate nodes for safety confirmation
- Multiple tool support (read, bash, grep, etc.)

The architecture follows a browser ↔ WebSocket ↔ backend pattern where the backend owns all AI/LLM interactions.`;

type MessageHandler = (msg: ServerMessage) => void;

interface MockRun {
  cancel: () => void;
}

export function runMockExecution(
  graph: GraphJSON,
  onMessage: MessageHandler
): MockRun {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  const schedule = (fn: () => void, delay: number) => {
    if (cancelled) return;
    const t = setTimeout(() => {
      if (!cancelled) fn();
    }, delay);
    timers.push(t);
  };

  // Find nodes by type
  const agentNodes = graph.nodes.filter((n) => n.type === "agent");
  const outputNodes = graph.nodes.filter((n) => n.type === "output");
  const gateNodes = graph.nodes.filter((n) => n.type === "gate");
  const toolNodes = graph.nodes.filter((n) => n.type === "tool");
  const llmNodes = graph.nodes.filter((n) => n.type === "llm-provider");
  const subagentNodes = graph.nodes.filter((n) => n.type === "subagent");

  let delay = 0;

  // Mark LLM providers as done immediately
  for (const n of llmNodes) {
    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "running" });
    }, delay);
    delay += 100;
    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "done" });
    }, delay);
    delay += 50;
  }

  // Mark tools as done
  for (const n of toolNodes) {
    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "done" });
    }, delay);
    delay += 50;
  }

  // Gate node: show confirmation
  for (const n of gateNodes) {
    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "running" });
      onMessage({
        type: "gate_request",
        nodeId: n.id,
        message: `Allow dangerous command: rm -rf /tmp/test?`,
        commandId: `gate-${n.id}-${Date.now()}`,
      });
    }, delay);
    delay += 200;
  }

  // Agent nodes: simulate running
  for (const n of agentNodes) {
    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "running" });
    }, delay);
    delay += 200;

    // Simulate tool calls
    schedule(() => {
      onMessage({
        type: "tool_call",
        nodeId: n.id,
        tool: "read",
        input: { path: "README.md" },
      });
    }, delay);
    delay += 300;

    schedule(() => {
      onMessage({
        type: "tool_result",
        nodeId: n.id,
        tool: "read",
        output: "# Project README\n...",
        isError: false,
      });
    }, delay);
    delay += 200;
  }

  // Stream tokens to output nodes
  for (const n of outputNodes) {
    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "running" });
    }, delay);

    const chars = MOCK_RESPONSE.split("");
    let charDelay = delay + 100;
    for (const char of chars) {
      schedule(() => {
        onMessage({ type: "stream_token", nodeId: n.id, token: char });
      }, charDelay);
      charDelay += 15;
    }

    delay = charDelay + 200;

    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "done" });
    }, delay);
  }

  // Also stream to agent nodes (so they show text too)
  let agentStreamDelay = 500;
  for (const n of agentNodes) {
    const chars = MOCK_RESPONSE.split("");
    for (const char of chars) {
      schedule(() => {
        onMessage({ type: "stream_token", nodeId: n.id, token: char });
      }, agentStreamDelay);
      agentStreamDelay += 15;
    }

    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "done" });
    }, agentStreamDelay + 100);
  }

  // Subagent nodes: simulate
  for (const n of subagentNodes) {
    schedule(() => {
      onMessage({ type: "node_state", nodeId: n.id, status: "running" });
    }, delay);
    delay += 1000;
    schedule(() => {
      onMessage({
        type: "stream_token",
        nodeId: n.id,
        token: "Subagent completed task successfully.",
      });
      onMessage({ type: "node_state", nodeId: n.id, status: "done" });
    }, delay);
    delay += 200;
  }

  // Done
  schedule(() => {
    onMessage({ type: "done" });
  }, delay + 500);

  return {
    cancel: () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    },
  };
}
