import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearGenerationCache } from "../lib/instructions/cache";
import { generateInstructions } from "../lib/instructions/generate";

describe("Instruction generation service", () => {
  beforeEach(() => {
    clearGenerationCache();
  });

  it("returns parsed instructions from generator output", async () => {
    const generator = vi.fn(async () =>
      JSON.stringify({
        garment: "Simple dress",
        mode: "casual",
        materials: ["Linen"],
        assembly: [{ step: 1, description: "Cut pieces" }],
        finishing: ["Hem skirt"],
      })
    );

    const result = await generateInstructions(
      { description: "simple linen shift dress", mode: "casual" },
      generator
    );

    expect(result.fromCache).toBe(false);
    expect(result.instructions.garment).toBe("Simple dress");
    expect(result.instructions.materials).toContain("Linen");
    expect(generator).toHaveBeenCalledTimes(1);
  });

  it("uses cache for repeated requests", async () => {
    const generator = vi.fn(async () =>
      JSON.stringify({
        garment: "Cached garment",
        mode: "casual",
        materials: ["Fabric"],
        assembly: [{ step: 1, description: "Assemble" }],
        finishing: ["Finish"],
      })
    );

    const input = { description: "cached garment", mode: "casual" as const };

    const first = await generateInstructions(input, generator);
    const second = await generateInstructions(input, generator);

    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(generator).toHaveBeenCalledTimes(1);
  });

  it("propagates upstream generator errors", async () => {
    const generator = vi.fn(async () => {
      throw new Error("mock LLM failure");
    });

    await expect(
      generateInstructions({ description: "stays", mode: "professional" }, generator)
    ).rejects.toThrow("mock LLM failure");
  });

  it("does not cache fallback results", async () => {
    const generator = vi.fn(async () => "this is not json");
    const input = { description: "fallback test garment", mode: "casual" as const };

    const first = await generateInstructions(input, generator);
    const second = await generateInstructions(input, generator);

    expect(first.didFallback).toBe(true);
    expect(second.didFallback).toBe(true);
    expect(second.fromCache).toBe(false);
    expect(generator).toHaveBeenCalledTimes(4);
  });

  it("retries once and returns repaired instructions when second attempt is valid", async () => {
    const generator = vi
      .fn<[], Promise<string>>()
      .mockImplementationOnce(async () => "this is not json")
      .mockImplementationOnce(
        async () =>
          JSON.stringify({
            garment: "Repaired chemise",
            mode: "professional",
            materials: ["Fine cotton", "Linen thread"],
            assembly: [
              { step: 1, description: "Draft pattern pieces", details: ["Front", "Back", "Sleeves"] },
              { step: 2, description: "Sew body seams", details: ["French seams"] },
              { step: 3, description: "Attach sleeves and gussets", details: [] },
            ],
            finishing: ["Hem neckline and cuffs"],
            notes: "Use narrow rolled hems for durability.",
          })
      );

    const result = await generateInstructions(
      { description: "19th century simple cotton chemise", mode: "professional" },
      generator
    );

    expect(result.didFallback).toBe(false);
    expect(result.fromCache).toBe(false);
    expect(result.instructions.garment).toBe("Repaired chemise");
    expect(result.instructions.assembly.length).toBeGreaterThanOrEqual(3);
    expect(generator).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent requests for identical input", async () => {
    const generator = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));

      return JSON.stringify({
        garment: "Concurrent garment",
        mode: "casual",
        materials: ["Fabric"],
        assembly: [{ step: 1, description: "Assemble" }],
        finishing: ["Finish"],
      });
    });

    const input = { description: "concurrent garment", mode: "casual" as const };

    const [first, second] = await Promise.all([
      generateInstructions(input, generator),
      generateInstructions(input, generator),
    ]);

    expect(first.instructions.garment).toBe("Concurrent garment");
    expect(second.instructions.garment).toBe("Concurrent garment");
    expect(generator).toHaveBeenCalledTimes(1);
  });
});
