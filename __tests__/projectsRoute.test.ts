import { beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "../app/api/projects/route";
import { fixtureProjects } from "../lib/projects/fixtures";
import { resetProjectStore } from "../lib/projects/store";

const sampleInstructions = fixtureProjects[0].instructions;

describe("/api/projects route", () => {
  beforeEach(() => {
    resetProjectStore();
  });

  it("lists seeded fixture projects", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      projects: Array<{ id: string; title: string }>;
    };

    expect(response.status).toBe(200);
    expect(json.projects.length).toBeGreaterThanOrEqual(2);
    expect(json.projects.some((project) => project.id === "proj-stays-casual")).toBe(true);
  });

  it("rejects invalid save payloads", async () => {
    const request = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "", mode: "casual" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("saves a valid project", async () => {
    const request = new Request("http://localhost:3000/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "New saved project",
        description: "Test project from route test",
        mode: "casual",
        instructions: sampleInstructions,
      }),
    });

    const response = await POST(request);
    const json = (await response.json()) as {
      project: { id: string; title: string; description: string };
    };

    expect(response.status).toBe(201);
    expect(json.project.id).toContain("proj-");
    expect(json.project.title).toBe("New saved project");
  });
});
