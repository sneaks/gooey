import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function MemoryNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const d = data as Record<string, any>;
  const status = nodeState?.status ?? "idle";

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          strategy:{" "}
          <span style={{ color: "#a855f7", fontWeight: 600 }}>
            {d.strategy ?? "full-history"}
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: 10 }}>
          max messages: {d.maxMessages ?? "∞"}
        </div>
        {d.strategy === "sliding-window" && (
          <div style={{ color: "#64748b", fontSize: 10 }}>
            window: {d.windowSize ?? 20}
          </div>
        )}
        {d.strategy === "summary" && (
          <div style={{ color: "#64748b", fontSize: 10 }}>
            auto-summarize after {d.summarizeAfter ?? 50} messages
          </div>
        )}
        {status === "running" && (
          <div style={{ marginTop: 4, color: "#22c55e", fontSize: 10 }}>
            ⟳ Storing context...
          </div>
        )}
        {status === "done" && (
          <div style={{ marginTop: 4, color: "#3b82f6", fontSize: 10 }}>
            ✓ Context ready
          </div>
        )}
      </div>
    </BaseNode>
  );
}
