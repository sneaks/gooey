import type { GraphJSON } from "../shared/graphTypes";
import type { ServerMessage } from "../shared/protocol";
import { GraphRunner } from "./graphRunner";

type SendMessage = (msg: ServerMessage) => void;

interface ScheduleState {
  isRunning: boolean;
  tickCount: number;
  nextRun: string | null;
  intervalMs: number;
}

/**
 * Server-side singleton that manages scheduled graph execution.
 * Lives outside the GraphRunner lifecycle so schedules persist
 * between individual runs and across client reconnects.
 */
class ScheduleManager {
  private graph: GraphJSON | null = null;
  private intervalMs = 0;
  private tickCount = 0;
  private nextRun: string | null = null;
  private timer: NodeJS.Timeout | null = null;
  private send: SendMessage | null = null;

  get isRunning() {
    return this.timer !== null;
  }

  register(
    graph: GraphJSON,
    intervalMs: number,
    send: SendMessage,
    runImmediately = true,
  ) {
    // Stop any existing schedule first
    this.stopTimer();

    this.graph = graph;
    this.intervalMs = intervalMs;
    this.send = send;
    this.tickCount = 0;
    this.nextRun = new Date(Date.now() + intervalMs).toISOString();

    console.log(`[schedule] Registered — every ${intervalMs}ms, runImmediately=${runImmediately}`);

    if (runImmediately) {
      this.fire();
    }

    this.timer = setInterval(() => this.fire(), intervalMs);
  }

  stop() {
    const wasRunning = this.isRunning;
    this.stopTimer();
    this.tickCount = 0;
    this.nextRun = null;

    if (wasRunning && this.send) {
      this.send({ type: "schedule_stopped" });
    }

    console.log("[schedule] Stopped");
  }

  getState(): ScheduleState {
    return {
      isRunning: this.isRunning,
      tickCount: this.tickCount,
      nextRun: this.nextRun,
      intervalMs: this.intervalMs,
    };
  }

  /** Update the send function when the WebSocket client reconnects */
  updateSend(send: SendMessage) {
    this.send = send;
  }

  private stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private fire() {
    if (!this.graph || !this.send) return;

    this.tickCount++;
    this.nextRun = new Date(Date.now() + this.intervalMs).toISOString();

    console.log(`[schedule] Tick #${this.tickCount}`);

    const send = this.send;
    const runner = new GraphRunner(this.graph, send);

    // Fire-and-forget — don't block the interval
    runner.run().catch((err: any) => {
      console.error("[schedule] Run error:", err.message ?? String(err));
      send({ type: "error", nodeId: "", message: `Schedule run failed: ${err.message ?? String(err)}` });
    }).finally(() => {
      // Only send tick update if the schedule wasn't stopped mid-run
      // (e.g. by a deactivate-schedule node)
      if (this.isRunning) {
        send({
          type: "schedule_tick",
          tickCount: this.tickCount,
          nextRun: this.nextRun!,
        });
      }
    });
  }
}

// Singleton — one scheduler per server process
export const scheduleManager = new ScheduleManager();

/** Parse the schedule-trigger node config out of a graph JSON */
export function extractScheduleConfig(graph: GraphJSON): {
  intervalValue: number;
  intervalUnit: "seconds" | "minutes" | "hours";
  runImmediately: boolean;
} {
  const node = graph.nodes.find((n) => n.type === "schedule-trigger");
  const data = (node?.data ?? {}) as Record<string, any>;
  return {
    intervalValue: Number(data.intervalValue ?? 5),
    intervalUnit: (data.intervalUnit ?? "minutes") as "seconds" | "minutes" | "hours",
    runImmediately: data.runImmediately !== false,
  };
}

export function toIntervalMs(value: number, unit: "seconds" | "minutes" | "hours"): number {
  const multipliers = { seconds: 1000, minutes: 60_000, hours: 3_600_000 };
  return value * (multipliers[unit] ?? 60_000);
}
