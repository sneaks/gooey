import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function PromptInputNode(props: NodeProps) {
  const { id, data } = props;
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  return (
    <BaseNode {...props}>
      <textarea
        value={(data as any).prompt ?? ""}
        onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
        placeholder="Enter your prompt..."
        rows={3}
        style={{
          width: "100%",
          background: "#0f172a",
          color: "#e2e8f0",
          border: "1px solid #334155",
          borderRadius: 4,
          padding: "4px 6px",
          fontSize: 11,
          resize: "vertical",
          fontFamily: "inherit",
        }}
        // Prevent React Flow from capturing keystrokes in the textarea
        onKeyDown={(e) => e.stopPropagation()}
      />
    </BaseNode>
  );
}
