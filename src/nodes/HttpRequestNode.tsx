import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

const METHOD_COLORS: Record<string, string> = {
  GET: "#22c55e",
  POST: "#3b82f6",
  PUT: "#eab308",
  PATCH: "#f97316",
  DELETE: "#ef4444",
};

export function HttpRequestNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";
  const method = (d.method ?? "GET").toUpperCase();
  const url = d.url || "";
  const methodColor = METHOD_COLORS[method] ?? "#9ca3af";

  // Truncate long URLs for display
  const displayUrl = url.length > 28 ? url.slice(0, 25) + "…" : url || "(no url)";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span
            style={{
              color: methodColor,
              fontWeight: 700,
              fontFamily: "monospace",
              fontSize: 10,
              background: `${methodColor}22`,
              padding: "1px 5px",
              borderRadius: 3,
            }}
          >
            {method}
          </span>
          <span
            style={{
              color: "#94a3b8",
              fontFamily: "monospace",
              fontSize: 10,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={url}
          >
            {displayUrl}
          </span>
        </div>
        {status === "running" && (
          <div style={{ color: "#eab308", fontSize: 10 }}>⏳ Requesting...</div>
        )}
        {status === "done" && (
          <div style={{ color: "#22c55e", fontSize: 10 }}>✓ Done</div>
        )}
        {status === "error" && (
          <div style={{ color: "#ef4444", fontSize: 10 }}>✗ Error</div>
        )}
      </div>
    </BaseNode>
  );
}
