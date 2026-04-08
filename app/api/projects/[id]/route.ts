import { getProjectById } from "@/lib/projects/store";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteParams): Promise<Response> {
  const { id } = await context.params;
  const project = getProjectById(id);

  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  return Response.json({ project });
}
