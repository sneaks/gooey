import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";

/**
 * Subagent node: spawns one or more agent sessions for a delegated task.
 * Modes:
 *  - single: one agent, one task
 *  - parallel: splits task into subtasks, runs concurrently
 *  - chain: runs agents sequentially, piping output to next
 */
export async function executeSubagent(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const taskRef = step.inputs["task"];
  const task = taskRef
    ? ctx.nodeOutputs.get(taskRef.sourceNodeId)?.[taskRef.sourcePortId]
    : null;

  if (!task) {
    throw new Error("No task connected to Subagent node.");
  }

  const mode = step.config.mode ?? "single";
  const agentName = step.config.agentName || "subagent";

  // Subagent needs a model — look for a model in context or use a default
  // For now, find any LLM Provider output in the graph
  let modelConfig: any = null;
  for (const [, outputs] of ctx.nodeOutputs) {
    if (outputs.model?.apiKey) {
      modelConfig = outputs.model;
      break;
    }
  }

  if (!modelConfig?.apiKey) {
    throw new Error("No LLM Provider available for subagent. Connect an LLM Provider upstream.");
  }

  const client = new Anthropic({ apiKey: modelConfig.apiKey });

  if (mode === "single") {
    const result = await runSingleAgent(client, modelConfig, String(task), step, ctx);
    return { result, messages: [], usage: {} };
  }

  if (mode === "parallel") {
    // Split task by newlines as subtasks
    const subtasks = String(task).split("\n").filter((t) => t.trim());
    if (subtasks.length === 0) subtasks.push(String(task));

    ctx.send({
      type: "stream_token",
      nodeId: step.nodeId,
      token: `Running ${subtasks.length} subtasks in parallel...\n`,
    });

    const results = await Promise.all(
      subtasks.map((subtask, i) =>
        runSingleAgent(client, modelConfig, subtask, step, ctx, `[${i + 1}/${subtasks.length}] `)
      )
    );

    const combined = results.join("\n---\n");
    return { result: combined, messages: [], usage: {} };
  }

  if (mode === "chain") {
    // Chain: each step's output becomes the next step's input
    const steps = String(task).split("\n").filter((t) => t.trim());
    if (steps.length === 0) steps.push(String(task));

    let chainInput = "";
    for (let i = 0; i < steps.length; i++) {
      const stepTask = chainInput
        ? `Previous result:\n${chainInput}\n\nNext task: ${steps[i]}`
        : steps[i];

      ctx.send({
        type: "stream_token",
        nodeId: step.nodeId,
        token: `\n[Chain step ${i + 1}/${steps.length}]\n`,
      });

      chainInput = await runSingleAgent(client, modelConfig, stepTask, step, ctx);
    }

    return { result: chainInput, messages: [], usage: {} };
  }

  throw new Error(`Unknown subagent mode: ${mode}`);
}

async function runSingleAgent(
  client: Anthropic,
  modelConfig: any,
  task: string,
  step: ExecutionStep,
  ctx: ExecutionContext,
  prefix = "",
): Promise<string> {
  const stream = client.messages.stream({
    model: modelConfig.modelId ?? "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: task }],
  });

  let result = "";
  stream.on("text", (text) => {
    if (ctx.isAborted()) return;
    result += text;
    ctx.send({ type: "stream_token", nodeId: step.nodeId, token: prefix + text });
  });

  await stream.finalMessage();
  return result;
}
