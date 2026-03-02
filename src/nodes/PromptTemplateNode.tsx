import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

export function PromptTemplateNode(props: NodeProps) {
  const { data } = props;
  const d = data as Record<string, any>;
  const content = (d.content ?? "") as string;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div
          style={{
            color: "#94a3b8",
            fontSize: 10,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            maxHeight: 60,
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {content
            ? content.slice(0, 120) + (content.length > 120 ? "..." : "")
            : "(empty template)"}
        </div>
      </div>
    </BaseNode>
  );
}
