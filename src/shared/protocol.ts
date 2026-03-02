import type { GraphJSON } from "./graphTypes";

// Browser → Backend
export type ClientMessage =
  | { type: "run"; graph: GraphJSON }
  | { type: "stop" }
  | { type: "gate_response"; commandId: string; approved: boolean };

// Backend → Browser
export type ServerMessage =
  | { type: "node_state"; nodeId: string; status: "idle" | "running" | "done" | "error"; error?: string }
  | { type: "stream_token"; nodeId: string; token: string }
  | { type: "tool_call"; nodeId: string; tool: string; input: any }
  | { type: "tool_result"; nodeId: string; tool: string; output: any; isError: boolean }
  | { type: "gate_request"; nodeId: string; message: string; commandId: string }
  | { type: "error"; nodeId: string; message: string }
  | { type: "done" };

export type NodeStatus = "idle" | "running" | "done" | "error";
