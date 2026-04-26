import {
  isGarmentInstructions,
  isGuidanceMode,
} from "@/lib/instructions/schema";
import { listProjectsForUser, saveProjectForUser } from "@/lib/projects/repository";
import type { SaveProjectRequest } from "@/lib/projects/schema";
import { isSupabaseAuthEnabled, resolveProjectUserIdFromRequest } from "@/lib/projects/user";

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

function unauthorized(message: string): Response {
  return Response.json({ error: message }, { status: 401 });
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

export async function GET(request: Request): Promise<Response> {
  const userId = await resolveProjectUserIdFromRequest(request);

  if (!userId) {
    return unauthorized(
      isSupabaseAuthEnabled()
        ? "Authentication required. Include a valid Supabase access token."
        : "Unable to resolve project user."
    );
  }

  const projects = await listProjectsForUser(userId);
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

  const userId = await resolveProjectUserIdFromRequest(request);

  if (!userId) {
    return unauthorized(
      isSupabaseAuthEnabled()
        ? "Authentication required. Include a valid Supabase access token."
        : "Unable to resolve project user."
    );
  }

  const project = await saveProjectForUser({ ...input, userId });
  return Response.json({ project }, { status: 201 });
}
