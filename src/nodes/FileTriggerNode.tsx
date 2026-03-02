import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function FileTriggerNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          watch:{" "}
          <span style={{ color: "#22c55e", fontWeight: 600, fontFamily: "monospace", fontSize: 10 }}>
            {d.watchPath || "(not set)"}
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: 10 }}>
          events: {d.events ?? "change"}
        </div>
        {d.glob && (
          <div style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>
            glob: {d.glob}
          </div>
        )}
        {status === "running" && (
          <div style={{ marginTop: 4, color: "#22c55e", fontSize: 10 }}>👁 Watching...</div>
        )}
      </div>
    </BaseNode>
  );
}
