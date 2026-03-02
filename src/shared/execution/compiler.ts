import type { GraphJSON } from "../graphTypes";
import type { ExecutionPlan, ExecutionStep } from "./types";

/**
 * Compiles a GraphJSON into a topologically-sorted ExecutionPlan.
 * Nodes with no unsatisfied dependencies can run in parallel.
 */
export function compileGraph(graph: GraphJSON): ExecutionPlan {
  // Build adjacency: target nodeId → set of source nodeIds
  const inbound = new Map<string, Set<string>>();
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const n of graph.nodes) {
    if (!inbound.has(n.id)) inbound.set(n.id, new Set());
  }

  for (const e of graph.edges) {
    inbound.get(e.target)!.add(e.source);
  }

  // Build input map per node (portId → source)
  const inputsByNode = new Map<string, Record<string, { sourceNodeId: string; sourcePortId: string }>>();
  for (const n of graph.nodes) {
    inputsByNode.set(n.id, {});
  }
  for (const e of graph.edges) {
    const inputs = inputsByNode.get(e.target)!;
    inputs[e.targetHandle] = { sourceNodeId: e.source, sourcePortId: e.sourceHandle };
  }

  // Kahn's algorithm for topological sort with parallel grouping
  const steps: ExecutionStep[] = [];
  const parallelGroups: string[][] = [];
  const visited = new Set<string>();
  const remaining = new Map(inbound);

  while (remaining.size > 0) {
    // Find all nodes whose dependencies are satisfied
    const ready: string[] = [];
    for (const [nodeId, deps] of remaining) {
      const allSatisfied = [...deps].every((d) => visited.has(d));
      if (allSatisfied) ready.push(nodeId);
    }

    if (ready.length === 0) {
      // Cycle detected — break with remaining nodes (they'll error at runtime)
      const cycleNodes = [...remaining.keys()];
      console.warn("Cycle detected in graph involving nodes:", cycleNodes);
      for (const nodeId of cycleNodes) {
        const node = nodeMap.get(nodeId)!;
        steps.push({
          nodeId,
          type: node.type,
          inputs: inputsByNode.get(nodeId) ?? {},
          config: node.data,
        });
      }
      parallelGroups.push(cycleNodes);
      break;
    }

    parallelGroups.push(ready);
    for (const nodeId of ready) {
      const node = nodeMap.get(nodeId)!;
      steps.push({
        nodeId,
        type: node.type,
        inputs: inputsByNode.get(nodeId) ?? {},
        config: node.data,
      });
      visited.add(nodeId);
      remaining.delete(nodeId);
    }
  }

  return { steps, parallelGroups };
}

/**
 * Validates a graph before execution.
 * Returns an array of error messages (empty = valid).
 */
export function validateGraph(graph: GraphJSON): string[] {
  const errors: string[] = [];

  if (graph.nodes.length === 0) {
    errors.push("Graph is empty");
    return errors;
  }

  // Check that all edge references exist
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const e of graph.edges) {
    if (!nodeIds.has(e.source)) errors.push(`Edge ${e.id}: source node "${e.source}" not found`);
    if (!nodeIds.has(e.target)) errors.push(`Edge ${e.id}: target node "${e.target}" not found`);
  }

  return errors;
}
