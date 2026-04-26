import { runs, tasks } from "@trigger.dev/sdk/v3";

import { generateInstructions } from "../instructions/generate";
import type { GarmentInstructions } from "../instructions/schema";
import { isTriggerWorkerEnabled } from "../trigger/runtime";
import { BACKGROUND_GENERATION_TASK_ID } from "./constants";
import type { BackgroundGenerationJob, BackgroundGenerationRequest } from "./schema";

const jobStore = new Map<string, BackgroundGenerationJob>();

type BackgroundGenerationTaskOutput = {
  instructions: GarmentInstructions;
  fromCache: boolean;
  didFallback: boolean;
  issues: string[];
};

type TriggerRunSnapshot = {
  id: string;
  status: string;
  isExecuting?: boolean;
  isCompleted?: boolean;
  isSuccess?: boolean;
  output?: unknown;
  error?: { message?: string };
  payload?: unknown;
};

function createJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneJob(job: BackgroundGenerationJob): BackgroundGenerationJob {
  return structuredClone(job);
}

function createBaseJob(id: string, request: BackgroundGenerationRequest): BackgroundGenerationJob {
  const now = new Date().toISOString();

  return {
    id,
    description: request.description.trim(),
    mode: request.mode,
    status: "queued",
    progress: 5,
    stage: "Queued for worker",
    createdAt: now,
    updatedAt: now,
    simulateFailure: request.simulateFailure,
  };
}

function updateJob(id: string, patch: Partial<BackgroundGenerationJob>): BackgroundGenerationJob | null {
  const current = jobStore.get(id);

  if (!current) {
    return null;
  }

  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  } satisfies BackgroundGenerationJob;

  jobStore.set(id, updated);
  return cloneJob(updated);
}

function isBackgroundGenerationTaskOutput(value: unknown): value is BackgroundGenerationTaskOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.instructions === "object" &&
    typeof candidate.fromCache === "boolean" &&
    typeof candidate.didFallback === "boolean" &&
    Array.isArray(candidate.issues)
  );
}

function mapTriggerRunToJob(jobId: string, run: TriggerRunSnapshot): BackgroundGenerationJob | null {
  const current = jobStore.get(jobId);
  const payload = run.payload as Partial<BackgroundGenerationRequest> | undefined;

  if (!current && !payload) {
    return null;
  }

  const base = current ?? createBaseJob(jobId, {
    description: payload?.description ?? "Unknown garment",
    mode: payload?.mode ?? "casual",
    simulateFailure: payload?.simulateFailure,
  });

  const status = run.isCompleted
    ? run.isSuccess
      ? "completed"
      : "failed"
    : run.isExecuting
      ? "running"
      : "queued";

  const updated: BackgroundGenerationJob = {
    ...base,
    triggerRunId: run.id,
    status,
    progress: run.isCompleted ? 100 : run.isExecuting ? 35 : 5,
    stage: run.isCompleted
      ? run.isSuccess
        ? "Completed"
        : "Failed"
      : run.isExecuting
        ? "Generating instructions"
        : "Queued for worker",
    updatedAt: new Date().toISOString(),
  };

  if (run.isCompleted) {
    if (run.isSuccess && isBackgroundGenerationTaskOutput(run.output)) {
      updated.instructions = run.output.instructions;
      updated.stage = run.output.didFallback ? "Completed with fallback repair" : "Completed";
      updated.errorMessage = undefined;
    } else {
      updated.errorMessage = run.error?.message ?? "Trigger.dev run failed.";
    }
  }

  jobStore.set(jobId, updated);
  return cloneJob(updated);
}

