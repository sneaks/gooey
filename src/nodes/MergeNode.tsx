import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function MergeNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          strategy:{" "}
          <span style={{ color: "#60a5fa", fontWeight: 600 }}>
            {d.strategy ?? "concatenate"}
          </span>
        </div>
        {d.separator && d.strategy === "concatenate" && (
          <div style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>
            sep: "{d.separator}"
          </div>
        )}
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>✓ Merged</div>
        )}
      </div>
    </BaseNode>
  );
}
