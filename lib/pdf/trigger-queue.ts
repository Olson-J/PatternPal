import { runs, tasks } from "@trigger.dev/sdk/v3";

import { generateProjectPdfBuffer } from "./generator";
import { getPdfRecord, storePdfRecord } from "./storage";
import type { PdfExportJob, PdfExportRequest } from "./schema";
import { getProjectByIdForUser } from "../projects/repository";
import { isTriggerWorkerEnabled } from "../trigger/runtime";
import { PDF_EXPORT_TASK_ID } from "./constants";

declare global {
  // eslint-disable-next-line no-var
  var __patternpalPdfExportJobs: Map<string, PdfExportJob> | undefined;
}

const exportJobs = globalThis.__patternpalPdfExportJobs ?? new Map<string, PdfExportJob>();

if (!globalThis.__patternpalPdfExportJobs) {
  globalThis.__patternpalPdfExportJobs = exportJobs;
}

type PdfExportTaskOutput = {
  fileName: string;
  storagePath: string;
  pdfBase64: string;
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

function createExportJobId(): string {
  return `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneJob(job: PdfExportJob): PdfExportJob {
  return structuredClone(job);
}

function buildFileName(title: string): string {
  return `${title.replaceAll(/[^a-z0-9]+/gi, "-").replaceAll(/^-+|-+$/g, "").toLowerCase() || "patternpal-export"}.pdf`;
}

function createBaseJob(id: string, request: PdfExportRequest): PdfExportJob {
  const now = new Date().toISOString();

  return {
    id,
    projectId: request.projectId,
    userId: request.userId,
    status: "queued",
    progress: 5,
    stage: "Queued for PDF worker",
    createdAt: now,
    updatedAt: now,
  };
}

function updateExportJob(id: string, patch: Partial<PdfExportJob>): PdfExportJob | null {
  const current = exportJobs.get(id);

  if (!current) {
    return null;
  }

  const updated: PdfExportJob = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  exportJobs.set(id, updated);
  return cloneJob(updated);
}

function isPdfExportTaskOutput(value: unknown): value is PdfExportTaskOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.fileName === "string" &&
    typeof candidate.storagePath === "string" &&
    typeof candidate.pdfBase64 === "string"
  );
}

function mapTriggerRunToJob(jobId: string, run: TriggerRunSnapshot): PdfExportJob | null {
  const current = exportJobs.get(jobId);
  const payload = run.payload as Partial<PdfExportRequest> | undefined;

  if (!current && !payload) {
    return null;
  }

  const base = current ?? createBaseJob(jobId, {
    projectId: payload?.projectId ?? "",
    userId: payload?.userId ?? "",
    simulateFailure: payload?.simulateFailure,
  });

  const status = run.isCompleted
    ? run.isSuccess
      ? "completed"
      : "failed"
    : run.isExecuting
      ? "running"
      : "queued";

  const updated: PdfExportJob = {
    ...base,
    triggerRunId: run.id,
    status,
    progress: run.isCompleted ? 100 : run.isExecuting ? 35 : 5,
    stage: run.isCompleted
      ? run.isSuccess
        ? "Completed"
        : "Failed"
      : run.isExecuting
        ? "Rendering printable HTML"
        : "Queued for PDF worker",
    updatedAt: new Date().toISOString(),
  };

  if (run.isCompleted) {
    if (run.isSuccess && isPdfExportTaskOutput(run.output)) {
      const buffer = Buffer.from(run.output.pdfBase64, "base64");
      storePdfRecord({
        path: run.output.storagePath,
        fileName: run.output.fileName,
        contentType: "application/pdf",
        buffer,
        createdAt: new Date().toISOString(),
      });

      updated.storagePath = run.output.storagePath;
      updated.fileName = run.output.fileName;
      updated.errorMessage = undefined;
    } else {
      updated.errorMessage = run.error?.message ?? "Trigger.dev run failed.";
    }
  }

  exportJobs.set(jobId, updated);
  return cloneJob(updated);
}

async function syncTriggerPdfJob(jobId: string, attempts = 0): Promise<void> {
  const current = exportJobs.get(jobId);

  if (!current || current.status === "completed" || current.status === "failed") {
    return;
  }

  if (!current.triggerRunId) {
    if (attempts > 120) {
      updateExportJob(jobId, {
        status: "failed",
        progress: 100,
        stage: "Failed",
        errorMessage: "Timed out waiting for Trigger.dev run to start.",
      });
      return;
    }

    setTimeout(() => {
      void syncTriggerPdfJob(jobId, attempts + 1);
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
      updateExportJob(jobId, {
        status: "failed",
        progress: 100,
        stage: "Failed",
        errorMessage: "Timed out waiting for Trigger.dev run.",
      });
      return;
    }

    setTimeout(() => {
      void syncTriggerPdfJob(jobId, attempts + 1);
    }, 300);
  } catch (error) {
    updateExportJob(jobId, {
      status: "failed",
      progress: 100,
      stage: "Failed",
      errorMessage: error instanceof Error ? error.message : "Unable to load Trigger.dev export status.",
    });
  }
}

async function startTriggerPdfExport(jobId: string, request: PdfExportRequest): Promise<void> {
  try {
    const handle = await tasks.trigger(PDF_EXPORT_TASK_ID, request);
    updateExportJob(jobId, { triggerRunId: handle.id });
    void syncTriggerPdfJob(jobId);
  } catch (error) {
    updateExportJob(jobId, {
      status: "failed",
      progress: 100,
      stage: "Failed",
      errorMessage: error instanceof Error ? error.message : "Unable to queue Trigger.dev export.",
    });
  }
}

async function executeLocalExport(jobId: string, request: PdfExportRequest): Promise<void> {
  updateExportJob(jobId, {
    status: "running",
    progress: 35,
    stage: "Rendering printable HTML",
  });

  try {
    const project = await getProjectByIdForUser(request.projectId, request.userId);

    if (!project) {
      throw new Error("Project not found.");
    }

    if (request.simulateFailure) {
      throw new Error("Simulated PDF worker failure");
    }

    const pdfBuffer = await generateProjectPdfBuffer(project);
    const fileName = buildFileName(project.title);
    const storagePath = `exports/${jobId}/${fileName}`;

    storePdfRecord({
      path: storagePath,
      fileName,
      contentType: "application/pdf",
      buffer: pdfBuffer,
      createdAt: new Date().toISOString(),
    });

    updateExportJob(jobId, {
      status: "completed",
      progress: 100,
      stage: "Completed",
      storagePath,
      fileName,
      errorMessage: undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown export failure";
    updateExportJob(jobId, {
      status: "failed",
      progress: 100,
      stage: "Failed",
      errorMessage: message,
    });
  }
}

export function resetPdfExports(): void {
  exportJobs.clear();
}

export function getPdfExportJob(id: string): PdfExportJob | null {
  const job = exportJobs.get(id);
  return job ? cloneJob(job) : null;
}

export async function getPdfExportJobSnapshot(id: string): Promise<PdfExportJob | null> {
  const current = exportJobs.get(id);

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

export async function getPdfExportDownloadBufferByJobId(id: string): Promise<Buffer | null> {
  const current = exportJobs.get(id);

  if (current?.storagePath) {
    return getPdfRecord(current.storagePath)?.buffer ?? null;
  }

  if (isTriggerWorkerEnabled() && current?.triggerRunId) {
    try {
      const run = (await runs.retrieve(current.triggerRunId)) as TriggerRunSnapshot;
      const updated = mapTriggerRunToJob(id, run);

      if (updated?.storagePath) {
        return getPdfRecord(updated.storagePath)?.buffer ?? null;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function getPdfExportDownloadBuffer(storagePath: string): Buffer | null {
  return getPdfRecord(storagePath)?.buffer ?? null;
}

export function enqueuePdfExport(request: PdfExportRequest): PdfExportJob {
  const job = createBaseJob(createExportJobId(), request);
  exportJobs.set(job.id, job);

  if (isTriggerWorkerEnabled()) {
    void startTriggerPdfExport(job.id, request);
  } else {
    setTimeout(() => {
      void executeLocalExport(job.id, request);
    }, 120);
  }

  return cloneJob(job);
}