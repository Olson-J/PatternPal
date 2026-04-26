import { enqueueBackgroundJob, listBackgroundJobs } from "../../../lib/jobs/trigger-queue";
import { isBackgroundGenerationRequest } from "../../../lib/jobs/schema";

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export async function GET(): Promise<Response> {
  const jobs = listBackgroundJobs();
  return Response.json({ jobs });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!isBackgroundGenerationRequest(body)) {
    return badRequest("Payload must include description and mode, with an optional simulateFailure flag.");
  }

  const job = enqueueBackgroundJob(body);
  return Response.json({ job }, { status: 202 });
}
