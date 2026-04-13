import type { PdfStorageRecord } from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __patternpalPdfStorage: Map<string, PdfStorageRecord> | undefined;
}

const pdfStorage = globalThis.__patternpalPdfStorage ?? new Map<string, PdfStorageRecord>();

if (!globalThis.__patternpalPdfStorage) {
  globalThis.__patternpalPdfStorage = pdfStorage;
}

export function storePdfRecord(record: PdfStorageRecord): void {
  pdfStorage.set(record.path, record);
}

export function getPdfRecord(path: string): PdfStorageRecord | null {
  return pdfStorage.get(path) ?? null;
}

export function resetPdfStorage(): void {
  pdfStorage.clear();
}
