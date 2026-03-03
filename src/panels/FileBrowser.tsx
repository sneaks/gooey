import React, { useEffect, useState } from "react";
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
  const [showSaveInput, setShowSaveInput] = useState(false);

  const listServerGraphs = useGraphStore((s) => s.listServerGraphs);
  const saveToServer = useGraphStore((s) => s.saveToServer);
  const loadFromServer = useGraphStore((s) => s.loadFromServer);
  const deleteFromServer = useGraphStore((s) => s.deleteFromServer);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const saveGraph = useGraphStore((s) => s.saveGraph);

  // Fetch graphs when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listServerGraphs().then((g) => {
        setGraphs(g);
        setLoading(false);
      });
    }
  }, [isOpen, listServerGraphs]);

  const handleLoad = async (name: string) => {
    const loaded = await loadFromServer(name);
    if (loaded) {
      onClose();
    } else {
      alert("Failed to load graph");
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    await saveToServer(saveName.trim());
    setSaveName("");
    setShowSaveInput(false);
    // Refresh list
    const g = await listServerGraphs();
    setGraphs(g);
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteFromServer(name);
    setGraphs((prev) => prev.filter((g) => g !== name));
  };

  const handleNew = () => {
    // Clear canvas by loading empty graph
    loadGraph({ version: 1, nodes: [], edges: [] });
    onClose();
  };

  if (!isOpen) return null;

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
          width: 420,
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #334155",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
            📁 Graphs
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 16px",
            borderBottom: "1px solid #334155",
          }}
        >
          <button
            onClick={handleNew}
            style={{
              padding: "6px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 4,
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New
          </button>
          <button
            onClick={() => setShowSaveInput(true)}
            style={{
              padding: "6px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 4,
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save As...
          </button>
        </div>

        {/* Save input */}
        {showSaveInput && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 16px",
              borderBottom: "1px solid #334155",
              background: "#1e293b",
            }}
          >
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="graph-name.goo"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setShowSaveInput(false);
              }}
              style={{
                flex: 1,
                padding: "6px 10px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 4,
                color: "#e2e8f0",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              onClick={handleSave}
              style={{
                padding: "6px 12px",
                background: "#166534",
                border: "1px solid #16a34a",
                borderRadius: 4,
                color: "#4ade80",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveInput(false)}
              style={{
                padding: "6px 12px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 4,
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* File list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
              Loading...
            </div>
          ) : graphs.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
              No saved graphs
            </div>
          ) : (
            graphs.map((name) => (
              <div
                key={name}
                onClick={() => mode === "load" && handleLoad(name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  cursor: mode === "load" ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (mode === "load") {
                    e.currentTarget.style.background = "#1e293b";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📄</span>
                  <span style={{ color: "#e2e8f0", fontSize: 12 }}>{name}.goo</span>
                </div>
                <button
                  onClick={(e) => handleDelete(name, e)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 4,
                    opacity: 0.7,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
