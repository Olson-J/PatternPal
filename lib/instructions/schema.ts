export const guidanceModes = ["casual", "professional"] as const;

export type GuidanceMode = (typeof guidanceModes)[number];

export interface AssemblyStep {
  step: number;
  description: string;
  details?: string[];
}

export interface GarmentInstructions {
  garment: string;
  mode: GuidanceMode;
  materials: string[];
  assembly: AssemblyStep[];
  finishing: string[];
  notes?: string;
  generatedAt: string;
}

export interface GenerateInstructionsRequest {
  description: string;
  mode: GuidanceMode;
}

export function isGuidanceMode(value: unknown): value is GuidanceMode {
  return typeof value === "string" && guidanceModes.includes(value as GuidanceMode);
}
