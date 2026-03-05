const STORAGE_KEY = "gooey_llm_presets";

export interface LLMPreset {
  name: string;
  provider: string;
  modelId: string;
  baseURL: string;
  thinkingLevel: string;
  apiKeyEnvVar: string;
}

export function loadPresets(): LLMPreset[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function savePreset(preset: LLMPreset): void {
  const presets = loadPresets().filter((p) => p.name !== preset.name);
  presets.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function deletePreset(name: string): void {
  const presets = loadPresets().filter((p) => p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
