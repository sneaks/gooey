import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

const TRANSPORT_BADGE: Record<string, { color: string; label: string }> = {
  stdio: { color: "#a78bfa", label: "stdio" },
  http:  { color: "#34d399", label: "http"  },
};

const MODE_BADGE: Record<string, { bg: string; border: string; color: string }> = {
  call: { bg: "#0c2a1a", border: "#15803d", color: "#86efac" },
  list: { bg: "#0c1a4a", border: "#1d4ed8", color: "#93c5fd" },
};

export function MCPNode(props: NodeProps) {
  const { data } = props;
  const transport = (data.transport as string) ?? "stdio";
  const mode      = (data.mode      as string) ?? "call";
  const command   = (data.command   as string) ?? "";
  const url       = (data.url       as string) ?? "";
  const toolName  = (data.toolName  as string) ?? "";

  const transportBadge = TRANSPORT_BADGE[transport] ?? TRANSPORT_BADGE.stdio;
  const modeBadge      = MODE_BADGE[mode]            ?? MODE_BADGE.call;

  // Derive a short server label from the command or URL
  const serverLabel = transport === "stdio"
    ? (command.split(/\s+/).find((p) => p.includes("/") || p.includes("server")) ?? command.split(/\s+/)[0] ?? "")
    : url;

  return (
    <BaseNode {...props}>
      {/* Transport + mode badges */}
      <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: transportBadge.color,
          background: "#1e293b",
          border: `1px solid ${transportBadge.color}44`,
          borderRadius: 3,
          padding: "2px 6px",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}>
          {transportBadge.label}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: modeBadge.color,
          background: modeBadge.bg,
          border: `1px solid ${modeBadge.border}`,
          borderRadius: 3,
          padding: "2px 6px",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}>
          {mode}
        </span>
      </div>

      {/* Server */}
      {serverLabel ? (
        <div style={{
          fontSize: 11,
          color: "#94a3b8",
          marginBottom: 4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 180,
        }}>
          <span style={{ color: "#475569" }}>server </span>
          <span style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: 10 }}>
            {serverLabel}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 4, fontStyle: "italic" }}>
          no server configured
        </div>
      )}

      {/* Tool name (call mode only) */}
      {mode === "call" && (
        <div style={{ fontSize: 11, color: "#94a3b8" }}>
          <span style={{ color: "#475569" }}>tool </span>
          <span style={{ color: toolName ? "#fbbf24" : "#475569", fontFamily: "monospace", fontSize: 10 }}>
            {toolName || <em style={{ color: "#475569" }}>from input</em>}
          </span>
        </div>
      )}
    </BaseNode>
  );
}
