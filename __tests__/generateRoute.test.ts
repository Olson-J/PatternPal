import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/generate/route";
import { resetGenerateRateLimitStore } from "../lib/instructions/rateLimit";

describe("POST /api/generate", () => {
  beforeEach(() => {
    resetGenerateRateLimitStore();
    vi.unstubAllEnvs();
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "", mode: "casual" }),
    });

    const response = await POST(request);
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/Payload must include/i);
  });

  it("returns normalized instructions and metadata for valid payload", async () => {
    const request = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "18th-century stays", mode: "professional" }),
    });

    const response = await POST(request);
    const json = (await response.json()) as {
      instructions: { garment: string; mode: string; materials: string[] };
      meta: { fromCache: boolean; didFallback: boolean; issues: string[] };
    };

    expect(response.status).toBe(200);
    expect(json.instructions.garment).toBeDefined();
    expect(json.instructions.mode).toBe("professional");
    expect(json.instructions.materials.length).toBeGreaterThan(0);
    expect(Array.isArray(json.meta.issues)).toBe(true);
  });

  it("returns 429 when per-window rate limit is exceeded", async () => {
    vi.stubEnv("GENERATION_RATE_LIMIT_WINDOW_MS", "60000");
    vi.stubEnv("GENERATION_RATE_LIMIT_MAX_REQUESTS", "1");

    const body = JSON.stringify({ description: "18th-century stays", mode: "professional" });
    const firstRequest = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const secondRequest = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const firstResponse = await POST(firstRequest);
    expect(firstResponse.status).toBe(200);

    const secondResponse = await POST(secondRequest);
    const secondJson = (await secondResponse.json()) as { error: string };

    expect(secondResponse.status).toBe(429);
    expect(secondJson.error).toMatch(/Rate limit exceeded/i);
  });
});
