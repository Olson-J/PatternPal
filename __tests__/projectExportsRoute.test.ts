import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureProjects } from "../lib/projects/fixtures";
import { resetPdfExports } from "../lib/pdf/queue";
import { resetPdfStorage } from "../lib/pdf/storage";

vi.mock("../lib/pdf/generator", () => ({
  generateProjectPdfBuffer: vi.fn(async () => Buffer.from("PDF_BUFFER")),
}));

import { POST as postProjectExport } from "../app/api/project-exports/route";
import { GET as getProjectExportStatus } from "../app/api/project-exports/[id]/route";
import { GET as downloadProjectExport } from "../app/api/project-exports/[id]/download/route";

describe("project PDF export routes", () => {
  beforeEach(() => {
    resetPdfExports();
    resetPdfStorage();
    vi.useFakeTimers();
  });

  it("queues and completes an export job", async () => {
    const response = await postProjectExport(
      new Request("http://localhost:3000/api/project-exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: fixtureProjects[0].id }),
      })
    );

    const created = (await response.json()) as { job: { id: string; status: string } };
    expect(response.status).toBe(202);
    expect(created.job.status).toBe("queued");

    await vi.advanceTimersByTimeAsync(700);

    const statusResponse = await getProjectExportStatus(new Request("http://localhost:3000/api/project-exports/job"), {
      params: Promise.resolve({ id: created.job.id }),
    });
    const status = (await statusResponse.json()) as {
      job: { status: string; storagePath?: string; fileName?: string };
    };

    expect(status.job.status).toBe("completed");
    expect(status.job.storagePath).toBeDefined();
    expect(status.job.fileName).toMatch(/patternpal-export|weekend-stays-build/i);

    const downloadResponse = await downloadProjectExport(
      new Request("http://localhost:3000/api/project-exports/job/download"),
      {
        params: Promise.resolve({ id: created.job.id }),
      }
    );

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers.get("Content-Type")).toBe("application/pdf");
    expect(await downloadResponse.text()).toContain("PDF_BUFFER");
  });

  it("returns 400 for invalid payloads", async () => {
    const response = await postProjectExport(
      new Request("http://localhost:3000/api/project-exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: "" }),
      })
    );

    expect(response.status).toBe(400);
  });
});
