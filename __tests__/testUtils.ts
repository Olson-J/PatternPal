/**
 * Test utilities for mocking API responses and managing test state.
 * Use these helper functions in tests to avoid coupling tests to real API calls.
 */

import { GarmentInstructions } from "./fixtures/garmentInstructions";

/**
 * Mock fetch responses for tests.
 * Intercepts fetch calls during testing and returns fixture data.
 */
export function setupMockFetch(
  responsePath: string,
  responseData: GarmentInstructions
): void {
  if (typeof global !== "undefined") {
    global.fetch = async (...args) => {
      const [url] = args as [string];
      if (url.includes(responsePath)) {
        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unmocked URL: ${url}`);
    };
  }
}

/**
 * Create a mock API response factory.
 * Use this to generate test responses with known properties.
 */
export function createMockResponse(
  status: number = 200,
  data: Record<string, unknown> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Assert that a response contains expected fields.
 * Helps validate API response shape in tests.
 */
export function assertValidInstructions(
  data: unknown
): asserts data is GarmentInstructions {
  if (!data || typeof data !== "object") {
    throw new Error("Response must be an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.garment !== "string") {
    throw new Error("Response missing or invalid garment field");
  }

  if (!["casual", "professional"].includes(obj.mode as string)) {
    throw new Error("Response mode must be 'casual' or 'professional'");
  }

  if (!Array.isArray(obj.materials)) {
    throw new Error("Response materials must be an array");
  }

  if (!Array.isArray(obj.assembly)) {
    throw new Error("Response assembly must be an array");
  }

  if (!Array.isArray(obj.finishing)) {
    throw new Error("Response finishing must be an array");
  }
}
