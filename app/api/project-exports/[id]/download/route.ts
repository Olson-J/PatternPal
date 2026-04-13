import { getPdfExportJob, getPdfExportDownloadBuffer } from "@/lib/pdf/queue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const job = getPdfExportJob(id);

  if (!job || job.status !== "completed" || !job.storagePath) {
    return Response.json({ error: "Export not ready." }, { status: 404 });
  }

  const buffer = getPdfExportDownloadBuffer(job.storagePath);

  if (!buffer) {
    return Response.json({ error: "Stored PDF missing." }, { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${job.fileName ?? "patternpal-export.pdf"}"`,
    },
  });
}
