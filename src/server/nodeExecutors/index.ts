import type { ExecutionStep } from "../../shared/execution/types";
import type { ServerMessage } from "../../shared/protocol";
import { executeLLMProvider } from "./llmProviderExecutor";
import { executeTool } from "./toolExecutor";
import { executeAgent } from "./agentExecutor";

export interface ExecutionContext {
  send: (msg: ServerMessage) => void;
  nodeOutputs: Map<string, Record<string, any>>;
  waitForGate: (commandId: string) => Promise<boolean>;
  isAborted: () => boolean;
}

/**
 * Dispatches execution to the appropriate node executor.
 * Returns a map of portId → output value.
 */
export async function executeNode(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any> | null> {
  switch (step.type) {
    case "llm-provider":
      return executeLLMProvider(step, ctx);

    case "tool":
      return executeTool(step, ctx);

    case "agent":
      return executeAgent(step, ctx);

    case "prompt-input":
      return { prompt: step.config.prompt ?? "" };

    case "prompt-template":
      return { content: step.config.content ?? "" };

    case "output": {
      // Output node: collect streamed text from its input source
      const inputRef = step.inputs["input"];
      if (inputRef) {
        const upstream = ctx.nodeOutputs.get(inputRef.sourceNodeId);
        const text = upstream?.[inputRef.sourcePortId] ?? "";
        if (text) {
          // Stream it token-by-token for the UI
          const chars = String(text).split("");
          for (const char of chars) {
            if (ctx.isAborted()) break;
            ctx.send({ type: "stream_token", nodeId: step.nodeId, token: char });
            await sleep(10);
          }
        }
      }
      return null;
    }

    case "gate": {
      const inputRef = step.inputs["input"];
      const upstream = inputRef ? ctx.nodeOutputs.get(inputRef.sourceNodeId) : null;
      const data = upstream?.[inputRef?.sourcePortId ?? ""] ?? null;

      const mode = step.config.mode ?? "confirm";
      if (mode === "auto-approve") {
        return { approved: data, rejected: null };
      }
      if (mode === "block") {
        return { approved: null, rejected: data };
      }

      // Confirm mode: ask the client
      const commandId = `gate-${step.nodeId}-${Date.now()}`;
      ctx.send({
        type: "gate_request",
        nodeId: step.nodeId,
        message: step.config.message ?? "Allow this operation?",
        commandId,
      });
      const approved = await ctx.waitForGate(commandId);
      return approved ? { approved: data, rejected: null } : { approved: null, rejected: data };
    }

    case "router":
    case "subagent":
      // Stub — will be implemented in v0.2
      return null;

    default:
      console.warn(`[gooey-server] Unknown node type: ${step.type}`);
      return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
