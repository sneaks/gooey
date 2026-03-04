import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function DeactivateScheduleNode(props: NodeProps) {
  const scheduleActive = useGraphStore((s) => s.scheduleActive);

  return (
    <BaseNode {...props}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 6,
          background: scheduleActive ? "#2d0a0a" : "#1e293b",
          border: `1px solid ${scheduleActive ? "#7f1d1d" : "#334155"}`,
          fontSize: 12,
        }}
      >
        <span style={{ fontSize: 16 }}>⏹</span>
        <div>
          <div style={{ color: scheduleActive ? "#fca5a5" : "#64748b", fontWeight: 600 }}>
            {scheduleActive ? "Will stop schedule" : "Schedule not active"}
          </div>
          <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>
            when this node is reached
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
