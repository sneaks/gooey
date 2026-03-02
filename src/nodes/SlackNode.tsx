import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function SlackNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          action:{" "}
          <span style={{ color: "#a855f7", fontWeight: 600 }}>
            {d.action ?? "send"}
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: 10 }}>
          channel: <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{d.channel || "#general"}</span>
        </div>
        {d.action === "listen" && status === "running" && (
          <div style={{ marginTop: 4, color: "#22c55e", fontSize: 10 }}>📡 Listening...</div>
        )}
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>✓ Sent</div>
        )}
      </div>
    </BaseNode>
  );
}
