import { describe, expect, it } from "vitest";
import { parseInstructionResponse } from "../lib/instructions/parser";

describe("Instruction response parser", () => {
  const input = {
    description: "18th-century stays",
    mode: "professional" as const,
  };

  it("parses valid JSON into normalized instructions", () => {
    const raw = JSON.stringify({
      garment: "18th-century stays",
      mode: "professional",
      materials: ["Linen", "Boning"],
      assembly: [{ step: 1, description: "Cut panels" }],
      finishing: ["Press seams"],
      notes: "Use period-accurate stitching.",
    });

    const parsed = parseInstructionResponse(raw, input);

    expect(parsed.didFallback).toBe(false);
    expect(parsed.instructions.mode).toBe("professional");
    expect(parsed.instructions.materials.length).toBe(2);
    expect(parsed.instructions.assembly[0].description).toBe("Cut panels");
  });

  it("falls back for non-JSON responses", () => {
    const parsed = parseInstructionResponse("Not JSON", input);

    expect(parsed.didFallback).toBe(true);
    expect(parsed.issues.length).toBeGreaterThan(0);
    expect(parsed.instructions.materials.length).toBeGreaterThan(0);
    expect(parsed.instructions.assembly.length).toBeGreaterThan(0);
  });

  it("repairs incomplete payload fields", () => {
    const raw = JSON.stringify({
      garment: "",
      mode: "invalid",
      materials: [],
      assembly: [],
      finishing: [],
    });

    const parsed = parseInstructionResponse(raw, input);

    expect(parsed.didFallback).toBe(true);
    expect(parsed.instructions.garment).toBe("18th-century stays");
    expect(parsed.instructions.mode).toBe("professional");
    expect(parsed.instructions.materials.length).toBeGreaterThan(0);
    expect(parsed.instructions.finishing.length).toBeGreaterThan(0);
  });
});
