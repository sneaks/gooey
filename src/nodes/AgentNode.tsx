import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function AgentNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;

  const status = nodeState?.status ?? "idle";
  const streamedText = nodeState?.streamedText ?? "";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        {/* Config summary */}
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          max turns: {d.maxTurns ?? 10}
        </div>

        {/* Streaming output preview */}
        {status === "running" && streamedText && (
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 4,
              padding: "4px 6px",
              maxHeight: 80,
              overflow: "hidden",
              color: "#22c55e",
              fontSize: 10,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {streamedText.slice(-200)}
            <span
              style={{
                animation: "blink 1s step-end infinite",
                color: "#22c55e",
              }}
            >
              ▊
            </span>
          </div>
        )}

        {status === "done" && (
          <div style={{ color: "#3b82f6", fontSize: 10 }}>✓ Complete</div>
        )}

        {status === "error" && (
          <div style={{ color: "#ef4444", fontSize: 10 }}>
            ✗ {nodeState?.error ?? "Error"}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
