import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function SplitNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          mode:{" "}
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>
            {d.splitMode ?? "lines"}
          </span>
        </div>
        {d.splitMode === "delimiter" && d.delimiter && (
          <div style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>
            delim: "{d.delimiter}"
          </div>
        )}
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>✓ Split</div>
        )}
      </div>
    </BaseNode>
  );
}
