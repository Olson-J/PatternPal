import { generateInstructions } from "../instructions/generate";
import type { GarmentInstructions } from "../instructions/schema";
import type { BackgroundGenerationJob, BackgroundGenerationRequest } from "./schema";

const jobStore = new Map<string, BackgroundGenerationJob>();

function createJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneJob(job: BackgroundGenerationJob): BackgroundGenerationJob {
  return structuredClone(job);
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

async function executeJob(jobId: string, request: BackgroundGenerationRequest): Promise<void> {
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

export function listBackgroundJobs(): BackgroundGenerationJob[] {
  return [...jobStore.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(cloneJob);
}

export function enqueueBackgroundJob(request: BackgroundGenerationRequest): BackgroundGenerationJob {
  const now = new Date().toISOString();
  const job: BackgroundGenerationJob = {
    id: createJobId(),
    description: request.description.trim(),
    mode: request.mode,
    status: "queued",
    progress: 5,
    stage: "Queued for worker",
    createdAt: now,
    updatedAt: now,
    simulateFailure: request.simulateFailure,
  };

  jobStore.set(job.id, job);

  setTimeout(() => {
    updateJob(job.id, {
      status: "running",
      progress: 35,
      stage: "Generating instructions",
    });
  }, 120);

  setTimeout(() => {
    void executeJob(job.id, request);
  }, 420);

  return cloneJob(job);
}

export function formatJobInstructions(job: BackgroundGenerationJob): GarmentInstructions | null {
  return job.instructions ?? null;
}
