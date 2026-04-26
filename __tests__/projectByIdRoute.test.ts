import { beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET } from "../app/api/projects/[id]/route";
import { resetProjectStore } from "../lib/projects/store";

describe("/api/projects/[id] route", () => {
  beforeEach(() => {
    resetProjectStore();
  });

  it("returns a seeded project by id", async () => {
    const response = await GET(new Request("http://localhost:3000/api/projects/proj-stays-casual"), {
      params: Promise.resolve({ id: "proj-stays-casual" }),
    });

    const json = (await response.json()) as {
      project: { id: string; title: string; instructions: { garment: string } };
    };

    expect(response.status).toBe(200);
    expect(json.project.id).toBe("proj-stays-casual");
    expect(json.project.instructions.garment).toBeDefined();
  });

  it("returns 404 for unknown ids", async () => {
    const response = await GET(new Request("http://localhost:3000/api/projects/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("deletes a seeded project by id", async () => {
    const deleteResponse = await DELETE(new Request("http://localhost:3000/api/projects/proj-stays-casual", {
      method: "DELETE",
    }), {
      params: Promise.resolve({ id: "proj-stays-casual" }),
    });

    expect(deleteResponse.status).toBe(204);

    const getResponse = await GET(new Request("http://localhost:3000/api/projects/proj-stays-casual"), {
      params: Promise.resolve({ id: "proj-stays-casual" }),
    });

    expect(getResponse.status).toBe(404);
  });

  it("returns 404 when deleting unknown ids", async () => {
    const response = await DELETE(new Request("http://localhost:3000/api/projects/missing", {
      method: "DELETE",
    }), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });
});
