import type { Browser } from "puppeteer";
import { renderPrintableProjectHtml } from "./template";
import type { ProjectRecord } from "../projects/schema";

async function launchPuppeteerBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer");
  return puppeteer.default.launch({ headless: true });
}

export async function generateProjectPdfBuffer(project: ProjectRecord): Promise<Buffer> {
  const html = renderPrintableProjectHtml(project);

  try {
    const browser = await launchPuppeteerBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
  } catch {
    return Buffer.from(buildFallbackPdf(project), "latin1");
  }
}

function escapePdfText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildFallbackPdf(project: ProjectRecord): string {
  const lines = [
    "PatternPal PDF Export",
    project.title,
    project.description,
    `Mode: ${project.mode}`,
    `Materials: ${project.instructions.materials.slice(0, 3).join(", ")}`,
  ];

  const textCommands = lines
    .map((line, index) => {
      const y = 740 - index * 28;
      return `BT /F1 14 Tf 72 ${y} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];

  const contentStream = `q\n1 0 0 1 0 0 cm\n${textCommands}\nQ`;
  const contentObject = `5 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj\n`;

  const header = "%PDF-1.4\n";
  let body = header;
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }

  offsets.push(body.length);
  body += contentObject;

  const xrefOffset = body.length;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;

  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return body + xref + trailer;
}
