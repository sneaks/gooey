import type { WireType } from "./wireTypes";

export interface PortDefinition {
  id: string;
  label: string;
  type: WireType;
  multiple?: boolean;
  required?: boolean;
}

export type ConfigFieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "code"
  | "json"
  | "model-picker"
  | "textarea";

export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  default?: any;
  options?: { label: string; value: any }[];
  description?: string;
}

export type NodeCategory = "core" | "io" | "safety" | "integration" | "utility";

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  icon: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  config: ConfigField[];
}

export interface GraphJSON {
  version: 1;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

export interface SerializedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface SerializedEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}
