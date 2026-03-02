import type { ExecutionStep } from "../../shared/execution/types";
import type { ServerMessage } from "../../shared/protocol";
import { executeLLMProvider } from "./llmProviderExecutor";
import { executeTool } from "./toolExecutor";
import { executeAgent } from "./agentExecutor";
import { executeSubagent } from "./subagentExecutor";
import { executeRouter } from "./routerExecutor";

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
      return executeRouter(step, ctx);

    case "subagent":
      return executeSubagent(step, ctx);

    case "tool-set": {
      // Tool Set node: produces an array of tool descriptors based on preset
      const preset = step.config.preset ?? "coding";
      const presetTools: Record<string, string[]> = {
        coding: ["read", "bash", "edit", "write"],
        readonly: ["read", "grep", "find", "ls"],
        all: ["read", "bash", "edit", "write", "grep", "find", "ls"],
        custom: (step.config.customTools ?? "").split(",").map((t: string) => t.trim()).filter(Boolean),
      };
      const tools = (presetTools[preset] ?? presetTools.coding).map((t) => ({
        type: t,
        cwd: ".",
      }));
      return { tools };
    }

    case "memory": {
      // Memory node: passes through or filters messages based on strategy
      const msgsRef = step.inputs["messages"];
      const upstream = msgsRef ? ctx.nodeOutputs.get(msgsRef.sourceNodeId) : null;
      const messages = upstream?.[msgsRef?.sourcePortId ?? ""] ?? [];
      const strategy = step.config.strategy ?? "full-history";
      const maxMessages = step.config.maxMessages ?? 100;

      let context = Array.isArray(messages) ? messages : [];
      if (strategy === "sliding-window") {
        const windowSize = step.config.windowSize ?? 20;
        context = context.slice(-windowSize);
      } else if (strategy === "full-history") {
        context = context.slice(-maxMessages);
      }
      // summary strategy would need an LLM call — stub for now
      return { context };
    }

    case "protected-path":
      // Protected Path: returns constraint config for agent middleware
      return {
        constraint: {
          paths: (step.config.paths ?? "").split("\n").filter((p: string) => p.trim()),
          mode: step.config.mode ?? "block-writes",
        },
      };


    default:
      console.warn(`[gooey-server] Unknown node type: ${step.type}`);
      return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
