import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function SubagentNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;

  const status = nodeState?.status ?? "idle";
  const streamedText = nodeState?.streamedText ?? "";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <span style={{ color: "#94a3b8" }}>agent:</span>
          <span style={{ color: "#a855f7", fontWeight: 600 }}>
            {d.agentName || "(unnamed)"}
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: 10 }}>
          mode: <span style={{ color: "#60a5fa" }}>{d.mode ?? "single"}</span>
          {" · "}
          scope: {d.agentScope ?? "user"}
        </div>

        {status === "running" && (
          <div
            style={{
              marginTop: 4,
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 4,
              padding: "4px 6px",
              color: "#22c55e",
              fontSize: 10,
              fontFamily: "monospace",
              maxHeight: 60,
              overflow: "hidden",
            }}
          >
            {streamedText || "Running..."}
          </div>
        )}

        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>
            ✓ Complete
          </div>
        )}
      </div>
    </BaseNode>
  );
}
