import type { GenerateInstructionsRequest } from "./schema";

export async function mockGenerateInstructionResponse(
  _prompt: string,
  input: GenerateInstructionsRequest
): Promise<string> {
  const normalized = input.description.toLowerCase();
  const isDress = normalized.includes("dress");

  const payload = {
    garment: isDress ? "Simple linen shift dress" : input.description,
    mode: input.mode,
    materials: isDress
      ? ["Linen fabric", "Thread", "Optional trim"]
      : ["Main fabric", "Thread", "Optional Lacing cord"],
    assembly: isDress
      ? [
          { step: 1, description: "Cut front and back panels" },
          { step: 2, description: "Sew shoulder and side seams" },
          { step: 3, description: "Finish neckline, armholes, and hem" },
        ]
      : [
          { step: 1, description: "Cut panels from pattern" },
          { step: 2, description: "Assemble seams and add closure" },
        ],
    finishing: ["Press seams", "Test fit and reinforce stress points"],
    notes:
      input.mode === "casual"
        ? "Casual mode prioritizes approachable construction steps."
        : "Professional mode emphasizes historical and precision techniques.",
  };

  return JSON.stringify(payload);
}
