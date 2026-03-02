import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function WebhookTriggerNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";
  const port = d.port ?? 8080;
  const path = d.path ?? "/webhook";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 2 }}>
          <span style={{ color: "#22c55e", fontWeight: 600, fontFamily: "monospace", fontSize: 10 }}>
            :{port}{path}
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: 10 }}>
          method: {d.method ?? "POST"}
        </div>
        {status === "running" && (
          <div style={{ marginTop: 4, color: "#22c55e", fontSize: 10 }}>📡 Listening...</div>
        )}
      </div>
    </BaseNode>
  );
}
