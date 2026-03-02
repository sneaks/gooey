import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "../app/store";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";
import { NODE_DEFINITIONS } from "../nodes/nodeRegistry";
import { CATEGORY_COLORS } from "../app/theme";

function NodeSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const addNode = useGraphStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  const filtered = NODE_DEFINITIONS.filter(
    (d) =>
      d.label.toLowerCase().includes(query.toLowerCase()) ||
      d.type.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (type: string) => {
    // Add at center of viewport
    const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(type, pos);
    onClose();
  };

  return (
    <div
      style={{
        position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)",
        zIndex: 100, background: "#1e293b", border: "1px solid #334155",
        borderRadius: 8, padding: 8, width: 300, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search nodes..."
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && filtered.length > 0) handleSelect(filtered[0].type);
        }}
        style={{
          width: "100%", background: "#0f172a", color: "#e2e8f0",
          border: "1px solid #334155", borderRadius: 4, padding: "6px 10px",
          fontSize: 13, outline: "none", marginBottom: 6,
        }}
      />
      <div style={{ maxHeight: 240, overflowY: "auto" }}>
        {filtered.map((def) => (
          <div
            key={def.type}
            onClick={() => handleSelect(def.type)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
              cursor: "pointer", borderRadius: 4, fontSize: 12, color: "#e2e8f0",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span>{def.icon}</span>
            <span>{def.label}</span>
            <span style={{ marginLeft: "auto", fontSize: 9, color: CATEGORY_COLORS[def.category] }}>
              {def.category}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: "#475569", fontSize: 12, padding: "8px", textAlign: "center" }}>
            No nodes found
          </div>
        )}
      </div>
    </div>
  );
}

export function Canvas() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const isValidConnection = useGraphStore((s) => s.isValidConnection);
  const addNode = useGraphStore((s) => s.addNode);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);

  const [showSearch, setShowSearch] = useState(false);

  const { screenToFlowPosition } = useReactFlow();

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/gooey-node-type");
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeType, position);
    },
    [addNode, screenToFlowPosition]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const styledEdges = edges.map((e) => ({
    ...e,
    type: "typed",
  }));

  return (
    <div style={{ flex: 1, height: "100%", position: "relative" }}>
      {showSearch && <NodeSearch onClose={() => setShowSearch(false)} />}
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection as any}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => { setSelectedNodeId(null); setShowSearch(false); }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{ type: "typed" }}
        proOptions={{ hideAttribution: true }}
        style={{ background: "#1a1a2e" }}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#334155"
        />
        <Controls
          style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 4 }}
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            const typeColors: Record<string, string> = {
              "llm-provider": "#3b82f6",
              agent: "#3b82f6",
              tool: "#3b82f6",
              "prompt-input": "#22c55e",
              output: "#22c55e",
              gate: "#ef4444",
              router: "#3b82f6",
              subagent: "#3b82f6",
              "prompt-template": "#3b82f6",
            };
            return typeColors[n.type ?? ""] ?? "#6b7280";
          }}
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 4,
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
