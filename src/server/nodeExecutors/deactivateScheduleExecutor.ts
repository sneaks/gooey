import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";
import { scheduleManager } from "../scheduleManager";

export async function executeDeactivateSchedule(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  if (scheduleManager.isRunning) {
    ctx.send({
      type: "stream_token",
      nodeId: step.nodeId,
      token: "⏹ Deactivating schedule...",
    });
    scheduleManager.stop(); // sends schedule_stopped to client
  } else {
    ctx.send({
      type: "stream_token",
      nodeId: step.nodeId,
      token: "⏹ Schedule already stopped",
    });
  }
  return { done: true };
}
