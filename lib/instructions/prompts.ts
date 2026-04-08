import type { GenerateInstructionsRequest } from "./schema";

export function buildInstructionPrompt(input: GenerateInstructionsRequest): string {
  const modeGuidance =
    input.mode === "casual"
      ? "Write beginner-friendly instructions with modern shortcuts."
      : "Write historically informed, high-precision instructions with professional techniques.";

  return [
    "You are PatternPal, a garment construction assistant.",
    modeGuidance,
    `Garment description: ${input.description}`,
    "Return ONLY valid JSON in this exact shape:",
    "{",
    '  "garment": "string",',
    '  "mode": "casual | professional",',
    '  "materials": ["string"],',
    '  "assembly": [{ "step": 1, "description": "string", "details": ["string"] }],',
    '  "finishing": ["string"],',
    '  "notes": "string"',
    "}",
    "Do not include markdown or extra commentary.",
  ].join("\n");
}
