import { afterEach, describe, expect, it, vi } from "vitest";
import { clearGenerationCache } from "../lib/instructions/cache";
import { generateInstructions } from "../lib/instructions/generate";
import { mockGenerateInstructionResponse } from "../lib/instructions/mockLlm";
import { generateOpenAiInstructionResponse } from "../lib/instructions/openai";
import { getDefaultInstructionGenerator } from "../lib/instructions/provider";
import * as openAiModule from "../lib/instructions/openai";

describe("Instruction provider selection", () => {
  afterEach(() => {
    clearGenerationCache();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses mock provider when USE_REAL_LLM is false", () => {
    vi.stubEnv("USE_REAL_LLM", "false");

    const provider = getDefaultInstructionGenerator();

    expect(provider).toBe(mockGenerateInstructionResponse);
  });

  it("uses OpenAI provider when USE_REAL_LLM is true", () => {
    vi.stubEnv("USE_REAL_LLM", "true");

    const provider = getDefaultInstructionGenerator();

    expect(provider).toBe(generateOpenAiInstructionResponse);
  });

  it("generates via OpenAI provider when USE_REAL_LLM is enabled", async () => {
    vi.stubEnv("USE_REAL_LLM", "true");
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    const openAiSpy = vi
      .spyOn(openAiModule, "generateOpenAiInstructionResponse")
      .mockResolvedValue(
        JSON.stringify({
          garment: "18th-century stays",
          mode: "professional",
          materials: ["Linen", "Whalebone"],
          assembly: [{ step: 1, description: "Cut panels", details: [] }],
          finishing: ["Bind edges"],
          notes: "Structured for test.",
        })
      );

    const result = await generateInstructions({
      description: "18th-century stays",
      mode: "professional",
    });

    expect(result.fromCache).toBe(false);
    expect(result.instructions.garment).toBe("18th-century stays");
    expect(openAiSpy).toHaveBeenCalledTimes(1);
  });

  it("throws a clear error when real LLM is enabled without key", async () => {
    vi.stubEnv("USE_REAL_LLM", "true");
    vi.stubEnv("OPENAI_API_KEY", "");

    await expect(
      generateInstructions({ description: "simple bodice", mode: "casual" })
    ).rejects.toThrow(/OPENAI_API_KEY is required/i);
  });
});
