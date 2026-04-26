import { getPdfExportDownloadBufferByJobId, getPdfExportJobSnapshot } from "@/lib/pdf/trigger-queue";
import { isSupabaseAuthEnabled, resolveProjectUserIdFromRequest } from "@/lib/projects/user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const userId = await resolveProjectUserIdFromRequest(request);

  if (!userId) {
    return Response.json(
      {
        error: isSupabaseAuthEnabled()
          ? "Authentication required. Include a valid Supabase access token."
          : "Unable to resolve project user.",
      },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const job = await getPdfExportJobSnapshot(id);

  if (!job || job.userId !== userId || job.status !== "completed") {
    return Response.json({ error: "Export not ready." }, { status: 404 });
  }

  const buffer = job.storagePath ? await getPdfExportDownloadBufferByJobId(job.id) : null;

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
