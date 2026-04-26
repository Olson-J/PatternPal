import { getProjectByIdForUser } from "@/lib/projects/repository";
import { isSupabaseAuthEnabled, resolveProjectUserIdFromRequest } from "@/lib/projects/user";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteParams): Promise<Response> {
  const { id } = await context.params;
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

  const project = await getProjectByIdForUser(id, userId);

  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  return Response.json({ project });
}
