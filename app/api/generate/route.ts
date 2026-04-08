import { generateInstructions } from "@/lib/instructions/generate";
import {
  isGuidanceMode,
  type GenerateInstructionsRequest,
} from "@/lib/instructions/schema";

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

function validateRequestBody(body: unknown): GenerateInstructionsRequest | null {
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

  return {
    description: candidate.description.trim(),
    mode: candidate.mode,
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
    return badRequest("Payload must include non-empty description and mode ('casual' or 'professional').");
  }

  try {
    const result = await generateInstructions(input);

    return Response.json({
      instructions: result.instructions,
      meta: {
        fromCache: result.fromCache,
        didFallback: result.didFallback,
        issues: result.issues,
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to generate instructions at this time." },
      { status: 500 }
    );
  }
}
