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
import { FileTriggerNode } from "./FileTriggerNode";
import { WebhookTriggerNode } from "./WebhookTriggerNode";
import { TransformNode } from "./TransformNode";
import { MergeNode } from "./MergeNode";
import { SplitNode } from "./SplitNode";
import { SlackNode } from "./SlackNode";
import { HandoffNode } from "./HandoffNode";
import { RemoteExecNode } from "./RemoteExecNode";
import { CustomNode } from "./CustomNode";
import { VariableNode } from "./VariableNode";
import { HttpRequestNode } from "./HttpRequestNode";
import { GmailNode } from "./GmailNode";
import { ScheduleTriggerNode } from "./ScheduleTriggerNode";
import { DeactivateScheduleNode } from "./DeactivateScheduleNode";

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
  "file-trigger": FileTriggerNode,
  "webhook-trigger": WebhookTriggerNode,
  transform: TransformNode,
  merge: MergeNode,
  split: SplitNode,
  slack: SlackNode,
  handoff: HandoffNode,
  "remote-exec": RemoteExecNode,
  custom: CustomNode,
  variable: VariableNode,
  "http-request": HttpRequestNode,
  gmail: GmailNode,
  "schedule-trigger": ScheduleTriggerNode,
  "deactivate-schedule": DeactivateScheduleNode,
};
