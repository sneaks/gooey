import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";
import { kvStore } from "../kvStore";

export async function executeKVStore(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const action    = (step.config.action    as string) ?? "get";
  const configKey = (step.config.key       as string) ?? "";
  const namespace = (step.config.namespace as string) || "default";

  // Key can be overridden by an upstream node wired to the `key` port
  const keyInput = step.inputs["key"];
  const keyOverride = keyInput
    ? String(ctx.nodeOutputs.get(keyInput.sourceNodeId)?.[keyInput.sourcePortId] ?? "")
    : null;
  const key = (keyOverride && keyOverride.trim()) ? keyOverride.trim() : configKey;

  // Value input (for set action)
  const valueInput = step.inputs["input"];
  const value = valueInput
    ? ctx.nodeOutputs.get(valueInput.sourceNodeId)?.[valueInput.sourcePortId] ?? null
    : null;

  switch (action) {
    case "set": {
      if (!key) {
        ctx.send({ type: "stream_token", nodeId: step.nodeId, token: "⚠️ KV set: no key specified" });
        return { value: null, exists: false, trigger: true };
      }
      kvStore.set(namespace, key, value);
      ctx.send({ type: "stream_token", nodeId: step.nodeId, token: `📝 set [${namespace}::${key}]` });
      return { value, exists: true, trigger: true };
    }

    case "get": {
      if (!key) {
        ctx.send({ type: "stream_token", nodeId: step.nodeId, token: "⚠️ KV get: no key specified" });
        return { value: null, exists: false, trigger: true };
      }
      const stored = kvStore.get(namespace, key);
      const exists = kvStore.has(namespace, key);
      ctx.send({ type: "stream_token", nodeId: step.nodeId, token: `🔍 get [${namespace}::${key}] → ${exists ? JSON.stringify(stored) : "(not set)"}` });
      return { value: stored ?? null, exists, trigger: true };
    }

    case "delete": {
      if (!key) {
        ctx.send({ type: "stream_token", nodeId: step.nodeId, token: "⚠️ KV delete: no key specified" });
        return { value: null, exists: false, trigger: true };
      }
      const existed = kvStore.delete(namespace, key);
      ctx.send({ type: "stream_token", nodeId: step.nodeId, token: `🗑️ delete [${namespace}::${key}] ${existed ? "✓" : "(was not set)"}` });
      return { value: null, exists: false, trigger: true };
    }

    case "get-all": {
      const all = kvStore.getAll(namespace);
      ctx.send({ type: "stream_token", nodeId: step.nodeId, token: `📦 get-all [${namespace}] → ${Object.keys(all).length} keys` });
      return { value: all, exists: Object.keys(all).length > 0, trigger: true };
    }

    default:
      return { value: null, exists: false, trigger: true };
  }
}