async function syncTriggerJob(jobId: string, attempts = 0): Promise<void> {
  const current = jobStore.get(jobId);

  if (!current || current.status === "completed" || current.status === "failed") {
    return;
  }

  if (!current.triggerRunId) {
    if (attempts > 120) {
      updateJob(jobId, {
        status: "failed",
        progress: 100,
        stage: "Failed",
        errorMessage: "Timed out waiting for Trigger.dev run to start.",
      });
      return;
    }

    setTimeout(() => {
      void syncTriggerJob(jobId, attempts + 1);
    }, 100);
    return;
  }

  try {
    const run = (await runs.retrieve(current.triggerRunId)) as TriggerRunSnapshot;
    const updated = mapTriggerRunToJob(jobId, run);

    if (!updated || updated.status === "completed" || updated.status === "failed") {
      return;
    }

    if (attempts > 120) {
      updateJob(jobId, {
        status: "failed",
        progress: 100,
        stage: "Failed",
        errorMessage: "Timed out waiting for Trigger.dev run.",
      });
      return;
    }

    setTimeout(() => {
      void syncTriggerJob(jobId, attempts + 1);
    }, 300);
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      progress: 100,
      stage: "Failed",
      errorMessage: error instanceof Error ? error.message : "Unable to load Trigger.dev job status.",
    });
  }
}

async function startTriggerBackgroundJob(jobId: string, request: BackgroundGenerationRequest): Promise<void> {
  try {
    const handle = await tasks.trigger(BACKGROUND_GENERATION_TASK_ID, request);
    updateJob(jobId, { triggerRunId: handle.id });
    void syncTriggerJob(jobId);
  } catch (error) {
    updateJob(jobId, {
      status: "failed",
      progress: 100,
      stage: "Failed",
      errorMessage: error instanceof Error ? error.message : "Unable to queue Trigger.dev job.",
    });
  }
}

async function executeLocalJob(jobId: string, request: BackgroundGenerationRequest): Promise<void> {
  updateJob(jobId, {
    status: "running",
    progress: 35,
    stage: "Generating instructions",
  });

  try {
    if (request.simulateFailure) {
      throw new Error("Simulated worker failure");
    }

    const result = await generateInstructions({
      description: request.description,
      mode: request.mode,
    });

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      stage: result.didFallback ? "Completed with fallback repair" : "Completed",
      instructions: result.instructions,
      errorMessage: undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker failure";

    updateJob(jobId, {
      status: "failed",
      progress: 100,
      stage: "Failed",
      errorMessage: message,
    });
  }
}

export function resetBackgroundJobs(): void {
  jobStore.clear();
}

export function getBackgroundJob(id: string): BackgroundGenerationJob | null {
  const job = jobStore.get(id);
  return job ? cloneJob(job) : null;
}

export async function getBackgroundJobSnapshot(id: string): Promise<BackgroundGenerationJob | null> {
  const current = jobStore.get(id);

  if (!current) {
    return null;
  }

  if (isTriggerWorkerEnabled() && current.triggerRunId) {
    try {
      const run = (await runs.retrieve(current.triggerRunId)) as TriggerRunSnapshot;
      const updated = mapTriggerRunToJob(id, run);
      return updated ? cloneJob(updated) : cloneJob(current);
    } catch {
      return cloneJob(current);
    }
  }

  return cloneJob(current);
}

export function listBackgroundJobs(): BackgroundGenerationJob[] {
  return [...jobStore.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(cloneJob);
}

export function enqueueBackgroundJob(request: BackgroundGenerationRequest): BackgroundGenerationJob {
  const job = createBaseJob(createJobId(), request);
  jobStore.set(job.id, job);

  if (isTriggerWorkerEnabled()) {
    void startTriggerBackgroundJob(job.id, request);
  } else {
    setTimeout(() => {
      updateJob(job.id, {
        status: "running",
        progress: 35,
        stage: "Generating instructions",
      });
    }, 120);

    setTimeout(() => {
      void executeLocalJob(job.id, request);
    }, 420);
  }

  return cloneJob(job);
}

export function formatJobInstructions(job: BackgroundGenerationJob): GarmentInstructions | null {
  return job.instructions ?? null;
}