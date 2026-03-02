import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

const TOOL_ICONS: Record<string, string> = {
  read: "📖",
  bash: "💻",
  edit: "✏️",
  write: "📝",
  grep: "🔍",
  find: "📁",
  ls: "📂",
};

export function ToolNode(props: NodeProps) {
  const { data } = props;
  const d = data as Record<string, any>;
  const toolType = d.toolType ?? "read";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>{TOOL_ICONS[toolType] ?? "🔧"}</span>
          <span style={{ color: "#f97316", fontWeight: 600 }}>
            {toolType}
          </span>
        </div>
        {d.cwd && d.cwd !== "." && (
          <div
            style={{
              color: "#64748b",
              fontSize: 10,
              marginTop: 2,
              fontFamily: "monospace",
            }}
          >
            cwd: {d.cwd}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
