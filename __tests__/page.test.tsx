import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";
import { mockCasualStays, mockProfessionalStays } from "./fixtures/garmentInstructions";

const scrollIntoViewMock = vi.fn();

function createJsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Milestone 1 UX paths", () => {
  beforeEach(() => {
    scrollIntoViewMock.mockReset();
    vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(scrollIntoViewMock);

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/config")) {
        return createJsonResponse(200, { mode: "live" });
      }

      if (url.includes("/api/generate")) {
        const payload = init?.body ? (JSON.parse(String(init.body)) as { mode?: string }) : {};
        const selected = payload.mode === "professional" ? mockProfessionalStays : mockCasualStays;
        return createJsonResponse(200, {
          instructions: {
            ...selected,
            mode: payload.mode === "professional" ? "professional" : "casual",
            generatedAt: new Date().toISOString(),
          },
          meta: { fromCache: false, didFallback: false, issues: [] },
        });
      }

      if (url.includes("/api/projects")) {
        return createJsonResponse(201, { project: { id: "proj-test-1" } });
      }

      throw new Error(`Unmocked URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders structured results sections from mock data", () => {
    render(<Home />);

    expect(screen.getByText("Structured results")).toBeInTheDocument();
    expect(screen.getByText("Materials")).toBeInTheDocument();
    expect(screen.getByText("Assembly")).toBeInTheDocument();
    expect(screen.getByText("Finishing")).toBeInTheDocument();
  });

  it("shows a validation error for empty garment descriptions", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const descriptionInput = screen.getByLabelText("Garment description");
    await user.clear(descriptionInput);
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(
      screen.getByText("Enter a garment description before generating guidance.")
    ).toBeInTheDocument();
  });

  it("shows and clears loading state on generate", async () => {
    const delayedFetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/config")) {
        return createJsonResponse(200, { mode: "live" });
      }

      if (url.includes("/api/generate")) {
        const payload = init?.body ? (JSON.parse(String(init.body)) as { mode?: string }) : {};
        const selected = payload.mode === "professional" ? mockProfessionalStays : mockCasualStays;

        await new Promise((resolve) => setTimeout(resolve, 40));

        return createJsonResponse(200, {
          instructions: {
            ...selected,
            mode: payload.mode === "professional" ? "professional" : "casual",
            generatedAt: new Date().toISOString(),
          },
          meta: { fromCache: false, didFallback: false, issues: [] },
        });
      }

      if (url.includes("/api/projects")) {
        return createJsonResponse(201, { project: { id: "proj-test-1" } });
      }

      throw new Error(`Unmocked URL: ${url}`);
    });

    vi.stubGlobal("fetch", delayedFetchMock);

    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(screen.getByRole("button", { name: "Generating guidance..." })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Generate" })).toBeInTheDocument();
    });
  });

  it("updates results for professional stays selection", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByLabelText("Professional"));
    await user.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(screen.getByText("professional mode")).toBeInTheDocument();
    });
    expect(screen.getByText(/historical accuracy and hand-sewing/i)).toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("applies preset examples and renders matching garment output", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /Simple shift dress/i }));

    expect(screen.getByText("Simple linen shift dress")).toBeInTheDocument();
    expect(screen.getByText("casual mode")).toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("saves generated results from the results section", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save result" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Save result" }));

    await waitFor(() => {
      expect(screen.getByText("Saved to project history.")).toBeInTheDocument();
    });
  });
});
