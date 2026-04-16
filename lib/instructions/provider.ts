import type { GenerateInstructionsRequest } from "./schema";
import { getInstructionRuntimeConfig } from "./config";
import { mockGenerateInstructionResponse } from "./mockLlm";
import { generateOpenAiInstructionResponse } from "./openai";

export type InstructionGenerator = (
  prompt: string,
  input: GenerateInstructionsRequest
) => Promise<string>;

export function getDefaultInstructionGenerator(): InstructionGenerator {
  const config = getInstructionRuntimeConfig();
  return config.useRealLlm ? generateOpenAiInstructionResponse : mockGenerateInstructionResponse;
}
