import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

type MockJob = {
  id: string;
  description: string;
  mode: "casual" | "professional";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stage: string;
  errorMessage?: string;
  instructions?: {
    garment: string;
    mode: "casual" | "professional";
    materials: string[];
    assembly: Array<{ step: number; description: string }>;
    finishing: string[];
    notes?: string;
    generatedAt: string;
  };
};

const jobStore = new Map<string, MockJob>();

vi.mock("@/lib/jobs/queue", () => {
  return {
    enqueueBackgroundJob: vi.fn((request: {
      description: string;
      mode: "casual" | "professional";
      simulateFailure?: boolean;
    }) => {
      const job: MockJob = {
        id: `job-${jobStore.size + 1}`,
        description: request.description,
        mode: request.mode,
        status: "queued",
        progress: 5,
        stage: "Queued for worker",
      };

      if (request.simulateFailure) {
        jobStore.set(job.id, {
          ...job,
          status: "failed",
          progress: 100,
          stage: "Failed",
          errorMessage: "Simulated worker failure",
        });
      } else {
        jobStore.set(job.id, {
          ...job,
          status: "completed",
          progress: 100,
          stage: "Completed",
          instructions: {
            garment: request.description,
            mode: request.mode,
            materials: ["Linen", "Thread"],
            assembly: [{ step: 1, description: "Cut panels" }],
            finishing: ["Press seams"],
            generatedAt: "2026-04-08T00:00:00.000Z",
          },
        });
      }

      return job;
    }),
    getBackgroundJob: vi.fn((id: string) => jobStore.get(id) ?? null),
  };
});

import { BackgroundJobDemo } from "../app/components/background-job-demo";

describe("BackgroundJobDemo", () => {
  afterEach(() => {
    cleanup();
    jobStore.clear();
  });

  it("shows completed state for a successful job", () => {
    render(<BackgroundJobDemo description="18th-century stays" mode="casual" />);

    fireEvent.click(screen.getByRole("button", { name: "Start background job" }));

    expect(screen.getByText("COMPLETED · Completed")).toBeInTheDocument();
    expect(screen.getByText("18th-century stays")).toBeInTheDocument();
  });

  it("shows failed state and allows retry", () => {
    render(<BackgroundJobDemo description="18th-century stays" mode="professional" />);

    fireEvent.click(screen.getByRole("checkbox", { name: /simulate failure/i }));
    fireEvent.click(screen.getByRole("button", { name: "Start background job" }));

    expect(screen.getByText(/Job failed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry job" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry job" }));

    expect(screen.getByText("COMPLETED · Completed")).toBeInTheDocument();
  });
});
