import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";

/**
 * Agent node executor.
 * Phase 1: Uses Anthropic SDK directly for streaming.
 * Collects model config + tools + prompts from upstream nodes, runs a multi-turn agent loop.
 */
export async function executeAgent(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  // Resolve inputs from upstream
  const modelRef = step.inputs["model"];
  const userMsgRef = step.inputs["userMessage"];
  const sysMsgRef = step.inputs["systemPrompt"];

  // Get model config
  const modelConfig = modelRef
    ? ctx.nodeOutputs.get(modelRef.sourceNodeId)?.[modelRef.sourcePortId]
    : null;

  if (!modelConfig?.apiKey) {
    throw new Error("No API key available. Set the env var in your .env file.");
  }

  // Get user message
  const userMessage = userMsgRef
    ? ctx.nodeOutputs.get(userMsgRef.sourceNodeId)?.[userMsgRef.sourcePortId]
    : null;

  if (!userMessage) {
    throw new Error("No user message connected to Agent node.");
  }

  // Get optional system prompt
  const systemPrompt = sysMsgRef
    ? ctx.nodeOutputs.get(sysMsgRef.sourceNodeId)?.[sysMsgRef.sourcePortId]
    : undefined;

  // Collect tools from all connected tool nodes
  const toolDescriptors: { type: string; cwd: string }[] = [];
  for (const [portId, ref] of Object.entries(step.inputs)) {
    if (portId === "tools") {
      const toolConfig = ctx.nodeOutputs.get(ref.sourceNodeId)?.[ref.sourcePortId];
      if (toolConfig) toolDescriptors.push(toolConfig);
    }
  }

  // Build Anthropic tool definitions
  const anthropicTools = buildAnthropicTools(toolDescriptors);

  // Create client
  const client = new Anthropic({ apiKey: modelConfig.apiKey });

  // Build messages
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: String(userMessage) },
  ];

  const maxTurns = step.config.maxTurns ?? 10;
  let fullResponse = "";

  // Agent loop: call LLM, handle tool use, repeat
  console.log(`[agent] Starting agent loop, maxTurns=${maxTurns}, tools=${toolDescriptors.length}`);
  for (let turn = 0; turn < maxTurns; turn++) {
    console.log(`[agent] Turn ${turn + 1}/${maxTurns}, messages=${messages.length}`);
    if (ctx.isAborted()) break;

    const streamParams: Anthropic.MessageCreateParams = {
      model: modelConfig.modelId ?? "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages,
      ...(systemPrompt ? { system: String(systemPrompt) } : {}),
      ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
    };

    // Add thinking if configured
    if (modelConfig.thinkingLevel && modelConfig.thinkingLevel !== "off") {
      const budgets: Record<string, number> = { low: 4096, medium: 10000, high: 32000 };
      (streamParams as any).thinking = {
        type: "enabled",
        budget_tokens: budgets[modelConfig.thinkingLevel] ?? 10000,
      };
      // Thinking requires at least the budget + max_tokens
    }

    // Retry with backoff for rate limits
    let finalMessage: Anthropic.Message;
    let turnText = "";
    const toolUses: { id: string; name: string; input: any }[] = [];

    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const stream = client.messages.stream(streamParams);

        stream.on("text", (text) => {
          if (ctx.isAborted()) return;
          turnText += text;
          fullResponse += text;
          ctx.send({ type: "stream_token", nodeId: step.nodeId, token: text });
        });

        finalMessage = await stream.finalMessage();
        break; // success
      } catch (err: any) {
        if (err?.status === 429 && attempt < MAX_RETRIES) {
          // Rate limited — parse retry-after or use exponential backoff
          const retryAfter = err?.headers?.["retry-after"];
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : (2 ** attempt) * 5000;
          ctx.send({
            type: "stream_token",
            nodeId: step.nodeId,
            token: `\n[Rate limited — retrying in ${Math.round(waitMs / 1000)}s...]\n`,
          });
          await new Promise((r) => setTimeout(r, waitMs));
          turnText = "";
          continue;
        }
        throw err;
      }
    }

    finalMessage ??= { content: [], stop_reason: "end_turn" } as any;

    // Check for tool use
    for (const block of finalMessage.content) {
      if (block.type === "tool_use") {
        toolUses.push({ id: block.id, name: block.name, input: block.input as any });
      }
    }

    if (toolUses.length === 0 || finalMessage.stop_reason === "end_turn") {
      console.log(`[agent] Turn ${turn + 1} done: stop_reason=${finalMessage.stop_reason}, toolUses=${toolUses.length}`);
      break;
    }
    console.log(`[agent] Turn ${turn + 1}: ${toolUses.length} tool calls, continuing...`);

    // Process tool calls
    messages.push({ role: "assistant", content: finalMessage.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      if (ctx.isAborted()) break;

      ctx.send({
        type: "tool_call",
        nodeId: step.nodeId,
        tool: toolUse.name,
        input: toolUse.input,
      });

      const result = await executeToolCall(toolUse.name, toolUse.input, toolDescriptors);

      ctx.send({
        type: "tool_result",
        nodeId: step.nodeId,
        tool: toolUse.name,
        output: result.output,
        isError: result.isError,
      });

      // Truncate large tool results to prevent token explosion
      let resultContent = typeof result.output === "string" ? result.output : JSON.stringify(result.output);
      const MAX_TOOL_RESULT_CHARS = 10000;
      if (resultContent.length > MAX_TOOL_RESULT_CHARS) {
        resultContent = resultContent.slice(0, MAX_TOOL_RESULT_CHARS) + `\n...[truncated, ${resultContent.length} chars total]`;
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: resultContent,
        is_error: result.isError,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    response: fullResponse,
    messages: messages,
    done: true,
  };
}

/**
 * Builds Anthropic-compatible tool definitions from our tool descriptors.
 */
function buildAnthropicTools(
  descriptors: { type: string; cwd: string }[]
): Anthropic.Tool[] {
  const toolDefs: Record<string, Anthropic.Tool> = {
    read: {
      name: "read",
      description: "Read the contents of a file at the given path.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path to read" },
        },
        required: ["path"],
      },
    },
    bash: {
      name: "bash",
      description: "Execute a bash command and return stdout/stderr.",
      input_schema: {
        type: "object" as const,
        properties: {
          command: { type: "string", description: "Bash command to execute" },
        },
        required: ["command"],
      },
    },
    edit: {
      name: "edit",
      description: "Edit a file by finding and replacing exact text.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path" },
          oldText: { type: "string", description: "Exact text to find" },
          newText: { type: "string", description: "Text to replace with" },
        },
        required: ["path", "oldText", "newText"],
      },
    },
    write: {
      name: "write",
      description: "Write content to a file, creating it if it doesn't exist.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path" },
          content: { type: "string", description: "Content to write" },
        },
        required: ["path", "content"],
      },
    },
    grep: {
      name: "grep",
      description: "Search for a pattern in files using grep.",
      input_schema: {
        type: "object" as const,
        properties: {
          pattern: { type: "string", description: "Pattern to search for" },
          path: { type: "string", description: "Directory or file to search" },
        },
        required: ["pattern"],
      },
    },
    find: {
      name: "find",
      description: "Find files matching a pattern.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "Directory to search" },
          pattern: { type: "string", description: "Name pattern (glob)" },
        },
        required: ["path"],
      },
    },
    ls: {
      name: "ls",
      description: "List files in a directory.",
      input_schema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "Directory to list" },
        },
        required: ["path"],
      },
    },
  };

  return descriptors
    .map((d) => toolDefs[d.type])
    .filter(Boolean);
}

