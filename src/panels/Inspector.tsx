import React, { useState } from "react";
import { useGraphStore } from "../app/store";
import { NODE_DEFS_BY_TYPE } from "../nodes/nodeRegistry";
import type { ConfigField } from "../shared/graphTypes";
import { CATEGORY_COLORS } from "../app/theme";
import { loadPresets, savePreset, deletePreset } from "../app/llmPresets";

function ConfigFieldEditor({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: any;
  onChange: (value: any) => void;
}) {
  const baseInputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: 12,
    fontFamily: "inherit",
  };

  switch (field.type) {
    case "select":
      return (
        <select
          value={value ?? field.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...baseInputStyle, cursor: "pointer" }}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "boolean":
      return (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontSize: 12,
            color: "#e2e8f0",
          }}
        >
          <input
            type="checkbox"
            checked={value ?? field.default ?? false}
            onChange={(e) => onChange(e.target.checked)}
            style={{ accentColor: "#60a5fa" }}
          />
          {value ? "Enabled" : "Disabled"}
        </label>
      );

    case "number":
      return (
        <input
          type="number"
          value={value ?? field.default ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          style={baseInputStyle}
        />
      );

    case "textarea":
    case "code":
    case "json":
      return (
        <textarea
          value={value ?? field.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={field.type === "json" ? 6 : 4}
          style={{
            ...baseInputStyle,
            resize: "vertical",
            fontFamily:
              field.type === "code" || field.type === "json"
                ? "monospace"
                : "inherit",
            fontSize: 11,
          }}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value ?? field.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={baseInputStyle}
        />
      );
  }
}

