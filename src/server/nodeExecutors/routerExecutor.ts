import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";

/**
 * Router node: routes input to one of several named output ports
 * based on pattern matching (contains, regex, jsonpath).
 */
export async function executeRouter(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const inputRef = step.inputs["input"];
  const upstream = inputRef ? ctx.nodeOutputs.get(inputRef.sourceNodeId) : null;
  const data = upstream?.[inputRef?.sourcePortId ?? ""] ?? "";
  const input = String(data);

  const mode = step.config.routingMode ?? "contains";
  let rules: { pattern: string; output: string }[] = [];
  try {
    rules = typeof step.config.rules === "string"
      ? JSON.parse(step.config.rules)
      : step.config.rules ?? [];
  } catch {
    rules = [];
  }

  // Initialize all outputs as null
  const outputs: Record<string, any> = {
    "route-1": null,
    "route-2": null,
    default: null,
  };

  // Find first matching rule
  let matched = false;
  for (const rule of rules) {
    let isMatch = false;

    if (mode === "contains") {
      isMatch = input.includes(rule.pattern);
    } else if (mode === "regex") {
      try {
        isMatch = new RegExp(rule.pattern, "i").test(input);
      } catch {
        isMatch = false;
      }
    } else if (mode === "jsonpath") {
      // Simple key check for MVP
      try {
        const obj = JSON.parse(input);
        isMatch = rule.pattern in obj;
      } catch {
        isMatch = false;
      }
    }

    if (isMatch) {
      outputs[rule.output] = data;
      matched = true;
      ctx.send({
        type: "stream_token",
        nodeId: step.nodeId,
        token: `Routed to: ${rule.output} (matched "${rule.pattern}")`,
      });
      break;
    }
  }

  if (!matched) {
    outputs["default"] = data;
    ctx.send({
      type: "stream_token",
      nodeId: step.nodeId,
      token: `Routed to: default (no rules matched)`,
    });
  }

  return outputs;
}
