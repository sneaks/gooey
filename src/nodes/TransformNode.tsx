import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function TransformNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";
  const code = (d.code ?? "") as string;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          lang: <span style={{ color: "#eab308" }}>{d.language ?? "javascript"}</span>
        </div>
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 4,
            padding: "4px 6px",
            color: "#a5b4fc",
            fontSize: 10,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            maxHeight: 60,
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {code ? code.slice(0, 120) + (code.length > 120 ? "..." : "") : "(empty)"}
        </div>
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>✓ Transformed</div>
        )}
        {status === "error" && (
          <div style={{ marginTop: 4, color: "#ef4444", fontSize: 10 }}>
            ✗ {nodeState?.error ?? "Error"}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
