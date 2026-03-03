import React, { useState, useEffect } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";

interface TestProps {
  onTest?: () => Promise<void>;
  testStatus?: "idle" | "testing" | "success" | "error";
  testMessage?: string;
  visible?: boolean;
}

export function LLMProviderNode(props: NodeProps & TestProps) {
  const { data, onTest, testStatus, testMessage, visible } = props;
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
        
        {/* Test Button - only show when visible prop is true */}
        {visible && (
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <button
              onClick={onTest}
              style={{
                padding: "4px 8px",
                background: testStatus === "testing" ? "#eab308" : "#1e293b",
                border: "1px solid #334155",
                borderRadius: 4,
                color: "#94a3b8",
                fontSize: 10,
                fontWeight: 500,
                cursor: "pointer",
                opacity: testStatus === "testing" ? 0.7 : 1,
              }}
              disabled={testStatus === "testing"}
            >
              {testStatus === "testing" ? "Testing..." : "Test"}
            </button>
            {testStatus !== "idle" && (
              <span
                style={{
                  fontSize: 10,
                  color: testStatus === "success" ? "#22c55e" : "#ef4444",
                }}
              >
                {testStatus === "success" ? "✓" : "✗"} {testMessage}
              </span>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

