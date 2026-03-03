import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

const ACTION_COLORS: Record<string, string> = {
  list: "#3b82f6",
  read: "#a855f7",
  send: "#22c55e",
};

const ACTION_LABELS: Record<string, string> = {
  list: "list",
  read: "read",
  send: "send",
};

export function GmailNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";
  const action = d.action ?? "list";
  const actionColor = ACTION_COLORS[action] ?? "#9ca3af";

  // Show query for list/read, recipient for send
  const detail =
    action === "send"
      ? d.to ? `→ ${d.to}` : "(no recipient)"
      : d.query || "is:unread";

  const displayDetail = detail.length > 24 ? detail.slice(0, 21) + "…" : detail;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span
            style={{
              color: actionColor,
              fontWeight: 700,
              fontSize: 10,
              background: `${actionColor}22`,
              padding: "1px 5px",
              borderRadius: 3,
              fontFamily: "monospace",
            }}
          >
            {ACTION_LABELS[action] ?? action}
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
            title={detail}
          >
            {displayDetail}
          </span>
        </div>
        {status === "running" && (
          <div style={{ color: "#eab308", fontSize: 10 }}>📨 Working...</div>
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
