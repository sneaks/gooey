import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function RemoteExecNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 2 }}>
          <span style={{ color: "#f97316", fontWeight: 600, fontFamily: "monospace", fontSize: 10 }}>
            {d.user ?? "user"}@{d.host || "(no host)"}
          </span>
        </div>
        {d.port && d.port !== 22 && (
          <div style={{ color: "#64748b", fontSize: 10 }}>port: {d.port}</div>
        )}
        <div style={{ color: "#64748b", fontSize: 10 }}>
          auth: {d.authMethod ?? "key"}
        </div>
        {status === "running" && (
          <div style={{ marginTop: 4, color: "#22c55e", fontSize: 10 }}>🔗 Connected</div>
        )}
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>✓ Done</div>
        )}
        {status === "error" && (
          <div style={{ marginTop: 4, color: "#ef4444", fontSize: 10 }}>
            ✗ {nodeState?.error ?? "Connection failed"}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
