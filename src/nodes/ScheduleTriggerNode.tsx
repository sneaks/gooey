import React, { useEffect, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { BaseNode } from "./BaseNode";
import { useGraphStore } from "../app/store";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

function formatUnit(value: number, unit: string): string {
  const label = unit === "seconds" ? "sec" : unit === "minutes" ? "min" : "hr";
  return `${value} ${label}`;
}

export function ScheduleTriggerNode(props: NodeProps) {
  const { data } = props;
  const scheduleActive = useGraphStore((s) => s.scheduleActive);
  const scheduleTick = useGraphStore((s) => s.scheduleTick);
  const scheduleNextRun = useGraphStore((s) => s.scheduleNextRun);

  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (!scheduleActive || !scheduleNextRun) {
      setCountdown("");
      return;
    }
    const update = () => {
      const ms = new Date(scheduleNextRun).getTime() - Date.now();
      setCountdown(formatCountdown(ms));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [scheduleActive, scheduleNextRun]);

  const intervalValue = (data.intervalValue as number) ?? 5;
  const intervalUnit = (data.intervalUnit as string) ?? "minutes";
  const runImmediately = data.runImmediately as boolean;

  return (
    <BaseNode {...props}>
      {/* Interval + tick count row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          Every{" "}
          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
            {formatUnit(intervalValue, intervalUnit)}
          </span>
          {runImmediately && (
            <span style={{ color: "#64748b", fontSize: 10, marginLeft: 5 }}>· immediate</span>
          )}
        </div>
        {/* Tick count — always visible */}
        <div style={{
          fontSize: 11,
          color: scheduleActive ? "#86efac" : "#475569",
          fontWeight: 600,
          marginLeft: 8,
          whiteSpace: "nowrap",
        }}>
          ↻ {scheduleTick}
        </div>
      </div>

      {/* Status badge */}
      {scheduleActive ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 8px",
          background: "#0c4a1e",
          border: "1px solid #166534",
          borderRadius: 6,
        }}>
          <span style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            animation: "blink 1s step-start infinite",
            flexShrink: 0,
          }} />
          <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 600 }}>Active</span>
          {countdown && (
            <span style={{ color: "#6ee7b7", fontSize: 10, marginLeft: "auto" }}>
              next {countdown}
            </span>
          )}
        </div>
      ) : (
        <div style={{
          padding: "5px 8px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 6,
          color: "#475569",
          fontSize: 11,
          textAlign: "center",
        }}>
          Inactive · click ⏰ Activate
        </div>
      )}
    </BaseNode>
  );
}
