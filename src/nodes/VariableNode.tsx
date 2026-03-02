import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function VariableNode(props: NodeProps) {
  const { data } = props;
  const d = data as Record<string, any>;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
          <span style={{ color: "#94a3b8" }}>name:</span>
          <span style={{ color: "#eab308", fontWeight: 600, fontFamily: "monospace" }}>
            {d.varName || "(unnamed)"}
          </span>
        </div>
        <div style={{
          background: "#0f172a", border: "1px solid #334155", borderRadius: 4,
          padding: "4px 6px", color: "#e2e8f0", fontSize: 10, fontFamily: "monospace",
          maxHeight: 40, overflow: "hidden", whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {d.value
            ? String(d.value).slice(0, 80)
            : d.envVar
              ? `$${d.envVar}`
              : "(empty)"}
        </div>
        {d.envVar && (
          <div style={{ color: "#64748b", fontSize: 9, marginTop: 2 }}>
            from env: {d.envVar}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
