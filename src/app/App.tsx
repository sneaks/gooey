import React, { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "../canvas/Canvas";
import { Sidebar } from "../panels/Sidebar";
import { Inspector } from "../panels/Inspector";
import { FileBrowser } from "../panels/FileBrowser";
import { LogsPanel } from "../panels/LogsPanel";
import { useGraphStore } from "./store";
import { runMockExecution } from "./mockRunner";
import { initWebSocket, sendMessage, isConnected, disconnectWebSocket } from "./wsClient";
import { RESEARCH_AGENT_TEMPLATE } from "../templates/researchAgent";
import { CODE_REVIEW_TEMPLATE } from "../templates/codeReview";
import { GATED_AGENT_TEMPLATE } from "../templates/gatedAgent";
import { PARALLEL_AGENTS_TEMPLATE } from "../templates/parallelAgents";
import type { GraphJSON } from "../shared/graphTypes";

const TEMPLATES: Record<string, GraphJSON> = {
  "Research Agent": RESEARCH_AGENT_TEMPLATE,
  "Code Review": CODE_REVIEW_TEMPLATE,
  "Gated Agent": GATED_AGENT_TEMPLATE,
  "Parallel Agents": PARALLEL_AGENTS_TEMPLATE,
};
import { validateGraph } from "../shared/execution/compiler";
import { NODE_DEFS_BY_TYPE } from "../nodes/nodeRegistry";
import { exportAsPiExtension } from "../shared/exportExtension";

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true";

function formatCountdown(nextRun: string | null): string {
  if (!nextRun) return "";
  const ms = new Date(nextRun).getTime() - Date.now();
  if (ms <= 0) return "now";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function Toolbar({ logsOpen, onToggleLogs }: { logsOpen: boolean; onToggleLogs: () => void }) {
  const executionState = useGraphStore((s) => s.executionState);
  const runGraph = useGraphStore((s) => s.runGraph);
  const stopGraph = useGraphStore((s) => s.stopGraph);
  const handleServerMessage = useGraphStore((s) => s.handleServerMessage);
  const saveGraph = useGraphStore((s) => s.saveGraph);
  const saveToLocalStorage = useGraphStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = useGraphStore((s) => s.loadFromLocalStorage);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const scheduleActive = useGraphStore((s) => s.scheduleActive);
  const scheduleNextRun = useGraphStore((s) => s.scheduleNextRun);
  const scheduleTick = useGraphStore((s) => s.scheduleTick);

  const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [countdown, setCountdown] = useState("");
  const mockRunRef = useRef<{ cancel: () => void } | null>(null);

  // Live countdown for schedule button label
  useEffect(() => {
    if (!scheduleActive || !scheduleNextRun) { setCountdown(""); return; }
    const tick = () => setCountdown(formatCountdown(scheduleNextRun));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [scheduleActive, scheduleNextRun]);

  // Init WebSocket when not in mock mode
  useEffect(() => {
    if (MOCK_MODE) return;
    initWebSocket(handleServerMessage, setWsStatus);
    return () => disconnectWebSocket();
  }, [handleServerMessage]);

  const handleRun = () => {
    if (executionState === "running") return;
    const graph = saveGraph();

    // Validate before running
    const errors = validateGraph(graph, NODE_DEFS_BY_TYPE);
    if (errors.length > 0) {
      alert("Graph validation errors:\n\n" + errors.join("\n"));
      return;
    }

    runGraph();

    if (MOCK_MODE) {
      mockRunRef.current = runMockExecution(graph, handleServerMessage);
    } else {
      sendMessage({ type: "run", graph });
    }
  };

  const handleStop = () => {
    if (MOCK_MODE) {
      mockRunRef.current?.cancel();
      mockRunRef.current = null;
    } else {
      sendMessage({ type: "stop" });
    }
    stopGraph();
  };

  const handleActivate = () => {
    const graph = saveGraph();
    const errors = validateGraph(graph, NODE_DEFS_BY_TYPE);
    if (errors.length > 0) {
      alert("Graph validation errors:\n\n" + errors.join("\n"));
      return;
    }
    sendMessage({ type: "schedule", graph });
  };

  const handleDeactivate = () => {
    sendMessage({ type: "unschedule" });
  };

  const saveToServer = useGraphStore((s) => s.saveToServer);
  const loadFromServer = useGraphStore((s) => s.loadFromServer);
  const listServerGraphs = useGraphStore((s) => s.listServerGraphs);

  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [fileBrowserMode, setFileBrowserMode] = useState<"load" | "save">("load");

  const handleSave = () => {
    saveToLocalStorage();
    // Open file browser for server save
    if (!MOCK_MODE && wsStatus === "connected") {
      setFileBrowserMode("save");
      setFileBrowserOpen(true);
    }
  };

  const handleLoad = async () => {
    if (!MOCK_MODE && wsStatus === "connected") {
      setFileBrowserMode("load");
      setFileBrowserOpen(true);
    } else {
      // Fall back to localStorage
      loadFromLocalStorage();
    }
  };

  const handleLoadTemplate = () => {
    const names = Object.keys(TEMPLATES);
    const choice = prompt(`Load template:\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n\nEnter number:`);
    if (!choice) return;
    const idx = parseInt(choice) - 1;
    if (idx >= 0 && idx < names.length) {
      loadGraph(TEMPLATES[names[idx]]);
    }
  };

  const handleExport = () => {
    const json = saveGraph();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gooey-graph.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        loadGraph(json);
      } catch {
        alert("Invalid graph JSON");
      }
    };
    input.click();
  };

  const handleExportExtension = () => {
    const name = prompt("Extension name:", "my-gooey-graph");
    if (!name) return;
    const graph = saveGraph();
    const code = exportAsPiExtension(graph, name);
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-zA-Z0-9_-]/g, "_")}.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const btnStyle: React.CSSProperties = {
    padding: "5px 14px",
    border: "1px solid #334155",
    borderRadius: 4,
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 0.15s",
  };

  return (
    <div
      style={{
        height: 42,
        background: "#0f172a",
        borderBottom: "1px solid #334155",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 15,
          color: "#60a5fa",
          marginRight: 16,
          letterSpacing: -0.5,
        }}
      >
        🫠 Gooey
      </div>

      {/* Run/Stop */}
      {executionState !== "running" ? (
        <button
          onClick={handleRun}
          style={{
            ...btnStyle,
            background: "#166534",
            color: "#4ade80",
            borderColor: "#16a34a",
          }}
        >
          ▶ Run
        </button>
      ) : (
        <button
          onClick={handleStop}
          style={{
            ...btnStyle,
            background: "#7f1d1d",
            color: "#fca5a5",
            borderColor: "#991b1b",
          }}
        >
          ⏹ Stop
        </button>
      )}

      {/* Schedule Activate/Deactivate — only when WS connected */}
      {!MOCK_MODE && wsStatus === "connected" && (
        scheduleActive ? (
          <button
            onClick={handleDeactivate}
            title={`Schedule active · ${scheduleTick} run${scheduleTick !== 1 ? "s" : ""}`}
            style={{
              ...btnStyle,
              background: "#1a1a0e",
              color: "#fbbf24",
              borderColor: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ animation: "blink 1.2s step-start infinite" }}>⏰</span>
            <span>
              {countdown ? `next in ${countdown}` : "Active"}
            </span>
            <span style={{ opacity: 0.6, fontSize: 10 }}>· ⏹</span>
          </button>
        ) : (
          <button
            onClick={handleActivate}
            title="Activate scheduled runs"
            style={{
              ...btnStyle,
              background: "transparent",
              color: "#64748b",
              borderColor: "transparent",
            }}
          >
            ⏰ Activate
          </button>
        )
      )}

      <div style={{ width: 1, height: 20, background: "#334155" }} />

      {/* Save/Load */}
      <button
        onClick={handleSave}
        style={{ ...btnStyle, background: "#1e293b", color: "#94a3b8" }}
      >
        💾 Save
      </button>
      <button
        onClick={handleLoad}
        style={{ ...btnStyle, background: "#1e293b", color: "#94a3b8" }}
      >
        📂 Load
      </button>

      <div style={{ width: 1, height: 20, background: "#334155" }} />

      <button
        onClick={handleLoadTemplate}
        style={{ ...btnStyle, background: "#1e293b", color: "#94a3b8" }}
      >
        📋 Template
      </button>
      <button
        onClick={handleExport}
        style={{ ...btnStyle, background: "#1e293b", color: "#94a3b8" }}
      >
        ⬇ Export
      </button>
      <button
        onClick={handleImport}
        style={{ ...btnStyle, background: "#1e293b", color: "#94a3b8" }}
      >
        ⬆ Import
      </button>
      <button
        onClick={handleExportExtension}
        style={{ ...btnStyle, background: "#1e293b", color: "#a855f7" }}
      >
        🔌 Extension
      </button>

      <div style={{ width: 1, height: 20, background: "#334155" }} />

      {/* Logs toggle */}
      <button
        onClick={onToggleLogs}
        style={{
          ...btnStyle,
          background: logsOpen ? "#1e293b" : "transparent",
          color: logsOpen ? "#e2e8f0" : "#475569",
          borderColor: logsOpen ? "#334155" : "transparent",
        }}
      >
        🪵 Logs
      </button>

      {/* Status indicator */}
      <div style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
        {!MOCK_MODE && (
          <span style={{
            color: wsStatus === "connected" ? "#22c55e" : wsStatus === "connecting" ? "#eab308" : "#ef4444",
            fontSize: 10,
          }}>
            ● {wsStatus === "connected" ? "WS" : wsStatus === "connecting" ? "Connecting..." : "Disconnected"}
          </span>
        )}
        {MOCK_MODE && <span style={{ color: "#eab308", fontSize: 10 }}>MOCK</span>}
        {executionState === "running" && (
          <span style={{ color: "#22c55e" }}>⟳ Running...</span>
        )}
        {executionState === "idle" && <span>Ready</span>}
        {executionState === "error" && (
          <span style={{ color: "#ef4444" }}>Error</span>
        )}
      </div>

      {/* File Browser Modal */}
      <FileBrowser
        isOpen={fileBrowserOpen}
        onClose={() => setFileBrowserOpen(false)}
        mode={fileBrowserMode}
      />
    </div>
  );
}

const LOGS_HEIGHT = 220;

export function App() {
  const loadFromLocalStorage = useGraphStore((s) => s.loadFromLocalStorage);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const [logsOpen, setLogsOpen] = useState(false);

  useEffect(() => {
    // Try to load saved graph, fall back to template
    const loaded = loadFromLocalStorage();
    if (!loaded) {
      loadGraph(RESEARCH_AGENT_TEMPLATE);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ReactFlowProvider>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar logsOpen={logsOpen} onToggleLogs={() => setLogsOpen((o) => !o)} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: "column" }}>
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <Sidebar />
            <Canvas />
            <Inspector />
          </div>
          {logsOpen && <LogsPanel height={LOGS_HEIGHT} />}
        </div>
      </div>

      {/* Global animation styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
        .react-flow__node {
          cursor: default !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          width: auto !important;
        }
        .react-flow__handle {
          cursor: crosshair !important;
        }
        /* Style the minimap */
        .react-flow__minimap {
          bottom: 10px !important;
          right: 10px !important;
        }
      `}</style>
    </ReactFlowProvider>
  );
}
