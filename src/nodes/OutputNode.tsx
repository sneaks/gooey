import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function OutputNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;

  const status = nodeState?.status ?? "idle";
  const streamedText = nodeState?.streamedText ?? "";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#64748b", marginBottom: 4, fontSize: 10 }}>
          format: {d.format ?? "markdown"}
        </div>

        {/* Streaming display */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 4,
            padding: "6px 8px",
            minHeight: 40,
            maxHeight: 160,
            overflow: "auto",
            color: "#e2e8f0",
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.4,
            textAlign: "left",
          }}
        >
          {streamedText ? (
            <>
              {streamedText}
              {status === "running" && (
                <span style={{ color: "#22c55e" }}>▊</span>
              )}
            </>
          ) : (
            <span style={{ color: "#475569", fontStyle: "italic" }}>
              {status === "idle"
                ? "Waiting for input..."
                : status === "running"
                  ? "Receiving..."
                  : "No output"}
            </span>
          )}
        </div>
      </div>
    </BaseNode>
  );
}
