import { getInstructionRuntimeConfig } from "./config";

type RateLimitEntry = {
  windowStartMs: number;
  count: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "anonymous";
}

export function resetGenerateRateLimitStore(): void {
  rateLimitStore.clear();
}

export function isGenerateRateLimited(request: Request, nowMs = Date.now()): boolean {
  const config = getInstructionRuntimeConfig();
  const key = getClientKey(request);
  const current = rateLimitStore.get(key);

  if (!current || nowMs - current.windowStartMs >= config.rateLimitWindowMs) {
    rateLimitStore.set(key, { windowStartMs: nowMs, count: 1 });
    return false;
  }

  if (current.count >= config.rateLimitMaxRequests) {
    return true;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return false;
}
