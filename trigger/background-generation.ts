import { task } from "@trigger.dev/sdk/v3";

import { generateInstructions } from "@/lib/instructions/generate";
import { BACKGROUND_GENERATION_TASK_ID } from "@/lib/jobs/constants";
import type { BackgroundGenerationRequest } from "@/lib/jobs/schema";

export type BackgroundGenerationTaskOutput = {
  instructions: Awaited<ReturnType<typeof generateInstructions>>["instructions"];
  fromCache: boolean;
  didFallback: boolean;
  issues: string[];
};

export const backgroundGenerationTask = task({
  id: BACKGROUND_GENERATION_TASK_ID,
  run: async (input: BackgroundGenerationRequest): Promise<BackgroundGenerationTaskOutput> => {
    if (input.simulateFailure) {
      throw new Error("Simulated worker failure");
    }

    const result = await generateInstructions({
      description: input.description,
      mode: input.mode,
    });

    return {
      instructions: result.instructions,
      fromCache: result.fromCache,
      didFallback: result.didFallback,
      issues: result.issues,
    };
  },
});