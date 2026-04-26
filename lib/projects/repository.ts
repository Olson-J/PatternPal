import { getProjectById, listProjects, saveProject } from "./store";
import type { ProjectRecord, ProjectSummary, SaveProjectInput } from "./schema";

type SupabaseProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  mode: "casual" | "professional";
  created_at: string;
  updated_at: string;
};

type SupabaseInstructionRow = {
  project_id: string;
  garment: string;
  materials: string[];
  assembly: Array<{ step: number; description: string; details?: string[] }>;
  finishing: string[];
  notes: string | null;
  generated_at: string;
};

function sanitizeEnvValue(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

const supabaseUrl = sanitizeEnvValue(process.env.SUPABASE_URL);
const supabaseServiceRoleKey = sanitizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

function isSupabaseEnabled(): boolean {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function createSupabaseHeaders(prefer?: string): HeadersInit {
  const headers: Record<string, string> = {
    apikey: supabaseServiceRoleKey,
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

async function supabaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, init);

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${details}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();

  if (!raw.trim()) {
    return undefined as T;
  }

  return JSON.parse(raw) as T;
}

function toProjectSummaryFromRow(row: SupabaseProjectRow): ProjectSummary {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    mode: row.mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProjectRecordFromRows(row: SupabaseProjectRow, instruction: SupabaseInstructionRow): ProjectRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    mode: row.mode,
    instructions: {
      garment: instruction.garment,
      mode: row.mode,
      materials: instruction.materials,
      assembly: instruction.assembly,
      finishing: instruction.finishing,
      notes: instruction.notes ?? undefined,
      generatedAt: instruction.generated_at,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureSupabaseUser(userId: string): Promise<void> {
  const email = `${userId}@patternpal.local`;

  await supabaseRequest<unknown>("users?on_conflict=id", {
    method: "POST",
    headers: createSupabaseHeaders("resolution=merge-duplicates,return=minimal"),
    body: JSON.stringify({
      id: userId,
      email,
      display_name: "PatternPal User",
    }),
  });
}

async function listProjectsFromSupabase(userId: string): Promise<ProjectSummary[]> {
  const path = `projects?select=id,user_id,title,description,mode,created_at,updated_at&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`;
  const rows = await supabaseRequest<SupabaseProjectRow[]>(path, {
    method: "GET",
    headers: createSupabaseHeaders(),
    cache: "no-store",
  });

  return rows.map(toProjectSummaryFromRow);
}

async function getProjectByIdFromSupabase(id: string, userId: string): Promise<ProjectRecord | null> {
  const projectPath = `projects?select=id,user_id,title,description,mode,created_at,updated_at&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`;
  const projects = await supabaseRequest<SupabaseProjectRow[]>(projectPath, {
    method: "GET",
    headers: createSupabaseHeaders(),
    cache: "no-store",
  });

  if (projects.length === 0) {
    return null;
  }

  const project = projects[0];
  const instructionsPath = `instructions?select=project_id,garment,materials,assembly,finishing,notes,generated_at&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=1`;
  const instructions = await supabaseRequest<SupabaseInstructionRow[]>(instructionsPath, {
    method: "GET",
    headers: createSupabaseHeaders(),
    cache: "no-store",
  });

  if (instructions.length === 0) {
    return null;
  }

  return toProjectRecordFromRows(project, instructions[0]);
}

async function saveProjectToSupabase(input: SaveProjectInput): Promise<ProjectRecord> {
  const userId = input.userId ?? "00000000-0000-0000-0000-000000000001";
  await ensureSupabaseUser(userId);

  const title = input.title?.trim() || input.instructions.garment || input.description.trim();

  const projectRows = await supabaseRequest<SupabaseProjectRow[]>("projects?select=id,user_id,title,description,mode,created_at,updated_at", {
    method: "POST",
    headers: createSupabaseHeaders("return=representation"),
    body: JSON.stringify({
      user_id: userId,
      title,
      description: input.description.trim(),
      mode: input.mode,
    }),
  });

  const project = projectRows[0];

  await supabaseRequest<unknown>("instructions", {
    method: "POST",
    headers: createSupabaseHeaders("return=minimal"),
    body: JSON.stringify({
      project_id: project.id,
      garment: input.instructions.garment,
      materials: input.instructions.materials,
      assembly: input.instructions.assembly,
      finishing: input.instructions.finishing,
      notes: input.instructions.notes ?? null,
      generated_at: input.instructions.generatedAt,
    }),
  });

  return {
    id: project.id,
    userId: project.user_id,
    title: project.title,
    description: project.description,
    mode: project.mode,
    instructions: input.instructions,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

export async function listProjectsForUser(userId: string): Promise<ProjectSummary[]> {
  if (!isSupabaseEnabled()) {
    return listProjects();
  }

  try {
    return listProjectsFromSupabase(userId);
  } catch {
    return listProjects();
  }
}

export async function getProjectByIdForUser(id: string, userId: string): Promise<ProjectRecord | null> {
  if (!isSupabaseEnabled()) {
    return getProjectById(id);
  }

  try {
    return getProjectByIdFromSupabase(id, userId);
  } catch {
    return getProjectById(id);
  }
}

export async function saveProjectForUser(input: SaveProjectInput): Promise<ProjectRecord> {
  if (!isSupabaseEnabled()) {
    return saveProject(input);
  }

  try {
    return saveProjectToSupabase(input);
  } catch {
    return saveProject(input);
  }
}
