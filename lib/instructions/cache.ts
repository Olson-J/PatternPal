import type { GarmentInstructions, GenerateInstructionsRequest } from "./schema";

type CachedValue = {
  instructions: GarmentInstructions;
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const generationCache = new Map<string, CachedValue>();

export function createGenerationCacheKey(input: GenerateInstructionsRequest): string {
  return `${input.mode}::${input.description.trim().toLowerCase()}`;
}

export function getCachedInstructions(key: string): GarmentInstructions | null {
  const existing = generationCache.get(key);

  if (!existing) {
    return null;
  }

  if (existing.expiresAt < Date.now()) {
    generationCache.delete(key);
    return null;
  }

  return existing.instructions;
}

export function setCachedInstructions(key: string, instructions: GarmentInstructions): void {
  generationCache.set(key, {
    instructions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearGenerationCache(): void {
  generationCache.clear();
}
