import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../app/api/generation-jobs/route";
import { resetBackgroundJobs } from "../lib/jobs/queue";

describe("/api/generation-jobs route", () => {
  beforeEach(() => {
    resetBackgroundJobs();
    vi.useFakeTimers();
  });

  it("queues a generation job and reports progress over time", async () => {
    const request = new Request("http://localhost:3000/api/generation-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "18th-century stays", mode: "casual" }),
    });

    const response = await POST(request);
    const created = (await response.json()) as { job: { id: string; status: string } };

    expect(response.status).toBe(202);
    expect(created.job.status).toBe("queued");

    await vi.advanceTimersByTimeAsync(150);

    const queuedStatus = await GET();
    const queuedJson = (await queuedStatus.json()) as { jobs: Array<{ id: string; status: string }> };
    expect(queuedJson.jobs[0].status).toBe("running");

    await vi.advanceTimersByTimeAsync(500);

    const completedStatus = await GET();
    const completedJson = (await completedStatus.json()) as {
      jobs: Array<{ id: string; status: string; progress: number }>;
    };

    expect(completedJson.jobs[0].status).toBe("completed");
    expect(completedJson.jobs[0].progress).toBe(100);
  });

  it("marks simulated failures as failed jobs", async () => {
    const request = new Request("http://localhost:3000/api/generation-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "18th-century stays",
        mode: "professional",
        simulateFailure: true,
      }),
    });

    const response = await POST(request);
    const created = (await response.json()) as { job: { id: string } };

    await vi.advanceTimersByTimeAsync(700);

    const statusResponse = await GET();
    const statusJson = (await statusResponse.json()) as {
      jobs: Array<{ id: string; status: string; errorMessage?: string }>;
    };

    const failedJob = statusJson.jobs.find((job) => job.id === created.job.id);
    expect(failedJob?.status).toBe("failed");
    expect(failedJob?.errorMessage).toMatch(/Simulated worker failure/);
  });
});
