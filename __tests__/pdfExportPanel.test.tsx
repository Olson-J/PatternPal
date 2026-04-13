import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PdfExportPanel } from "../app/components/pdf-export-panel";

const queuedJob = {
  id: "pdf-1",
  status: "queued" as const,
  progress: 5,
  stage: "Queued for PDF worker",
};

function installFetchMock(mode: "success" | "failure") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? (typeof input !== "string" && "method" in input ? input.method : "GET");

      if (url.endsWith("/api/project-exports") && method === "POST") {
        const job =
          mode === "failure"
            ? { ...queuedJob, status: "failed", progress: 100, stage: "Failed", errorMessage: "Simulated PDF worker failure" }
            : { ...queuedJob, status: "completed", progress: 100, stage: "Completed", fileName: "sample.pdf", storagePath: "exports/pdf-1/sample.pdf" };

        return new Response(JSON.stringify({ job }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/project-exports/pdf-1") && method === "GET") {
        const job =
          mode === "failure"
            ? { ...queuedJob, status: "failed", progress: 100, stage: "Failed", errorMessage: "Simulated PDF worker failure" }
            : { ...queuedJob, status: "completed", progress: 100, stage: "Completed", fileName: "sample.pdf", storagePath: "exports/pdf-1/sample.pdf" };

        return new Response(JSON.stringify({ job }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unhandled fetch call: ${method} ${url}`);
    })
  );
}

describe("PdfExportPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders a download link for completed exports", async () => {
    installFetchMock("success");
    render(<PdfExportPanel projectId="proj-stays-casual" projectTitle="Weekend Stays Build" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));
      await Promise.resolve();
    });

    expect(screen.getByText("COMPLETED · Completed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download pdf/i })).toHaveAttribute(
      "href",
      "/api/project-exports/pdf-1/download"
    );
  });

  it("shows retry path for failed exports", async () => {
    installFetchMock("failure");
    render(<PdfExportPanel projectId="proj-stays-casual" projectTitle="Weekend Stays Build" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: /simulate export failure/i }));
      fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));
      await Promise.resolve();
    });

    expect(screen.getByText(/Export failed/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /download pdf/i })).not.toBeInTheDocument();
  });
});