/**
 * Actually execute a tool call server-side.
 */
async function executeToolCall(
  toolName: string,
  input: any,
  descriptors: { type: string; cwd: string }[],
): Promise<{ output: string; isError: boolean }> {
  const descriptor = descriptors.find((d) => d.type === toolName);
  const cwd = descriptor?.cwd ?? ".";

  try {
    switch (toolName) {
      case "read": {
        const fs = await import("fs/promises");
        const path = await import("path");
        const fullPath = path.resolve(cwd, input.path);
        const content = await fs.readFile(fullPath, "utf-8");
        return { output: content, isError: false };
      }

      case "bash": {
        const { execSync } = await import("child_process");
        const result = execSync(input.command, {
          cwd,
          encoding: "utf-8",
          timeout: 30000,
          maxBuffer: 1024 * 1024,
        });
        return { output: result, isError: false };
      }

      case "edit": {
        const fs = await import("fs/promises");
        const path = await import("path");
        const fullPath = path.resolve(cwd, input.path);
        let content = await fs.readFile(fullPath, "utf-8");
        if (!content.includes(input.oldText)) {
          return { output: `Text not found in ${input.path}`, isError: true };
        }
        content = content.replace(input.oldText, input.newText);
        await fs.writeFile(fullPath, content, "utf-8");
        return { output: `Edited ${input.path}`, isError: false };
      }

      case "write": {
        const fs = await import("fs/promises");
        const path = await import("path");
        const fullPath = path.resolve(cwd, input.path);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, input.content, "utf-8");
        return { output: `Wrote ${input.path}`, isError: false };
      }

      case "grep": {
        const { execSync } = await import("child_process");
        const grepPath = input.path ?? ".";
        const result = execSync(`grep -rn "${input.pattern}" ${grepPath}`, {
          cwd,
          encoding: "utf-8",
          timeout: 10000,
          maxBuffer: 1024 * 1024,
        });
        return { output: result, isError: false };
      }

      case "find": {
        const { execSync } = await import("child_process");
        const findPath = input.path ?? ".";
        const pattern = input.pattern ? `-name "${input.pattern}"` : "";
        const result = execSync(`find ${findPath} ${pattern} -maxdepth 5`, {
          cwd,
          encoding: "utf-8",
          timeout: 10000,
        });
        return { output: result, isError: false };
      }

      case "ls": {
        const { execSync } = await import("child_process");
        const lsPath = input.path ?? ".";
        const result = execSync(`ls -la ${lsPath}`, {
          cwd,
          encoding: "utf-8",
        });
        return { output: result, isError: false };
      }

      default:
        return { output: `Unknown tool: ${toolName}`, isError: true };
    }
  } catch (err: any) {
    return { output: err.message ?? String(err), isError: true };
  }
}
