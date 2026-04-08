import {
  isGarmentInstructions,
  isGuidanceMode,
} from "@/lib/instructions/schema";
import { listProjects, saveProject } from "@/lib/projects/store";
import type { SaveProjectRequest } from "@/lib/projects/schema";

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

function validateSaveRequest(body: unknown): SaveProjectRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Record<string, unknown>;

  if (typeof candidate.description !== "string" || !candidate.description.trim()) {
    return null;
  }

  if (!isGuidanceMode(candidate.mode)) {
    return null;
  }

  if (!isGarmentInstructions(candidate.instructions)) {
    return null;
  }

  if (candidate.title !== undefined && typeof candidate.title !== "string") {
    return null;
  }

  return {
    title: candidate.title,
    description: candidate.description.trim(),
    mode: candidate.mode,
    instructions: candidate.instructions,
  };
}

export async function GET(): Promise<Response> {
  const projects = listProjects();
  return Response.json({ projects });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const input = validateSaveRequest(body);

  if (!input) {
    return badRequest(
      "Payload must include description, mode, and a valid instructions object."
    );
  }

  const project = saveProject(input);
  return Response.json({ project }, { status: 201 });
}
