import type {
  AssemblyStep,
  GarmentInstructions,
  GenerateInstructionsRequest,
  GuidanceMode,
} from "./schema";

type ParseResult = {
  instructions: GarmentInstructions;
  didFallback: boolean;
  issues: string[];
};

function safeParseJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    try {
      const extracted = JSON.parse(raw.slice(start, end + 1));
      return extracted && typeof extracted === "object" ? (extracted as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAssembly(value: unknown): AssemblyStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: AssemblyStep[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const candidate = item as Record<string, unknown>;
    const description = typeof candidate.description === "string" ? candidate.description.trim() : "";

    if (!description) {
      return;
    }

    const step =
      typeof candidate.step === "number" && Number.isFinite(candidate.step) && candidate.step > 0
        ? Math.floor(candidate.step)
        : index + 1;

    const details = normalizeStringArray(candidate.details);

    normalized.push({
      step,
      description,
      details: details.length > 0 ? details : undefined,
    });
  });

  return normalized;
}

function fallbackInstructions(input: GenerateInstructionsRequest): GarmentInstructions {
  return {
    garment: input.description.trim() || "Untitled garment",
    mode: input.mode,
    materials: ["Main fabric", "Matching thread"],
    assembly: [
      {
        step: 1,
        description: "Draft and cut main garment pieces",
      },
      {
        step: 2,
        description: "Assemble major seams and test fit",
      },
      {
        step: 3,
        description: "Finish hems and closures",
      },
    ],
    finishing: ["Press finished garment", "Check seam strength and fit"],
    notes: "Generated with fallback defaults due to incomplete model output.",
    generatedAt: new Date().toISOString(),
  };
}

export function parseInstructionResponse(raw: string, input: GenerateInstructionsRequest): ParseResult {
  const parsed = safeParseJson(raw);

  if (!parsed) {
    return {
      instructions: fallbackInstructions(input),
      didFallback: true,
      issues: ["Response was not parseable JSON."],
    };
  }

  const issues: string[] = [];

  const garment = typeof parsed.garment === "string" && parsed.garment.trim()
    ? parsed.garment.trim()
    : input.description.trim() || "Untitled garment";

  if (typeof parsed.garment !== "string" || !parsed.garment.trim()) {
    issues.push("Missing garment; defaulted from request description.");
  }

  const mode: GuidanceMode = parsed.mode === "professional" || parsed.mode === "casual" ? parsed.mode : input.mode;
  if (parsed.mode !== "professional" && parsed.mode !== "casual") {
    issues.push("Missing/invalid mode; defaulted from request.");
  }

  const materials = normalizeStringArray(parsed.materials);
  if (materials.length === 0) {
    issues.push("Missing materials; used fallback defaults.");
  }

  const assembly = normalizeAssembly(parsed.assembly);
  if (assembly.length === 0) {
    issues.push("Missing assembly steps; used fallback defaults.");
  }

  const finishing = normalizeStringArray(parsed.finishing);
  if (finishing.length === 0) {
    issues.push("Missing finishing steps; used fallback defaults.");
  }

  const fallback = fallbackInstructions(input);

  const instructions: GarmentInstructions = {
    garment,
    mode,
    materials: materials.length > 0 ? materials : fallback.materials,
    assembly: assembly.length > 0 ? assembly : fallback.assembly,
    finishing: finishing.length > 0 ? finishing : fallback.finishing,
    notes: typeof parsed.notes === "string" && parsed.notes.trim() ? parsed.notes.trim() : fallback.notes,
    generatedAt: new Date().toISOString(),
  };

  return {
    instructions,
    didFallback: issues.length > 0,
    issues,
  };
}
