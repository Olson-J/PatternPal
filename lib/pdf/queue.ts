import { getProjectById } from "../projects/store";
import { generateProjectPdfBuffer } from "./generator";
import { getPdfRecord, storePdfRecord } from "./storage";
import type { PdfExportJob, PdfExportRequest } from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __patternpalPdfExportJobs: Map<string, PdfExportJob> | undefined;
}

const exportJobs = globalThis.__patternpalPdfExportJobs ?? new Map<string, PdfExportJob>();

if (!globalThis.__patternpalPdfExportJobs) {
  globalThis.__patternpalPdfExportJobs = exportJobs;
}

function createExportJobId(): string {
  return `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneJob(job: PdfExportJob): PdfExportJob {
  return structuredClone(job);
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

async function executeExport(jobId: string, request: PdfExportRequest): Promise<void> {
  const job = exportJobs.get(jobId);
  if (!job) {
    return;
  }

  updateExportJob(jobId, {
    status: "running",
    progress: 35,
    stage: "Rendering printable HTML",
  });

  try {
    const project = getProjectById(request.projectId);

    if (!project) {
      throw new Error("Project not found.");
    }

    if (request.simulateFailure) {
      throw new Error("Simulated PDF worker failure");
    }

    const pdfBuffer = await generateProjectPdfBuffer(project);
    const fileName = `${project.title.replaceAll(/[^a-z0-9]+/gi, "-").replaceAll(/^-+|-+$/g, "").toLowerCase() || "patternpal-export"}.pdf`;
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

export function enqueuePdfExport(request: PdfExportRequest): PdfExportJob {
  const now = new Date().toISOString();
  const job: PdfExportJob = {
    id: createExportJobId(),
    projectId: request.projectId,
    status: "queued",
    progress: 5,
    stage: "Queued for PDF worker",
    createdAt: now,
    updatedAt: now,
  };

  exportJobs.set(job.id, job);

  setTimeout(() => {
    updateExportJob(job.id, {
      status: "running",
      progress: 35,
      stage: "Rendering printable HTML",
    });
  }, 120);

  setTimeout(() => {
    void executeExport(job.id, request);
  }, 420);

  return cloneJob(job);
}

export function getPdfExportJob(id: string): PdfExportJob | null {
  const job = exportJobs.get(id);
  return job ? cloneJob(job) : null;
}

export function getPdfExportDownloadBuffer(storagePath: string): Buffer | null {
  return getPdfRecord(storagePath)?.buffer ?? null;
}
