import React, { useEffect, useRef, useState } from "react";
import { useGraphStore } from "../app/store";

interface FileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "load" | "save";
}

export function FileBrowser({ isOpen, onClose, mode }: FileBrowserProps) {
  const [graphs, setGraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const listServerGraphs = useGraphStore((s) => s.listServerGraphs);
  const saveToServer = useGraphStore((s) => s.saveToServer);
  const loadFromServer = useGraphStore((s) => s.loadFromServer);
  const deleteFromServer = useGraphStore((s) => s.deleteFromServer);
  const loadGraph = useGraphStore((s) => s.loadGraph);

  // Fetch graphs when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSaveName("");
      setSelected(null);
      listServerGraphs().then((g) => {
        setGraphs(g);
        setLoading(false);
        // Auto-focus input in save mode
        if (mode === "save") {
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      });
    }
  }, [isOpen, listServerGraphs, mode]);

  const handleLoad = async (name: string) => {
    const loaded = await loadFromServer(name);
    if (loaded) onClose();
    else alert("Failed to load graph");
  };

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) return;
    const finalName = name.endsWith(".goo") ? name.slice(0, -4) : name;
    await saveToServer(finalName);
    onClose();
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteFromServer(name);
    setGraphs((prev) => prev.filter((g) => g !== name));
    if (selected === name) { setSelected(null); setSaveName(""); }
  };

  const handleRowClick = (name: string) => {
    if (mode === "load") {
      handleLoad(name);
    } else {
      // Save mode: populate the input and highlight the row
      setSelected(name);
      setSaveName(name);
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  const btnBase: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid #334155",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 440,
          maxHeight: "80vh",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #334155",
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
            {mode === "save" ? "💾 Save Graph" : "📁 Load Graph"}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Save input — always visible in save mode */}
        {mode === "save" && (
          <div style={{
            display: "flex",
            gap: 8,
            padding: "10px 16px",
            borderBottom: "1px solid #334155",
            background: "#1e293b",
          }}>
            <input
              ref={inputRef}
              type="text"
              value={saveName}
              onChange={(e) => { setSaveName(e.target.value); setSelected(null); }}
              placeholder="filename.goo"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
              style={{
                flex: 1,
                padding: "6px 10px",
                background: "#0f172a",
                border: "1px solid #475569",
                borderRadius: 4,
                color: "#e2e8f0",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              style={{
                ...btnBase,
                background: saveName.trim() ? "#166534" : "#1e293b",
                borderColor: saveName.trim() ? "#16a34a" : "#334155",
                color: saveName.trim() ? "#4ade80" : "#475569",
              }}
            >
              Save
            </button>
          </div>
        )}

        {/* New graph button — load mode only */}
        {mode === "load" && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #334155" }}>
            <button
              onClick={() => { loadGraph({ version: 1, nodes: [], edges: [] }); onClose(); }}
              style={{ ...btnBase, background: "#1e293b", color: "#94a3b8" }}
            >
              + New Graph
            </button>
          </div>
        )}

        {/* File list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>Loading...</div>
          ) : graphs.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>No saved graphs</div>
          ) : (
            graphs.map((name) => {
              const isSelected = selected === name;
              return (
                <div
                  key={name}
                  onClick={() => handleRowClick(name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 16px",
                    cursor: "pointer",
                    background: isSelected ? "#1e3a5f" : "transparent",
                    borderLeft: isSelected ? "2px solid #3b82f6" : "2px solid transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#1e293b";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>📄</span>
                    <span style={{
                      color: isSelected ? "#93c5fd" : "#e2e8f0",
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {name}.goo
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(name, e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 13,
                      padding: "2px 6px",
                      opacity: 0.5,
                      transition: "opacity 0.15s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid #1e293b",
          fontSize: 10,
          color: "#334155",
        }}>
          {mode === "save"
            ? "Click a file to overwrite it, or type a new name · Enter to save"
            : "Click a file to load it"}
        </div>
      </div>
    </div>
  );
}
