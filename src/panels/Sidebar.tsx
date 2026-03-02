import React from "react";
import { NODE_DEFINITIONS } from "../nodes/nodeRegistry";
import type { NodeCategory, NodeDefinition } from "../shared/graphTypes";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../app/theme";

function NodePaletteItem({ def }: { def: NodeDefinition }) {
  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData("application/gooey-node-type", def.type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 6,
        cursor: "grab",
        fontSize: 12,
        color: "#e2e8f0",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#334155";
        e.currentTarget.style.borderColor = "#60a5fa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#1e293b";
        e.currentTarget.style.borderColor = "#334155";
      }}
    >
      <span style={{ fontSize: 14 }}>{def.icon}</span>
      <span>{def.label}</span>
    </div>
  );
}

export function Sidebar() {
  // Group by category
  const categories: NodeCategory[] = [
    "core",
    "io",
    "safety",
    "integration",
    "utility",
  ];

  const grouped = new Map<NodeCategory, NodeDefinition[]>();
  for (const cat of categories) {
    grouped.set(
      cat,
      NODE_DEFINITIONS.filter((d) => d.category === cat)
    );
  }

  return (
    <div
      style={{
        width: 200,
        height: "100%",
        background: "#0f172a",
        borderRight: "1px solid #334155",
        padding: "12px 8px",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#64748b",
          marginBottom: 12,
          padding: "0 4px",
        }}
      >
        Nodes
      </div>

      {categories.map((cat) => {
        const nodes = grouped.get(cat);
        if (!nodes || nodes.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: CATEGORY_COLORS[cat],
                marginBottom: 6,
                padding: "0 4px",
              }}
            >
              {CATEGORY_LABELS[cat]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {nodes.map((def) => (
                <NodePaletteItem key={def.type} def={def} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
