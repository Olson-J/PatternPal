import { getPdfExportJob } from "@/lib/pdf/queue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const job = getPdfExportJob(id);

  if (!job) {
    return Response.json({ error: "Export job not found." }, { status: 404 });
  }

  return Response.json({ job });
}
