import {
  createGenerationCacheKey,
  getCachedInstructions,
  setCachedInstructions,
} from "./cache";
import { parseInstructionResponse } from "./parser";
import { buildInstructionPrompt } from "./prompts";
import { getDefaultInstructionGenerator, type InstructionGenerator } from "./provider";
import type { GarmentInstructions, GenerateInstructionsRequest } from "./schema";

const inFlightGenerationByKey = new Map<string, Promise<GenerationResult>>();

export type GenerationResult = {
  instructions: GarmentInstructions;
  fromCache: boolean;
  didFallback: boolean;
  issues: string[];
};

export async function generateInstructions(
  input: GenerateInstructionsRequest,
  generator: InstructionGenerator = getDefaultInstructionGenerator()
): Promise<GenerationResult> {
  const key = createGenerationCacheKey(input);
  const cached = getCachedInstructions(key);

  if (cached) {
    return {
      instructions: cached,
      fromCache: true,
      didFallback: false,
      issues: [],
    };
  }

  const inFlight = inFlightGenerationByKey.get(key);
  if (inFlight) {
    return inFlight;
  }

  const generationPromise = (async (): Promise<GenerationResult> => {
    const prompt = buildInstructionPrompt(input);
    const raw = await generator(prompt, input);
    const parsed = parseInstructionResponse(raw, input);

    if (!parsed.didFallback) {
      setCachedInstructions(key, parsed.instructions);
    }

    return {
      instructions: parsed.instructions,
      fromCache: false,
      didFallback: parsed.didFallback,
      issues: parsed.issues,
    };
  })();

  inFlightGenerationByKey.set(key, generationPromise);

  try {
    return await generationPromise;
  } finally {
    inFlightGenerationByKey.delete(key);
  }
}
