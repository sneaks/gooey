import type { GraphJSON } from "../shared/graphTypes";
import type { ServerMessage } from "../shared/protocol";
import { compileGraph, validateGraph } from "../shared/execution/compiler";
import type { ExecutionPlan } from "../shared/execution/types";
import { executeNode } from "./nodeExecutors/index";

export type SendMessage = (msg: ServerMessage) => void;

/**
 * Runs a compiled graph, executing nodes in topological order.
 * Streams ServerMessage events back to the client via `send`.
 */
export class GraphRunner {
  private plan: ExecutionPlan | null = null;
  private aborted = false;
  private gateResolvers = new Map<string, (approved: boolean) => void>();
  private nodeOutputs = new Map<string, Record<string, any>>();

  constructor(
    private graph: GraphJSON,
    private send: SendMessage,
  ) {}

  async run(): Promise<void> {
    // Validate
    const errors = validateGraph(this.graph);
    if (errors.length > 0) {
      this.send({ type: "error", nodeId: "", message: errors.join("; ") });
      this.send({ type: "done" });
      return;
    }

    // Compile
    this.plan = compileGraph(this.graph);

    // Execute parallel groups in order
    for (const group of this.plan.parallelGroups) {
      if (this.aborted) break;

      await Promise.all(
        group.map((nodeId) => this.executeStep(nodeId))
      );
    }

    if (!this.aborted) {
      this.send({ type: "done" });
    }
  }

  stop(): void {
    this.aborted = true;
    // Reject all pending gates
    for (const [, resolver] of this.gateResolvers) {
      resolver(false);
    }
    this.gateResolvers.clear();
  }

  resolveGate(commandId: string, approved: boolean): void {
    const resolver = this.gateResolvers.get(commandId);
    if (resolver) {
      resolver(approved);
      this.gateResolvers.delete(commandId);
    }
  }

  private async executeStep(nodeId: string): Promise<void> {
    if (this.aborted) return;

    const step = this.plan!.steps.find((s) => s.nodeId === nodeId);
    if (!step) return;

    this.send({ type: "node_state", nodeId, status: "running" });

    try {
      const result = await executeNode(step, {
        send: this.send,
        nodeOutputs: this.nodeOutputs,
        waitForGate: (commandId: string) => this.waitForGate(commandId),
        isAborted: () => this.aborted,
      });

      // Store outputs for downstream nodes
      if (result) {
        this.nodeOutputs.set(nodeId, result);
      }

      if (!this.aborted) {
        this.send({ type: "node_state", nodeId, status: "done" });
      }
    } catch (err: any) {
      if (!this.aborted) {
        this.send({ type: "error", nodeId, message: err.message ?? String(err) });
        this.send({ type: "node_state", nodeId, status: "error", error: err.message });
      }
    }
  }

  private waitForGate(commandId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.gateResolvers.set(commandId, resolve);
    });
  }
}
