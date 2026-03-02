import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

const SIZES: Record<string, { w: number; h: number }> = {
  S: { w: 180, h: 80 },
  M: { w: 240, h: 140 },
  L: { w: 360, h: 260 },
};

export function OutputNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const d = data as Record<string, any>;

  const status = nodeState?.status ?? "idle";
  const streamedText = nodeState?.streamedText ?? "";
  const size = d._size ?? "M";
  const { w, h } = SIZES[size] ?? SIZES.M;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11, width: w }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#64748b", fontSize: 10 }}>
            format: {d.format ?? "markdown"}
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            {(["S", "M", "L"] as const).map((s) => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); updateNodeData(id, { _size: s }); }}
                style={{
                  background: size === s ? "#60a5fa" : "#1e293b",
                  border: "1px solid #334155", borderRadius: 2,
                  color: size === s ? "#fff" : "#64748b",
                  fontSize: 8, padding: "1px 4px", cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 4,
            padding: "6px 8px",
            height: h,
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
