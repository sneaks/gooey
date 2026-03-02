import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function RouterNode(props: NodeProps) {
  const { data } = props;
  const d = data as Record<string, any>;

  let rules: { pattern: string; output: string }[] = [];
  try {
    rules = typeof d.rules === "string" ? JSON.parse(d.rules) : d.rules ?? [];
  } catch {
    rules = [];
  }

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          mode: <span style={{ color: "#60a5fa" }}>{d.routingMode ?? "contains"}</span>
        </div>
        {rules.length > 0 && (
          <div style={{ fontSize: 10, color: "#64748b" }}>
            {rules.map((r, i) => (
              <div key={i} style={{ marginBottom: 1 }}>
                <span style={{ color: "#eab308", fontFamily: "monospace" }}>
                  {r.pattern}
                </span>
                {" → "}
                <span style={{ color: "#22c55e" }}>{r.output}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
