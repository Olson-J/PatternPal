import type { GenerateInstructionsRequest } from "./schema";

export function buildInstructionPrompt(input: GenerateInstructionsRequest): string {
  const modeGuidance =
    input.mode === "casual"
      ? "Write beginner-friendly instructions with modern shortcuts."
      : "Write historically informed, high-precision instructions with professional techniques.";

  return [
    "You are PatternPal, a garment construction assistant.",
    "STRICT: Return ONLY valid JSON. Do not include markdown, code fences, or any text outside the JSON object.",
    modeGuidance,
    `Garment: ${input.description}`,
    "",
    "JSON schema (exact keys and structure required):",
    "{",
    '  "garment": "description of the garment",',
    '  "mode": "casual" or "professional",',
    '  "materials": ["item1", "item2", ...],',
    '  "assembly": [',
    '    {"step": 1, "description": "action", "details": ["detail1", "detail2", ...]},',
    '    {"step": 2, "description": "action", "details": ["detail1", "detail2", ...]}',
    "  ],",
    '  "finishing": ["task1", "task2", ...],',
    '  "notes": "any extra notes"',
    "}",
    "",
    "Important requirements:",
    "- Start with '{' and end with '}'",
    "- Every assembly step MUST have: step (number >= 1), description (string), details (array of strings, can be empty [])",
    "- Do not wrap in code fences or markdown",
    "- Do not include any text before or after the JSON",
    "- materials and finishing arrays must have at least 1 item",
    "- assembly array must have at least 1 step",
  ].join("\n");
}

export function buildInstructionRepairPrompt(
  input: GenerateInstructionsRequest,
  previousRaw: string,
  issues: string[]
): string {
  const truncatedPrevious = previousRaw.length > 2_000 ? `${previousRaw.slice(0, 2_000)}...` : previousRaw;
  const issueLines = issues.length > 0 ? issues.map((issue) => `- ${issue}`).join("\n") : "- Output was incomplete.";

  return [
    "You previously returned incomplete JSON for a garment instruction request.",
    "Return a corrected response now.",
    "STRICT: Return ONLY valid JSON matching the required shape.",
    `Garment: ${input.description}`,
    `Mode: ${input.mode}`,
    "",
    "Problems found in previous response:",
    issueLines,
    "",
    "Previous response (for correction context):",
    truncatedPrevious,
    "",
    "Required JSON keys:",
    '{"garment":"string","mode":"casual|professional","materials":["string"],"assembly":[{"step":1,"description":"string","details":["string"]}],"finishing":["string"],"notes":"string"}',
    "",
    "Requirements:",
    "- Start with '{' and end with '}'",
    "- Include at least 3 assembly steps",
    "- Keep details arrays present (empty array allowed)",
    "- No markdown, no prose, no code fences",
  ].join("\n");
}
