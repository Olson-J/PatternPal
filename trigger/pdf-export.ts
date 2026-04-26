import { task } from "@trigger.dev/sdk/v3";

import { PDF_EXPORT_TASK_ID } from "@/lib/pdf/constants";
import { generateProjectPdfBuffer } from "@/lib/pdf/generator";
import type { PdfExportRequest } from "@/lib/pdf/schema";
import { getProjectByIdForUser } from "@/lib/projects/repository";

export type PdfExportTaskOutput = {
  fileName: string;
  storagePath: string;
  pdfBase64: string;
};

function buildPdfFileName(title: string): string {
  return `${title.replaceAll(/[^a-z0-9]+/gi, "-").replaceAll(/^-+|-+$/g, "").toLowerCase() || "patternpal-export"}.pdf`;
}

export const pdfExportTask = task({
  id: PDF_EXPORT_TASK_ID,
  run: async (input: PdfExportRequest): Promise<PdfExportTaskOutput> => {
    const project = await getProjectByIdForUser(input.projectId, input.userId);

    if (!project) {
      throw new Error("Project not found.");
    }

    if (input.simulateFailure) {
      throw new Error("Simulated PDF worker failure");
    }

    const pdfBuffer = await generateProjectPdfBuffer(project);
    const fileName = buildPdfFileName(project.title);
    const storagePath = `exports/${project.id}/${Date.now()}-${fileName}`;

    return {
      fileName,
      storagePath,
      pdfBase64: pdfBuffer.toString("base64"),
    };
  },
});