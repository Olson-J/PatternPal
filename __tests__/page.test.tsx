import { describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";

describe("Milestone 1 UX paths", () => {
  afterEach(() => {
    cleanup();
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
    await user.click(screen.getByRole("button", { name: "Generate mock guidance" }));

    expect(
      screen.getByText("Enter a garment description before generating guidance.")
    ).toBeInTheDocument();
  });

  it("shows and clears loading state on generate", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Generate mock guidance" }));

    expect(screen.getByRole("button", { name: "Generating mock guidance..." })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Generate mock guidance" })).toBeInTheDocument();
    });
  });

  it("updates results for professional stays selection", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByLabelText("Professional"));
    await user.click(screen.getByRole("button", { name: "Generate mock guidance" }));

    await waitFor(() => {
      expect(screen.getByText("professional mode")).toBeInTheDocument();
    });
    expect(screen.getByText(/historical accuracy and hand-sewing/i)).toBeInTheDocument();
  });

  it("applies preset examples and renders matching garment output", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /Simple shift dress/i }));

    expect(screen.getByText("Simple linen shift dress")).toBeInTheDocument();
    expect(screen.getByText("casual mode")).toBeInTheDocument();
  });
});
