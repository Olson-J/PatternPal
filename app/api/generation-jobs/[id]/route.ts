import { getBackgroundJobSnapshot } from "@/lib/jobs/trigger-queue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const job = await getBackgroundJobSnapshot(id);

  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json({ job });
}
