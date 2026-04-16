import { getInstructionRuntimeConfig } from "./config";
import type { GenerateInstructionsRequest } from "./schema";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const instructionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["garment", "mode", "materials", "assembly", "finishing", "notes"],
  properties: {
    garment: { type: "string" },
    mode: { type: "string", enum: ["casual", "professional"] },
    materials: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    assembly: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["step", "description", "details"],
        properties: {
          step: { type: "integer", minimum: 1 },
          description: { type: "string" },
          details: {
            type: "array",
            items: { type: "string" },
            minItems: 0,
          },
        },
      },
    },
    finishing: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    notes: { type: "string" },
  },
} as const;

function extractOutputText(payload: OpenAiResponse): string {
  // Try direct output_text field first (Responses API v1)
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  // Try output segments (alternative response format)
  if (Array.isArray(payload.output) && payload.output.length > 0) {
    for (const segment of payload.output) {
      if (Array.isArray(segment.content)) {
        for (const content of segment.content) {
          if (typeof content.text === "string" && content.text.trim()) {
            return content.text.trim();
          }
        }
      }
    }
  }

  // If we got here, log what we actually received for debugging
  const responseKeys = Object.keys(payload).join(", ");
  const debugInfo = `Response keys: ${responseKeys}. Full response: ${JSON.stringify(payload).slice(0, 500)}`;
  throw new Error(`OpenAI response did not include text output. ${debugInfo}`);
}

function stripCodeFences(value: string): string {
  const trimmed = value.trim();

  // Remove markdown code fences
  if (trimmed.startsWith("```")) {
    const withoutOpening = trimmed.replace(/^```(?:json)?\s*/i, "");
    const withoutClosing = withoutOpening.replace(/\s*```$/, "").trim();
    return withoutClosing;
  }

  return trimmed;
}

function normalizeModelJsonText(text: string): string {
  let candidate = stripCodeFences(text);

  // Try parse directly
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object") {
      return JSON.stringify(parsed);
    }
  } catch {
    // Fall through to next strategy
  }

  // Try one more level of unwrapping if it's a string containing JSON
  if (candidate.startsWith('"') && candidate.endsWith('"')) {
    try {
      const unquoted = JSON.parse(candidate) as string;
      const reparsed = JSON.parse(unquoted);
      if (reparsed && typeof reparsed === "object") {
        return JSON.stringify(reparsed);
      }
    } catch {
      // Fall through
    }
  }

  return candidate;
}

export async function generateOpenAiInstructionResponse(
  prompt: string,
  _input: GenerateInstructionsRequest
): Promise<string> {
  const config = getInstructionRuntimeConfig();

  if (!config.apiKey) {
    throw new Error("OPENAI_API_KEY is required when USE_REAL_LLM=true.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1, config.timeoutMs));

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        input: prompt,
        temperature: config.temperature,
        max_output_tokens: config.maxOutputTokens,
        text: {
          format: {
            type: "json_schema",
            name: "patternpal_instructions",
            strict: true,
            schema: instructionSchema,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenAI request failed with status ${response.status}: ${details}`);
    }

    const payload = (await response.json()) as OpenAiResponse;
    return normalizeModelJsonText(extractOutputText(payload));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`OpenAI request timed out after ${config.timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
