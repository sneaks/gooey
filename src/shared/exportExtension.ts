import type { GraphJSON } from "./graphTypes";

/**
 * Exports a Gooey graph as a standalone pi extension TypeScript file.
 * The generated file can be used with `pi --extension ./my-graph.ts`.
 */
export function exportAsPiExtension(graph: GraphJSON, name: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "_");

  // Find key nodes
  const llmProvider = graph.nodes.find((n) => n.type === "llm-provider");
  const agent = graph.nodes.find((n) => n.type === "agent");
  const promptInput = graph.nodes.find((n) => n.type === "prompt-input");
  const tools = graph.nodes.filter((n) => n.type === "tool");
  const toolSets = graph.nodes.filter((n) => n.type === "tool-set");
  const gates = graph.nodes.filter((n) => n.type === "gate");

  // Collect tool types
  const toolTypes: string[] = [];
  for (const t of tools) {
    toolTypes.push(t.data.toolType ?? "read");
  }
  for (const ts of toolSets) {
    const preset = ts.data.preset ?? "coding";
    const presets: Record<string, string[]> = {
      coding: ["read", "bash", "edit", "write"],
      readonly: ["read", "grep", "find", "ls"],
      all: ["read", "bash", "edit", "write", "grep", "find", "ls"],
    };
    toolTypes.push(...(presets[preset] ?? presets.coding));
  }

  const model = llmProvider?.data?.modelId ?? "claude-sonnet-4-20250514";
  const provider = llmProvider?.data?.provider ?? "anthropic";
  const maxTurns = agent?.data?.maxTurns ?? 10;
  const prompt = promptInput?.data?.prompt ?? "";
  const gatePatterns = gates.map((g) => g.data.patterns ?? "").filter(Boolean);

  return `/**
 * Gooey Graph Export: ${name}
 * Generated from Gooey visual pipeline builder
 * 
 * Usage: pi --extension ./${safeName}.ts
 * 
 * Graph nodes: ${graph.nodes.length}
 * Graph edges: ${graph.edges.length}
 */

import type { PiExtension } from "@anthropic-ai/claude-code";

const extension: PiExtension = {
  name: "${safeName}",
  version: "1.0.0",
  description: "Generated from Gooey graph: ${name}",

  async init(pi) {
    // Model configuration
    const model = "${model}";
    const provider = "${provider}";
    const maxTurns = ${maxTurns};

    // Tools: ${toolTypes.join(", ") || "none"}
    const enabledTools = ${JSON.stringify([...new Set(toolTypes)])};

${gatePatterns.length > 0 ? `    // Gate patterns
    const gatePatterns = ${JSON.stringify(gatePatterns)};

    pi.on("tool_call", async (event) => {
      for (const pattern of gatePatterns) {
        for (const line of pattern.split("\\n")) {
          if (line && new RegExp(line).test(JSON.stringify(event.input))) {
            const approved = await pi.confirm(\`Allow: \${event.tool}?\`);
            if (!approved) return { block: true, reason: "Blocked by gate" };
          }
        }
      }
    });
` : ""}
${prompt ? `    // Default prompt
    // "${prompt.replace(/"/g, '\\"').slice(0, 100)}"
` : ""}
    console.log(\`[${safeName}] Extension loaded. Model: \${model}, Tools: \${enabledTools.join(", ")}\`);
  },
};

export default extension;
`;
}
