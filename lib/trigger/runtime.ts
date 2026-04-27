function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function isTriggerWorkerEnabled(): boolean {
  return (
    parseBoolean(process.env.USE_TRIGGER_WORKER, false) &&
    Boolean(process.env.TRIGGER_API_URL?.trim() && process.env.TRIGGER_SECRET_KEY?.trim())
  );
}

export function getTriggerProjectRef(): string {
  return process.env.TRIGGER_PROJECT_REF?.trim() || "patternpal";
}