import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function ProtectedPathNode(props: NodeProps) {
  const { data } = props;
  const d = data as Record<string, any>;
  const paths = (d.paths ?? "").split("\n").filter((p: string) => p.trim());

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          mode:{" "}
          <span style={{ color: "#ef4444", fontWeight: 600 }}>
            {d.mode ?? "block-writes"}
          </span>
        </div>
        {paths.length > 0 ? (
          <div
            style={{
              color: "#64748b",
              fontSize: 10,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {paths.slice(0, 4).map((p: string, i: number) => (
              <div key={i}>🔒 {p}</div>
            ))}
            {paths.length > 4 && (
              <div style={{ color: "#475569" }}>+{paths.length - 4} more</div>
            )}
          </div>
        ) : (
          <div style={{ color: "#475569", fontSize: 10, fontStyle: "italic" }}>
            No paths configured
          </div>
        )}
      </div>
    </BaseNode>
  );
}
