import {
  createGenerationCacheKey,
  getCachedInstructions,
  setCachedInstructions,
} from "./cache";
import { mockGenerateInstructionResponse } from "./mockLlm";
import { parseInstructionResponse } from "./parser";
import { buildInstructionPrompt } from "./prompts";
import type { GarmentInstructions, GenerateInstructionsRequest } from "./schema";

export type InstructionGenerator = (
  prompt: string,
  input: GenerateInstructionsRequest
) => Promise<string>;

export type GenerationResult = {
  instructions: GarmentInstructions;
  fromCache: boolean;
  didFallback: boolean;
  issues: string[];
};

export async function generateInstructions(
  input: GenerateInstructionsRequest,
  generator: InstructionGenerator = mockGenerateInstructionResponse
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

  const prompt = buildInstructionPrompt(input);
  const raw = await generator(prompt, input);
  const parsed = parseInstructionResponse(raw, input);

  setCachedInstructions(key, parsed.instructions);

  return {
    instructions: parsed.instructions,
    fromCache: false,
    didFallback: parsed.didFallback,
    issues: parsed.issues,
  };
}
