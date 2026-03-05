import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function executeMCP(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const transport   = (step.config.transport as string) ?? "stdio";
  const command     = (step.config.command   as string) ?? "";
  const url         = (step.config.url       as string) ?? "";
  const mode        = (step.config.mode      as string) ?? "call";
  const configTool  = (step.config.toolName  as string) ?? "";
  const configArgs  = (step.config.argsJson  as string) ?? "{}";
  const configEnv   = (step.config.envJson   as string) ?? "{}";

  // Dynamic overrides from input ports
  const toolInput = step.inputs["toolName"];
  const toolName = toolInput
    ? String(ctx.nodeOutputs.get(toolInput.sourceNodeId)?.[toolInput.sourcePortId] ?? configTool)
    : configTool;

  const argsInput = step.inputs["input"];
  let toolArgs: Record<string, any> = {};
  if (argsInput) {
    const raw = ctx.nodeOutputs.get(argsInput.sourceNodeId)?.[argsInput.sourcePortId];
    toolArgs = typeof raw === "object" && raw !== null ? raw : {};
  } else {
    try { toolArgs = JSON.parse(configArgs || "{}"); } catch { toolArgs = {}; }
  }

  // --- Build transport ---
  let clientTransport: StdioClientTransport | SSEClientTransport;

  if (transport === "stdio") {
    if (!command.trim()) {
      throw new Error("MCP stdio: command is required");
    }
    const parts = command.trim().split(/\s+/);
    let envVars: Record<string, string> = {};
    try { envVars = JSON.parse(configEnv || "{}"); } catch { envVars = {}; }
    clientTransport = new StdioClientTransport({
      command: parts[0],
      args: parts.slice(1),
      env: Object.keys(envVars).length > 0 ? { ...process.env as Record<string, string>, ...envVars } : undefined,
    });
  } else {
    if (!url.trim()) {
      throw new Error("MCP http: url is required");
    }
    clientTransport = new SSEClientTransport(new URL(url.trim()));
  }

  const client = new Client({ name: "gooey", version: "1.0.0" });

  try {
    await client.connect(clientTransport);

    if (mode === "list") {
      // --- List all available tools ---
      ctx.send({ type: "stream_token", nodeId: step.nodeId, token: "🔌 Listing MCP tools...\n" });
      const { tools } = await client.listTools();
      ctx.send({
        type: "stream_token",
        nodeId: step.nodeId,
        token: tools.map((t) => `  · ${t.name} — ${t.description ?? ""}`).join("\n"),
      });
      return { result: tools, tools, trigger: true };
    }

    // --- Call a specific tool ---
    if (!toolName.trim()) {
      throw new Error("MCP call: toolName is required");
    }

    ctx.send({
      type: "stream_token",
      nodeId: step.nodeId,
      token: `🔌 Calling ${toolName}...\n`,
    });

    const response = await client.callTool({ name: toolName, arguments: toolArgs });

    // Extract text content from MCP response
    const content: any[] = Array.isArray(response.content) ? response.content : [];
    const text = content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
    const result = text || response;

    ctx.send({
      type: "stream_token",
      nodeId: step.nodeId,
      token: typeof result === "string" ? result : JSON.stringify(result, null, 2),
    });

    return { result, trigger: true };

  } finally {
    await client.close().catch(() => {});
  }
}
