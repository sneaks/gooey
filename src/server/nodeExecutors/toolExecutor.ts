import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";

/**
 * Tool node: produces a tool descriptor.
 * The Agent executor collects these and passes them to the session.
 * Phase 1: built-in tool names are passed through; the agent executor
 * maps them to real tool implementations.
 */
export async function executeTool(
  step: ExecutionStep,
  _ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const { toolType, cwd } = step.config;

  return {
    tool: {
      type: toolType ?? "read",
      cwd: cwd ?? ".",
    },
  };
}
