export interface ExecutionPlan {
  steps: ExecutionStep[];
  parallelGroups: string[][];
}

export interface ExecutionStep {
  nodeId: string;
  type: string;
  inputs: Record<string, { sourceNodeId: string; sourcePortId: string }>;
  config: Record<string, any>;
}
