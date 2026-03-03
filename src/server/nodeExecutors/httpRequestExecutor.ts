import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";

/**
 * HTTP Request node executor.
 * Uses native fetch (Node 18+). No extra dependencies needed.
 *
 * Port inputs override config values when connected:
 *   url port    → overrides config.url
 *   body port   → overrides config.body
 *   headers port → merged on top of config.headers
 */
export async function executeHttpRequest(
  step: ExecutionStep,
  ctx: ExecutionContext,
): Promise<Record<string, any>> {
  // --- Resolve URL ---
  const urlPortRef = step.inputs["url"];
  const urlFromPort = urlPortRef
    ? ctx.nodeOutputs.get(urlPortRef.sourceNodeId)?.[urlPortRef.sourcePortId]
    : undefined;
  const url = String(urlFromPort ?? step.config.url ?? "").trim();

  if (!url) {
    throw new Error("HTTP Request: no URL configured. Set the URL config field or connect a URL input port.");
  }

  const method = (step.config.method ?? "GET").toUpperCase();
  const timeoutMs = (step.config.timeout ?? 10) * 1000;

  // --- Resolve headers ---
  let configHeaders: Record<string, string> = {};
  try {
    const raw = step.config.headers ?? "{}";
    configHeaders = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    // malformed JSON in config — ignore
  }

  const headersPortRef = step.inputs["headers"];
  const headersFromPort = headersPortRef
    ? ctx.nodeOutputs.get(headersPortRef.sourceNodeId)?.[headersPortRef.sourcePortId]
    : undefined;

  const resolvedHeaders: Record<string, string> = {
    ...configHeaders,
    ...(typeof headersFromPort === "object" && headersFromPort !== null ? headersFromPort : {}),
  };

  // --- Resolve body ---
  const bodyPortRef = step.inputs["body"];
  const bodyFromPort = bodyPortRef
    ? ctx.nodeOutputs.get(bodyPortRef.sourceNodeId)?.[bodyPortRef.sourcePortId]
    : undefined;

  let body: string | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const rawBody = bodyFromPort ?? step.config.body ?? "";
    if (rawBody !== "" && rawBody != null) {
      body = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody);
      // Auto-set Content-Type if not already set and body looks like JSON
      if (!resolvedHeaders["Content-Type"] && !resolvedHeaders["content-type"]) {
        try {
          JSON.parse(body);
          resolvedHeaders["Content-Type"] = "application/json";
        } catch {
          // not JSON, leave Content-Type unset
        }
      }
    }
  }

  ctx.send({
    type: "stream_token",
    nodeId: step.nodeId,
    token: `🌐 ${method} ${url}\n`,
  });

  // --- Fetch ---
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: resolvedHeaders,
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err: any) {
    throw new Error(`HTTP Request failed: ${err.message ?? String(err)}`);
  }

  // --- Parse response ---
  const statusCode = res.status;
  const ok = res.ok;

  let response: any;
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (contentType.includes("application/json")) {
    try {
      response = JSON.parse(text);
    } catch {
      response = text;
    }
  } else {
    response = text;
  }

  ctx.send({
    type: "stream_token",
    nodeId: step.nodeId,
    token: `  ↳ ${statusCode} ${ok ? "OK" : "Error"} (${contentType || "unknown type"})\n`,
  });

  return { response, statusCode, ok };
}
