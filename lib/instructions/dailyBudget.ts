import { getInstructionRuntimeConfig } from "./config";

type DailyBudgetWindow = {
  dayStartMs: number;
  spentUsd: number;
};

let budgetWindow: DailyBudgetWindow = {
  dayStartMs: Date.now(),
  spentUsd: 0,
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function resetDailyBudget(): void {
  budgetWindow = {
    dayStartMs: Date.now(),
    spentUsd: 0,
  };
}

export function estimateTokenCost(inputTokens: number, outputTokens: number, model: string): number {
  const isNano = model.toLowerCase().includes("nano");
  if (isNano) {
    const inputCostPer1m = 0.2;
    const outputCostPer1m = 1.0;
    return ((inputTokens * inputCostPer1m) + (outputTokens * outputCostPer1m)) / 1_000_000;
  }

  const inputCostPer1m = 3.0;
  const outputCostPer1m = 15.0;
  return ((inputTokens * inputCostPer1m) + (outputTokens * outputCostPer1m)) / 1_000_000;
}

export function isDailyBudgetExceeded(nowMs = Date.now()): boolean {
  const config = getInstructionRuntimeConfig();
  const elapsedMs = nowMs - budgetWindow.dayStartMs;

  if (elapsedMs >= MILLISECONDS_PER_DAY) {
    resetDailyBudget();
  }

  return budgetWindow.spentUsd >= config.dailyBudgetUsd;
}

export function addToDailyBudget(costUsd: number): void {
  budgetWindow.spentUsd += costUsd;
}

export function getDailyBudgetRemaining(nowMs = Date.now()): number {
  const config = getInstructionRuntimeConfig();
  const elapsedMs = nowMs - budgetWindow.dayStartMs;

  if (elapsedMs >= MILLISECONDS_PER_DAY) {
    resetDailyBudget();
  }

  return Math.max(0, config.dailyBudgetUsd - budgetWindow.spentUsd);
}
