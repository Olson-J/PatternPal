import { getInstructionRuntimeConfig } from "@/lib/instructions/config";

export async function GET(): Promise<Response> {
  const config = getInstructionRuntimeConfig();

  return Response.json({
    mode: config.useRealLlm ? "live" : "mock",
    useRealLlm: config.useRealLlm,
  });
}
