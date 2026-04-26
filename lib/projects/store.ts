import { fixtureProjects } from "./fixtures";
import type { ProjectRecord, ProjectSummary, SaveProjectInput } from "./schema";
import { toProjectSummary } from "./schema";

const projectStore = new Map<string, ProjectRecord>();

function generateProjectId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `proj-${Date.now()}-${randomPart}`;
}

function ensureSeedData(): void {
  if (projectStore.size > 0) {
    return;
  }

  fixtureProjects.forEach((project) => {
    projectStore.set(project.id, structuredClone(project));
  });
}

export function resetProjectStore(): void {
  projectStore.clear();
  ensureSeedData();
}

export function listProjects(): ProjectSummary[] {
  ensureSeedData();

  return [...projectStore.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toProjectSummary);
}

export function getProjectById(id: string): ProjectRecord | null {
  ensureSeedData();
  return projectStore.get(id) ?? null;
}

export function saveProject(input: SaveProjectInput): ProjectRecord {
  ensureSeedData();

  const now = new Date().toISOString();
  const title = input.title?.trim() || input.instructions.garment || input.description.trim();

  const project: ProjectRecord = {
    id: generateProjectId(),
    userId: input.userId ?? "fixture-user-local",
    title,
    description: input.description.trim(),
    mode: input.mode,
    instructions: input.instructions,
    createdAt: now,
    updatedAt: now,
  };

  projectStore.set(project.id, project);
  return project;
}

export function deleteProjectById(id: string): boolean {
  ensureSeedData();
  return projectStore.delete(id);
}
