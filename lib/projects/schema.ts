import type { GarmentInstructions, GuidanceMode } from "../instructions/schema";

export interface ProjectRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  mode: GuidanceMode;
  instructions: GarmentInstructions;
  createdAt: string;
  updatedAt: string;
}

export type ProjectSummary = Omit<ProjectRecord, "instructions">;

export interface SaveProjectRequest {
  title?: string;
  description: string;
  mode: GuidanceMode;
  instructions: GarmentInstructions;
}

export interface SaveProjectInput extends SaveProjectRequest {
  userId?: string;
}

export function toProjectSummary(project: ProjectRecord): ProjectSummary {
  return {
    id: project.id,
    userId: project.userId,
    title: project.title,
    description: project.description,
    mode: project.mode,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
