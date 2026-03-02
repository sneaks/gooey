import { create } from "zustand";
import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
} from "@xyflow/react";
import type { NodeStatus, ServerMessage } from "../shared/protocol";
import type { GraphJSON } from "../shared/graphTypes";
import { sendMessage as wsSend } from "./wsClient";
import { NODE_DEFS_BY_TYPE } from "../nodes/nodeRegistry";
import { isTypeCompatible } from "../shared/wireTypes";

export interface NodeRuntimeState {
  status: NodeStatus;
  streamedText: string;
  error?: string;
  gateRequest?: { commandId: string; message: string };
}

interface GraphStore {
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Selection
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Execution state
  executionState: "idle" | "running" | "paused" | "error";
  nodeStates: Record<string, NodeRuntimeState>;

  // Actions
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  deleteNode: (nodeId: string) => void;
  isValidConnection: (connection: Connection) => boolean;

  // Execution
  handleServerMessage: (msg: ServerMessage) => void;
  runGraph: () => void;
  stopGraph: () => void;
  respondToGate: (commandId: string, approved: boolean) => void;

  // Persistence
  saveGraph: () => GraphJSON;
  loadGraph: (json: GraphJSON) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  saveToServer: (name: string) => Promise<void>;
  loadFromServer: (name: string) => Promise<boolean>;
  listServerGraphs: () => Promise<string[]>;
  exportLocalStorageToFile: () => string | null;
}

let nodeIdCounter = 1;

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  executionState: "idle",
  nodeStates: {},

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  onNodesChange: (changes) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    const updates: Partial<GraphStore> = { nodes: newNodes };

    // If the selected node was removed, clear selection
    const selectedId = get().selectedNodeId;
    if (selectedId && !newNodes.find((n) => n.id === selectedId)) {
      updates.selectedNodeId = null;
    }

    // Also clean up edges for removed nodes
    const removedIds = changes
      .filter((c) => c.type === "remove")
      .map((c) => c.id);
    if (removedIds.length > 0) {
      updates.edges = get().edges.filter(
        (e) => !removedIds.includes(e.source) && !removedIds.includes(e.target)
      );
    }

    set(updates);
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    if (!get().isValidConnection(connection)) return;
    set({ edges: addEdge(connection, get().edges) });
  },

  isValidConnection: (connection) => {
    const { nodes } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;

    const sourceDef = NODE_DEFS_BY_TYPE[sourceNode.type!];
    const targetDef = NODE_DEFS_BY_TYPE[targetNode.type!];
    if (!sourceDef || !targetDef) return false;

    const sourcePort = sourceDef.outputs.find(
      (p) => p.id === connection.sourceHandle
    );
    const targetPort = targetDef.inputs.find(
      (p) => p.id === connection.targetHandle
    );
    if (!sourcePort || !targetPort) return false;

    return isTypeCompatible(sourcePort.type, targetPort.type);
  },

  addNode: (type, position) => {
    const def = NODE_DEFS_BY_TYPE[type];
    if (!def) return;

    // Build default config from definition
    const data: Record<string, any> = {};
    for (const field of def.config) {
      data[field.key] = field.default ?? "";
    }

    const id = `${type}-${nodeIdCounter++}`;
    const newNode: Node = {
      id,
      type,
      position,
      data,
    };

    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNodeId:
        get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  handleServerMessage: (msg) => {
    switch (msg.type) {
      case "node_state":
        set({
          nodeStates: {
            ...get().nodeStates,
            [msg.nodeId]: {
              ...get().nodeStates[msg.nodeId],
              status: msg.status,
              error: msg.error,
            },
          },
        });
        break;

      case "stream_token":
        set({
          nodeStates: {
            ...get().nodeStates,
            [msg.nodeId]: {
              ...get().nodeStates[msg.nodeId],
              status: "running",
              streamedText:
                (get().nodeStates[msg.nodeId]?.streamedText ?? "") + msg.token,
            },
          },
        });
        break;

      case "gate_request":
        set({
          nodeStates: {
            ...get().nodeStates,
            [msg.nodeId]: {
              ...get().nodeStates[msg.nodeId],
              status: "running",
              streamedText: get().nodeStates[msg.nodeId]?.streamedText ?? "",
              gateRequest: {
                commandId: msg.commandId,
                message: msg.message,
              },
            },
          },
        });
        break;

      case "tool_call":
      case "tool_result":
        // Currently a no-op in Phase 0 — will display in agent node in Phase 1
        break;

      case "error":
        set({
          nodeStates: {
            ...get().nodeStates,
            [msg.nodeId]: {
              ...get().nodeStates[msg.nodeId],
              status: "error",
              error: msg.message,
              streamedText: get().nodeStates[msg.nodeId]?.streamedText ?? "",
            },
          },
        });
        break;

      case "done":
        set({ executionState: "idle" });
        break;
    }
  },

  runGraph: () => {
    // Reset all node states
    const nodeStates: Record<string, NodeRuntimeState> = {};
    for (const node of get().nodes) {
      nodeStates[node.id] = { status: "idle", streamedText: "" };
    }
    set({ executionState: "running", nodeStates });
  },

  stopGraph: () => {
    set({ executionState: "idle" });
  },

  respondToGate: (commandId, approved) => {
    // Send to server (no-op if not connected / mock mode)
    wsSend({ type: "gate_response", commandId, approved });

    // Update local state
    const nodeStates = { ...get().nodeStates };
    for (const [nodeId, state] of Object.entries(nodeStates)) {
      if (state.gateRequest?.commandId === commandId) {
        nodeStates[nodeId] = {
          ...state,
          gateRequest: undefined,
          status: approved ? "running" : "done",
        };
        break;
      }
    }
    set({ nodeStates });
  },

  saveGraph: () => {
    const { nodes, edges } = get();
    return {
      version: 1 as const,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type!,
        position: n.position,
        data: n.data as Record<string, any>,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle!,
        target: e.target,
        targetHandle: e.targetHandle!,
      })),
    };
  },

  loadGraph: (json) => {
    // Update counter to avoid collisions
    for (const n of json.nodes) {
      const match = n.id.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num >= nodeIdCounter) nodeIdCounter = num + 1;
      }
    }

    set({
      nodes: json.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: json.edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
      })),
      selectedNodeId: null,
      executionState: "idle",
      nodeStates: {},
    });
  },

  saveToLocalStorage: () => {
    const json = get().saveGraph();
    localStorage.setItem("gooey-graph", JSON.stringify(json));
  },

  loadFromLocalStorage: () => {
    const raw = localStorage.getItem("gooey-graph");
    if (!raw) return false;
    try {
      const json: GraphJSON = JSON.parse(raw);
      get().loadGraph(json);
      return true;
    } catch {
      return false;
    }
  },

  saveToServer: async (name: string) => {
    const json = get().saveGraph();
    await fetch(`http://localhost:4242/api/graphs/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });
  },

  loadFromServer: async (name: string) => {
    try {
      const res = await fetch(`http://localhost:4242/api/graphs/${encodeURIComponent(name)}`);
      if (!res.ok) return false;
      const json: GraphJSON = await res.json();
      get().loadGraph(json);
      return true;
    } catch {
      return false;
    }
  },

  listServerGraphs: async () => {
    try {
      const res = await fetch("http://localhost:4242/api/graphs");
      const data = await res.json();
      return data.graphs ?? [];
    } catch {
      return [];
    }
  },

  exportLocalStorageToFile: () => {
    const raw = localStorage.getItem("gooey-graph");
    return raw ?? null;
  },
}));
