import { PromptInputNode } from "./PromptInputNode";
import { LLMProviderNode } from "./LLMProviderNode";
import { AgentNode } from "./AgentNode";
import { ToolNode } from "./ToolNode";
import { OutputNode } from "./OutputNode";
import { GateNode } from "./GateNode";
import { RouterNode } from "./RouterNode";
import { SubagentNode } from "./SubagentNode";
import { PromptTemplateNode } from "./PromptTemplateNode";
import { ProtectedPathNode } from "./ProtectedPathNode";
import { ToolSetNode } from "./ToolSetNode";
import { MemoryNode } from "./MemoryNode";

export const nodeTypes = {
  "prompt-input": PromptInputNode,
  "llm-provider": LLMProviderNode,
  agent: AgentNode,
  tool: ToolNode,
  output: OutputNode,
  gate: GateNode,
  router: RouterNode,
  subagent: SubagentNode,
  "prompt-template": PromptTemplateNode,
  "protected-path": ProtectedPathNode,
  "tool-set": ToolSetNode,
  memory: MemoryNode,
};
