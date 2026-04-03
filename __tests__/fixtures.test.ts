/**
 * Sample test demonstrating mock-first testing approach.
 * This test uses fixture data instead of real API calls.
 * Replace this with actual test files as you build the app.
 */

import { describe, it, expect } from "vitest";
import {
  mockCasualStays,
  mockProfessionalStays,
  createMockInstructions,
} from "./fixtures/garmentInstructions";
import { assertValidInstructions } from "./testUtils";

describe("Mock API Fixtures", () => {
  it("provides valid casual mode instructions", () => {
    expect(() => assertValidInstructions(mockCasualStays)).not.toThrow();
    expect(mockCasualStays.mode).toBe("casual");
    expect(mockCasualStays.materials.length).toBeGreaterThan(0);
    expect(mockCasualStays.assembly.length).toBeGreaterThan(0);
    expect(mockCasualStays.finishing.length).toBeGreaterThan(0);
  });

  it("provides valid professional mode instructions", () => {
    expect(() => assertValidInstructions(mockProfessionalStays)).not.toThrow();
    expect(mockProfessionalStays.mode).toBe("professional");
    expect(mockProfessionalStays.assembly.length).toBeGreaterThan(
      mockCasualStays.assembly.length
    );
  });

  it("factory function creates valid custom instructions", () => {
    const custom = createMockInstructions({
      garment: "Custom test garment",
      mode: "professional",
    });

    expect(() => assertValidInstructions(custom)).not.toThrow();
    expect(custom.garment).toBe("Custom test garment");
    expect(custom.mode).toBe("professional");
  });

  it("assembly steps have correct structure", () => {
    const steps = mockCasualStays.assembly;
    expect(steps[0].step).toBe(1);
    expect(typeof steps[0].description).toBe("string");
  });

  it("instructions include a generation timestamp", () => {
    expect(mockCasualStays.generatedAt).toBeDefined();
    expect(new Date(mockCasualStays.generatedAt)).toBeInstanceOf(Date);
  });
});
