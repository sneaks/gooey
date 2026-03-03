import React, { useEffect, useRef, useState } from "react";
import { useGraphStore, type LogEntry, type LogLevel } from "../app/store";

const LEVEL_STYLES: Record<LogLevel, { icon: string; color: string; bg: string }> = {
  info:        { icon: "·",  color: "#64748b", bg: "transparent" },
  warn:        { icon: "⚠",  color: "#eab308", bg: "#1c1800"    },
  error:       { icon: "✗",  color: "#ef4444", bg: "#1c0000"    },
  tool_call:   { icon: "→",  color: "#a855f7", bg: "transparent" },
  tool_result: { icon: "←",  color: "#3b82f6", bg: "transparent" },
};

type Filter = "all" | "errors" | "tools";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function matchesFilter(entry: LogEntry, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "errors") return entry.level === "error";
  if (filter === "tools") return entry.level === "tool_call" || entry.level === "tool_result";
  return true;
}

function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const style = LEVEL_STYLES[entry.level];
  const hasDetail = !!entry.detail;

  return (
    <div
      style={{
        borderBottom: "1px solid #1e293b",
        background: style.bg,
        cursor: hasDetail ? "pointer" : "default",
        userSelect: "text",
      }}
      onClick={() => hasDetail && setExpanded((e) => !e)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          padding: "3px 10px",
          fontFamily: "monospace",
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        {/* Timestamp */}
        <span style={{ color: "#334155", flexShrink: 0, fontSize: 10 }}>
          {formatTime(entry.timestamp)}
        </span>

        {/* Level icon */}
        <span style={{ color: style.color, flexShrink: 0, width: 10 }}>
          {style.icon}
        </span>

        {/* Node badge */}
        {entry.nodeId && (
          <span
            style={{
              color: "#475569",
              background: "#1e293b",
              borderRadius: 3,
              padding: "0 4px",
              fontSize: 10,
              flexShrink: 0,
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={entry.nodeId}
          >
            {entry.nodeId}
          </span>
        )}

        {/* Message */}
        <span
          style={{
            color: style.color === "#64748b" ? "#94a3b8" : style.color,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: expanded ? "pre-wrap" : "nowrap",
          }}
        >
          {entry.message}
        </span>

        {/* Expand indicator */}
        {hasDetail && (
          <span style={{ color: "#334155", fontSize: 10, flexShrink: 0 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && entry.detail && (
        <div
          style={{
            padding: "4px 10px 6px 40px",
            fontFamily: "monospace",
            fontSize: 10,
            color: "#64748b",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            borderTop: "1px solid #1e293b",
            background: "#080f1a",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {entry.detail}
        </div>
      )}
    </div>
  );
}

interface LogsPanelProps {
  height: number;
}

export function LogsPanel({ height }: LogsPanelProps) {
  const logEntries = useGraphStore((s) => s.logEntries);
  const clearLogs = useGraphStore((s) => s.clearLogs);
  const [filter, setFilter] = useState<Filter>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = logEntries.filter((e) => matchesFilter(e, filter));

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filtered.length, autoScroll]);

  // Detect manual scroll away from bottom → disable auto-scroll
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  const errorCount = logEntries.filter((e) => e.level === "error").length;

  const copyAll = () => {
    const text = filtered
      .map((e) => `[${formatTime(e.timestamp)}] ${e.level.toUpperCase()} [${e.nodeId}] ${e.message}${e.detail ? "\n" + e.detail : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "2px 8px",
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 3,
    border: "1px solid",
    cursor: "pointer",
    background: active ? "#1e293b" : "transparent",
    borderColor: active ? "#334155" : "transparent",
    color: active ? "#e2e8f0" : "#475569",
  });

  return (
    <div
      style={{
        height,
        borderTop: "1px solid #334155",
        background: "#040d18",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Logs
        </span>
        {errorCount > 0 && (
          <span style={{ fontSize: 10, background: "#7f1d1d", color: "#fca5a5", borderRadius: 3, padding: "0 5px", fontWeight: 700 }}>
            {errorCount} error{errorCount !== 1 ? "s" : ""}
          </span>
        )}

        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          <button style={filterBtnStyle(filter === "all")} onClick={() => setFilter("all")}>All</button>
          <button style={filterBtnStyle(filter === "errors")} onClick={() => setFilter("errors")}>Errors</button>
          <button style={filterBtnStyle(filter === "tools")} onClick={() => setFilter("tools")}>Tools</button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#334155" }}>
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
          <button
            onClick={copyAll}
            style={{ ...filterBtnStyle(false), color: "#64748b", borderColor: "#1e293b", background: "transparent" }}
          >
            📋 Copy
          </button>
          <button
            onClick={clearLogs}
            style={{ ...filterBtnStyle(false), color: "#64748b", borderColor: "#1e293b", background: "transparent" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto" }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "12px 10px", fontSize: 11, color: "#1e293b", fontStyle: "italic" }}>
            No log entries yet. Run your graph to see activity here.
          </div>
        ) : (
          filtered.map((entry) => <LogRow key={entry.id} entry={entry} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
