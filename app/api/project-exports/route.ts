import { enqueuePdfExport } from "@/lib/pdf/queue";
import type { PdfExportRequest } from "@/lib/pdf/schema";

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

function validateRequestBody(body: unknown): PdfExportRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Record<string, unknown>;

  if (typeof candidate.projectId !== "string" || !candidate.projectId.trim()) {
    return null;
  }

  if (candidate.simulateFailure !== undefined && typeof candidate.simulateFailure !== "boolean") {
    return null;
  }

  return {
    projectId: candidate.projectId.trim(),
    simulateFailure: candidate.simulateFailure as boolean | undefined,
  };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const input = validateRequestBody(body);

  if (!input) {
    return badRequest("Payload must include a projectId and optional simulateFailure flag.");
  }

  const job = enqueuePdfExport(input);
  return Response.json({ job }, { status: 202 });
}
