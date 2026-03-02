import React from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

export function GateNode(props: NodeProps) {
  const { id, data } = props;
  const nodeState = useGraphStore((s) => s.nodeStates[id]);
  const respondToGate = useGraphStore((s) => s.respondToGate);
  const d = data as Record<string, any>;

  const gateRequest = nodeState?.gateRequest;

  return (
    <BaseNode {...props}>
      <div style={{ fontSize: 11 }}>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>
          mode:{" "}
          <span
            style={{
              color:
                d.mode === "block"
                  ? "#ef4444"
                  : d.mode === "auto-approve"
                    ? "#22c55e"
                    : "#eab308",
              fontWeight: 600,
            }}
          >
            {d.mode ?? "confirm"}
          </span>
        </div>

        {/* Confirmation UI */}
        {gateRequest && (
          <div
            style={{
              background: "#451a03",
              border: "1px solid #f97316",
              borderRadius: 4,
              padding: "6px 8px",
              marginTop: 4,
            }}
          >
            <div
              style={{
                color: "#fb923c",
                fontSize: 10,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              ⚠️ {gateRequest.message}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  respondToGate(gateRequest.commandId, true);
                }}
                style={{
                  flex: 1,
                  padding: "3px 8px",
                  background: "#166534",
                  color: "#fff",
                  border: "none",
                  borderRadius: 3,
                  fontSize: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ✓ Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  respondToGate(gateRequest.commandId, false);
                }}
                style={{
                  flex: 1,
                  padding: "3px 8px",
                  background: "#7f1d1d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 3,
                  fontSize: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        )}

        {!gateRequest && (
          <div
            style={{
              color: "#64748b",
              fontSize: 10,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {(d.patterns ?? "").split("\n").slice(0, 3).join("\n")}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
