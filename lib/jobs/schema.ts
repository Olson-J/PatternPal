import type { GarmentInstructions, GuidanceMode } from "../instructions/schema";

export type BackgroundJobStatus = "queued" | "running" | "completed" | "failed";

export interface BackgroundGenerationRequest {
  description: string;
  mode: GuidanceMode;
  simulateFailure?: boolean;
}

export interface BackgroundGenerationJob {
  id: string;
  description: string;
  mode: GuidanceMode;
  status: BackgroundJobStatus;
  progress: number;
  stage: string;
  instructions?: GarmentInstructions;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  simulateFailure?: boolean;
}

export function isBackgroundGenerationRequest(value: unknown): value is BackgroundGenerationRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.description === "string" &&
    candidate.description.trim().length > 0 &&
    (candidate.mode === "casual" || candidate.mode === "professional") &&
    (candidate.simulateFailure === undefined || typeof candidate.simulateFailure === "boolean")
  );
}
