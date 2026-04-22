export type InstructionRuntimeConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  useRealLlm: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  dailyBudgetUsd: number;
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = parseNumber(value, fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function getInstructionRuntimeConfig(): InstructionRuntimeConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5.4-nano",
    timeoutMs: parseNumber(process.env.OPENAI_TIMEOUT_MS, 30_000),
    maxOutputTokens: parseNumber(process.env.OPENAI_MAX_OUTPUT_TOKENS, 1600),
    temperature: parseNumber(process.env.OPENAI_TEMPERATURE, 0.2),
    useRealLlm: parseBoolean(process.env.USE_REAL_LLM, false),
    rateLimitWindowMs: parsePositiveInteger(process.env.GENERATION_RATE_LIMIT_WINDOW_MS, 60_000),
    rateLimitMaxRequests: parsePositiveInteger(process.env.GENERATION_RATE_LIMIT_MAX_REQUESTS, 10),
    dailyBudgetUsd: parseNumber(process.env.GENERATION_DAILY_BUDGET_USD, 2.0),
  };
}
