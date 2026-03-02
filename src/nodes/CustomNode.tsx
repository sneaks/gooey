import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function CustomNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";
  const streamedText = nodeState?.streamedText ?? "";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          name:{" "}
          <span style={{ color: "#eab308", fontWeight: 600 }}>
            {d.customName || "Untitled"}
          </span>
        </div>
        {d.description && (
          <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>
            {d.description.slice(0, 60)}
          </div>
        )}
        <div
          style={{
            background: "#0f172a", border: "1px solid #334155", borderRadius: 4,
            padding: "4px 6px", color: "#a5b4fc", fontSize: 9, fontFamily: "monospace",
            whiteSpace: "pre-wrap", maxHeight: 40, overflow: "hidden",
          }}
        >
          {(d.executeCode ?? "").slice(0, 80) || "(no code)"}
        </div>
        {status === "running" && streamedText && (
          <div style={{ marginTop: 4, color: "#22c55e", fontSize: 10, fontFamily: "monospace" }}>
            {streamedText.slice(-60)}
          </div>
        )}
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>✓ Done</div>
        )}
      </div>
    </BaseNode>
  );
}
