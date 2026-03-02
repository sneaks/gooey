import type { ExecutionStep } from "../../shared/execution/types";
import type { ExecutionContext } from "./index";

/**
 * LLM Provider node: resolves model config from provider + modelId + env var.
 * For Phase 1, produces a config object that the Agent executor reads.
 * Real ModelRegistry integration comes when pi SDK is wired in.
 */
export async function executeLLMProvider(
  step: ExecutionStep,
  _ctx: ExecutionContext,
): Promise<Record<string, any>> {
  const { provider, modelId, thinkingLevel, apiKeyEnvVar } = step.config;

  // Resolve API key from environment
  const apiKey = apiKeyEnvVar ? process.env[apiKeyEnvVar] : undefined;
  if (!apiKey) {
    console.warn(
      `[llm-provider] API key env var "${apiKeyEnvVar}" not set. Agent execution will fail.`
    );
  }

  return {
    model: {
      provider: provider ?? "anthropic",
      modelId: modelId ?? "claude-sonnet-4-20250514",
      thinkingLevel: thinkingLevel ?? "off",
      apiKey, // Stays server-side, never sent to browser
    },
  };
}
