import React, { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGraphStore } from "../app/store";
import { nodeTypes } from "../nodes";
import { edgeTypes } from "../edges";

export function Canvas() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const isValidConnection = useGraphStore((s) => s.isValidConnection);
  const addNode = useGraphStore((s) => s.addNode);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  const { screenToFlowPosition } = useReactFlow();

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

  // Assign edge type to all new edges
  const styledEdges = edges.map((e) => ({
    ...e,
    type: "typed",
  }));

  return (
    <div style={{ flex: 1, height: "100%" }}>
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
        onPaneClick={() => setSelectedNodeId(null)}
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
