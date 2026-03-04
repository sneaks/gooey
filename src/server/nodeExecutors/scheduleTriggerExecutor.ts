import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";
import { scheduleManager } from "../scheduleManager";

/**
 * Schedule Trigger node executor.
 *
 * The actual scheduling is managed by ScheduleManager on the server —
 * this executor just reads the current tick state and passes it downstream
 * so other nodes can act on timing info (e.g. log the run count, filter
 * by time of day, etc.)
 */
export async function executeScheduleTrigger(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const state = scheduleManager.getState();
  const now = new Date();

  ctx.send({
    type: "stream_token",
    nodeId: step.nodeId,
    token: `⏰ Tick #${state.tickCount} at ${now.toLocaleTimeString()}\n`,
  });

  return {
    trigger: true,
    tickCount: state.tickCount,
    timestamp: now.toISOString(),
    nextRun: state.nextRun ?? "",
  };
}
