import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function ToolSetNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const preset = d.preset ?? "coding";
  const status = nodeState?.status ?? "idle";

  const presetTools: Record<string, string[]> = {
    coding: ["read", "bash", "edit", "write"],
    readonly: ["read", "grep", "find", "ls"],
    all: ["read", "bash", "edit", "write", "grep", "find", "ls"],
    custom: (d.customTools ?? "").split(",").map((t: string) => t.trim()).filter(Boolean),
  };

  const tools = presetTools[preset] ?? presetTools.coding;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          preset:{" "}
          <span style={{ color: "#f97316", fontWeight: 600 }}>{preset}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {tools.map((t: string) => (
            <span
              key={t}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 3,
                padding: "1px 5px",
                fontSize: 9,
                color: "#f97316",
                fontFamily: "monospace",
              }}
            >
              {t}
            </span>
          ))}
        </div>
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>✓ {tools.length} tools</div>
        )}
      </div>
    </BaseNode>
  );
}
