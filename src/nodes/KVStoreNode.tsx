import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

const ACTION_STYLES: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  get:      { bg: "#0c1a4a", border: "#1d4ed8", color: "#93c5fd", icon: "🔍" },
  set:      { bg: "#0c2a1a", border: "#15803d", color: "#86efac", icon: "📝" },
  delete:   { bg: "#2a0c0c", border: "#b91c1c", color: "#fca5a5", icon: "🗑️" },
  "get-all":{ bg: "#1a0c2a", border: "#7c3aed", color: "#c4b5fd", icon: "📦" },
};

export function KVStoreNode(props: NodeProps) {
  const { data } = props;
  const action    = (data.action    as string) ?? "get";
  const key       = (data.key       as string) ?? "";
  const namespace = (data.namespace as string) || "default";

  const style = ACTION_STYLES[action] ?? ACTION_STYLES["get"];

  return (
    <BaseNode {...props}>
      {/* Action badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 4,
        background: style.bg,
        border: `1px solid ${style.border}`,
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 11 }}>{style.icon}</span>
        <span style={{ color: style.color, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
          {action}
        </span>
      </div>

      {/* Key */}
      {action !== "get-all" && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
          key:{" "}
          <span style={{ color: key ? "#e2e8f0" : "#475569", fontFamily: "monospace" }}>
            {key || <em style={{ color: "#475569" }}>from input</em>}
          </span>
        </div>
      )}

      {/* Namespace */}
      {namespace !== "default" && (
        <div style={{ fontSize: 10, color: "#475569" }}>
          ns: <span style={{ color: "#64748b", fontFamily: "monospace" }}>{namespace}</span>
        </div>
      )}
    </BaseNode>
  );
}
