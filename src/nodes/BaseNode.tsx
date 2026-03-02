import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_DEFS_BY_TYPE } from "./nodeRegistry";
import { WIRE_COLORS } from "../shared/wireTypes";
import { CATEGORY_COLORS } from "../app/theme";
import { useGraphStore, type NodeRuntimeState } from "../app/store";

const STATUS_INDICATORS: Record<string, { color: string; label: string }> = {
  idle: { color: "#64748b", label: "" },
  running: { color: "#22c55e", label: "⟳" },
  done: { color: "#3b82f6", label: "✓" },
  error: { color: "#ef4444", label: "✗" },
};

interface BaseNodeProps extends NodeProps {
  children?: React.ReactNode;
}

export function BaseNode({ id, type, selected, children }: BaseNodeProps) {
  const def = NODE_DEFS_BY_TYPE[type ?? ""];
  const nodeState = useGraphStore(
    (s) => s.nodeStates[id] as NodeRuntimeState | undefined
  );
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);

  if (!def) return <div>Unknown: {type}</div>;

  const categoryColor = CATEGORY_COLORS[def.category];
  const status = nodeState?.status ?? "idle";
  const statusInfo = STATUS_INDICATORS[status];

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      style={{
        background: "#1e293b",
        border: `2px solid ${selected ? "#60a5fa" : "#334155"}`,
        borderRadius: 8,
        minWidth: 180,
        maxWidth: 260,
        fontSize: 12,
        boxShadow: selected
          ? "0 0 0 2px rgba(96, 165, 250, 0.3)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: categoryColor,
          padding: "6px 10px",
          borderRadius: "6px 6px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 600,
          color: "#fff",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <span>{def.icon}</span>
        <span style={{ flex: 1 }}>{def.label}</span>
        {statusInfo.label && (
          <span
            style={{
              color: statusInfo.color,
              fontSize: 14,
              animation:
                status === "running" ? "spin 1s linear infinite" : undefined,
            }}
          >
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "8px 10px" }}>{children}</div>

      {/* Input handles (left side) */}
      {def.inputs.map((port, i) => {
        const top = `${((i + 1) / (def.inputs.length + 1)) * 100}%`;
        return (
          <Handle
            key={port.id}
            type="target"
            id={port.id}
            position={Position.Left}
            style={{
              top,
              width: 10,
              height: 10,
              background: WIRE_COLORS[port.type],
              border: `2px solid ${port.required ? "#fff" : "#64748b"}`,
              borderRadius: "50%",
            }}
            title={`${port.label} (${port.type})${port.required ? " *" : ""}`}
          />
        );
      })}

      {/* Output handles (right side) */}
      {def.outputs.map((port, i) => {
        const top = `${((i + 1) / (def.outputs.length + 1)) * 100}%`;
        return (
          <Handle
            key={port.id}
            type="source"
            id={port.id}
            position={Position.Right}
            style={{
              top,
              width: 10,
              height: 10,
              background: WIRE_COLORS[port.type],
              border: "2px solid #fff",
              borderRadius: "50%",
            }}
            title={`${port.label} (${port.type})`}
          />
        );
      })}
    </div>
  );
}