export function Inspector() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const deleteNode = useGraphStore((s) => s.deleteNode);
  const nodeState = useGraphStore((s) => selectedNodeId ? s.nodeStates[selectedNodeId] : undefined);

  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [presets, setPresets] = useState(() => loadPresets());
  const [selectedPreset, setSelectedPreset] = useState("");
  const prevNodeId = React.useRef<string | null>(null);
  if (prevNodeId.current !== selectedNodeId) {
    prevNodeId.current = selectedNodeId ?? null;
    if (testStatus !== "idle") {
      setTestStatus("idle");
      setTestMessage("");
    }
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const def = selectedNode ? NODE_DEFS_BY_TYPE[selectedNode.type!] : null;

  const testLLMProvider = async () => {
    if (!selectedNode) return;
    const d = selectedNode.data as Record<string, any>;
    setTestStatus("testing");
    setTestMessage("");
    try {
      const res = await fetch("http://localhost:4242/api/test-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: d.provider,
          modelId: d.modelId,
          apiKeyEnvVar: d.apiKeyEnvVar,
          baseURL: d.baseURL,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setTestStatus("success");
        setTestMessage("Connected");
      } else {
        setTestStatus("error");
        setTestMessage(json.error ?? "Unknown error");
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestMessage(err.message ?? String(err));
    }
  };

  if (!selectedNode || !def) {
    return (
      <div
        style={{
          width: 260,
          height: "100%",
          background: "#0f172a",
          borderLeft: "1px solid #334155",
          padding: "12px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#475569", fontSize: 12, fontStyle: "italic" }}>
          Select a node to inspect
        </span>
      </div>
    );
  }

  const data = selectedNode.data as Record<string, any>;
  const categoryColor = CATEGORY_COLORS[def.category];

  return (
    <div
      style={{
        width: 260,
        height: "100%",
        background: "#0f172a",
        borderLeft: "1px solid #334155",
        padding: "12px",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid #334155",
        }}
      >
        <span style={{ fontSize: 18 }}>{def.icon}</span>
        <div>
          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>
            {def.label}
          </div>
          <div
            style={{
              fontSize: 10,
              color: categoryColor,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {def.category}
          </div>
        </div>
      </div>

      {/* Node ID */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 10,
            color: "#64748b",
            fontFamily: "monospace",
          }}
        >
          id: {selectedNode.id}
        </div>
      </div>

      {/* Ports info */}
      {(def.inputs.length > 0 || def.outputs.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            Ports
          </div>
          <div style={{ fontSize: 11 }}>
            {def.inputs.map((p) => (
              <div key={p.id} style={{ color: "#94a3b8", marginBottom: 1 }}>
                ← {p.label}{" "}
                <span style={{ color: "#64748b", fontSize: 10 }}>
                  ({p.type})
                  {p.required ? " *" : ""}
                </span>
              </div>
            ))}
            {def.outputs.map((p) => (
              <div key={p.id} style={{ color: "#94a3b8", marginBottom: 1 }}>
                → {p.label}{" "}
                <span style={{ color: "#64748b", fontSize: 10 }}>
                  ({p.type})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LLM Presets */}
      {def.type === "llm-provider" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
            color: "#64748b", marginBottom: 8,
          }}>
            Presets
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              style={{
                flex: 1, background: "#0f172a", color: "#e2e8f0",
                border: "1px solid #334155", borderRadius: 4,
                padding: "4px 6px", fontSize: 11, fontFamily: "inherit",
              }}
            >
              <option value="">— select preset —</option>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button
              disabled={!selectedPreset}
              onClick={() => {
                const p = presets.find((x) => x.name === selectedPreset);
                if (!p) return;
                updateNodeData(selectedNode.id, {
                  provider: p.provider, modelId: p.modelId,
                  baseURL: p.baseURL, thinkingLevel: p.thinkingLevel,
                  apiKeyEnvVar: p.apiKeyEnvVar,
                });
              }}
              style={{
                padding: "4px 8px", background: "#1e293b",
                border: "1px solid #334155", borderRadius: 4,
                color: selectedPreset ? "#60a5fa" : "#475569",
                fontSize: 10, cursor: selectedPreset ? "pointer" : "default",
              }}
            >
              Load
            </button>
            <button
              disabled={!selectedPreset}
              onClick={() => {
                if (!selectedPreset) return;
                deletePreset(selectedPreset);
                const updated = loadPresets();
                setPresets(updated);
                setSelectedPreset("");
              }}
              style={{
                padding: "4px 8px", background: "#1e293b",
                border: "1px solid #334155", borderRadius: 4,
                color: selectedPreset ? "#f87171" : "#475569",
                fontSize: 10, cursor: selectedPreset ? "pointer" : "default",
              }}
            >
              Del
            </button>
          </div>
          <button
            onClick={() => {
              const name = window.prompt("Preset name:", data.modelId as string ?? "");
              if (!name?.trim()) return;
              const preset = {
                name: name.trim(),
                provider: (data.provider as string) ?? "",
                modelId: (data.modelId as string) ?? "",
                baseURL: (data.baseURL as string) ?? "",
                thinkingLevel: (data.thinkingLevel as string) ?? "off",
                apiKeyEnvVar: (data.apiKeyEnvVar as string) ?? "",
              };
              savePreset(preset);
              const updated = loadPresets();
              setPresets(updated);
              setSelectedPreset(name.trim());
            }}
            style={{
              width: "100%", padding: "4px 8px", background: "#0c1a0c",
              border: "1px solid #15803d", borderRadius: 4,
              color: "#86efac", fontSize: 10, cursor: "pointer",
            }}
          >
            + Save current as preset
          </button>
        </div>
      )}

      {/* Config fields */}
      {def.config.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            Configuration
          </div>
          {def.config.map((field) => (
            <div key={field.key} style={{ marginBottom: 10 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#94a3b8",
                  marginBottom: 3,
                  fontWeight: 500,
                }}
              >
                {field.label}
              </label>
              <ConfigFieldEditor
                field={field}
                value={data[field.key]}
                onChange={(val) =>
                  updateNodeData(selectedNode.id, { [field.key]: val })
                }
              />
              {field.description && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    marginTop: 2,
                  }}
                >
                  {field.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Connection test for LLM Provider nodes */}
      {def.type === "llm-provider" && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            Connection Test
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={testLLMProvider}
              disabled={testStatus === "testing"}
              style={{
                padding: "4px 8px",
                background: testStatus === "testing" ? "#eab308" : "#1e293b",
                border: "1px solid #334155",
                borderRadius: 4,
                color: "#94a3b8",
                fontSize: 10,
                fontWeight: 500,
                cursor: testStatus === "testing" ? "default" : "pointer",
                opacity: testStatus === "testing" ? 0.7 : 1,
              }}
            >
              {testStatus === "testing" ? "Testing..." : "Test"}
            </button>
            {testStatus !== "idle" && testStatus !== "testing" && (
              <span
                style={{
                  fontSize: 10,
                  color: testStatus === "success" ? "#22c55e" : "#ef4444",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={testMessage}
              >
                {testStatus === "success" ? "✓" : "✗"} {testMessage}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Runtime output (for output/agent/subagent nodes) */}
      {nodeState?.streamedText && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            Output ({nodeState.streamedText.length} chars)
          </div>
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 4,
              padding: "6px 8px",
              maxHeight: 300,
              overflow: "auto",
              color: "#e2e8f0",
              fontSize: 11,
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.4,
            }}
          >
            {nodeState.streamedText}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(nodeState.streamedText);
            }}
            style={{
              marginTop: 4,
              padding: "3px 8px",
              background: "#1e293b",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: 3,
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            📋 Copy
          </button>
        </div>
      )}

      {/* Runtime status */}
      {nodeState?.status && nodeState.status !== "idle" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>
            Status:{" "}
            <span style={{
              color: nodeState.status === "running" ? "#22c55e"
                : nodeState.status === "done" ? "#3b82f6"
                : nodeState.status === "error" ? "#ef4444" : "#64748b",
              fontWeight: 600,
            }}>
              {nodeState.status}
            </span>
          </div>
          {nodeState.error && (
            <div style={{ fontSize: 10, color: "#ef4444" }}>{nodeState.error}</div>
          )}
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={() => deleteNode(selectedNode.id)}
        style={{
          width: "100%",
          padding: "6px 12px",
          background: "#7f1d1d",
          color: "#fca5a5",
          border: "1px solid #991b1b",
          borderRadius: 4,
          fontSize: 11,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Delete Node
      </button>
    </div>
  );
}
