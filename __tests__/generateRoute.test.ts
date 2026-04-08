import { describe, expect, it } from "vitest";
import { POST } from "../app/api/generate/route";

describe("POST /api/generate", () => {
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
});
