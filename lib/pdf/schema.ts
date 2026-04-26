import type { ProjectRecord } from "../projects/schema";

export type PdfExportStatus = "queued" | "running" | "completed" | "failed";

export interface PdfExportJob {
  id: string;
  triggerRunId?: string;
  projectId: string;
  userId: string;
  status: PdfExportStatus;
  progress: number;
  stage: string;
  storagePath?: string;
  fileName?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PdfStorageRecord {
  path: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
  createdAt: string;
}

export interface PdfExportRequest {
  projectId: string;
  userId: string;
  simulateFailure?: boolean;
}

export interface PdfExportContext {
  project: ProjectRecord;
}
