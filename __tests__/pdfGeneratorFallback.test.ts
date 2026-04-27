import { describe, expect, it } from "vitest";
import { fixtureProjects } from "../lib/projects/fixtures";
import { buildFallbackPdf } from "../lib/pdf/generator";

describe("fallback PDF generator", () => {
  it("includes all major response sections", () => {
    const pdf = buildFallbackPdf(fixtureProjects[0]);

    expect(pdf).toContain("PatternPal PDF Export");
    expect(pdf).toContain("Materials");
    expect(pdf).toContain("Assembly");
    expect(pdf).toContain("Finishing");
    expect(pdf).toContain("Step 1:");
  });

  it("spills long content across multiple pages", () => {
    const largeProject = {
      ...fixtureProjects[0],
      title: "Extremely long project title for pagination validation",
      description: "A very long description ".repeat(20),
      instructions: {
        ...fixtureProjects[0].instructions,
        materials: Array.from({ length: 90 }, (_, index) => `Material ${index + 1} with extra detail text for wrapping`),
        assembly: Array.from({ length: 30 }, (_, index) => ({
          step: index + 1,
          description: `Assembly step ${index + 1} with detailed sewing guidance text`,
          details: [
            `Detail A for step ${index + 1} with additional fitting notes`,
            `Detail B for step ${index + 1} with seam finishing guidance`,
          ],
        })),
        finishing: Array.from({ length: 30 }, (_, index) => `Finishing instruction ${index + 1}`),
      },
    };

    const pdf = buildFallbackPdf(largeProject);

    expect(pdf).toContain("/Type /Pages");
    expect(pdf).toMatch(/\/Count\s+[2-9]/);
  });
});
