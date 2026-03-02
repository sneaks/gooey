import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function LLMProviderNode(props: NodeProps) {
  const { data } = props;
  const d = data as Record<string, any>;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11, color: "#94a3b8" }}>
        <div style={{ marginBottom: 2 }}>
          <span style={{ color: "#a855f7", fontWeight: 600 }}>
            {(d.provider ?? "anthropic").toUpperCase()}
          </span>
        </div>
        <div style={{ color: "#e2e8f0", fontWeight: 500 }}>
          {d.modelId ?? "claude-sonnet-4-20250514"}
        </div>
        {d.thinkingLevel && d.thinkingLevel !== "off" && (
          <div style={{ marginTop: 2, color: "#eab308", fontSize: 10 }}>
            thinking: {d.thinkingLevel}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
