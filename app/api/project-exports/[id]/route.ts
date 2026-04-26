import { getPdfExportJobSnapshot } from "@/lib/pdf/trigger-queue";
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

  if (!job || job.userId !== userId) {
    return Response.json({ error: "Export job not found." }, { status: 404 });
  }

  return Response.json({ job });
}
