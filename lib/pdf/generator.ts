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
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replaceAll(/[^\x20-\x7E]/g, "?");
}

function wrapLine(line: string, maxCharsPerLine: number): string[] {
  if (line.length <= maxCharsPerLine) {
    return [line];
  }

  const words = line.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [line.slice(0, maxCharsPerLine)];
  }

  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      if (word.length <= maxCharsPerLine) {
        current = word;
      } else {
        for (let index = 0; index < word.length; index += maxCharsPerLine) {
          wrapped.push(word.slice(index, index + maxCharsPerLine));
        }
      }
      continue;
    }

    const next = `${current} ${word}`;

    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }

    wrapped.push(current);

    if (word.length <= maxCharsPerLine) {
      current = word;
    } else {
      for (let index = 0; index < word.length; index += maxCharsPerLine) {
        wrapped.push(word.slice(index, index + maxCharsPerLine));
      }
      current = "";
    }
  }

  if (current) {
    wrapped.push(current);
  }

  return wrapped;
}

function buildFallbackLines(project: ProjectRecord): string[] {
  const generatedDate = new Date(project.instructions.generatedAt).toLocaleString();
  const lines: string[] = [
    "PatternPal PDF Export",
    project.title,
    project.description,
    `Mode: ${project.mode}`,
    `Generated: ${generatedDate}`,
    "",
    "Notes",
    project.instructions.notes ?? "No additional notes provided.",
    "",
    "Materials",
    ...project.instructions.materials.map((item) => `- ${item}`),
    "",
    "Assembly",
    ...project.instructions.assembly.flatMap((step) => {
      const detailLines = step.details?.map((detail) => `    - ${detail}`) ?? [];
      return [`Step ${step.step}: ${step.description}`, ...detailLines];
    }),
    "",
    "Finishing",
    ...project.instructions.finishing.map((item) => `- ${item}`),
  ];

  return lines.flatMap((line) => wrapLine(line, 86));
}

function buildPageContent(lines: string[]): string {
  if (lines.length === 0) {
    return "BT /F1 11 Tf 72 740 Td ( ) Tj ET";
  }

  const [firstLine, ...remainingLines] = lines;
  const commands = [`BT /F1 11 Tf 72 740 Td (${escapePdfText(firstLine)}) Tj`];

  for (const line of remainingLines) {
    commands.push(`0 -16 Td (${escapePdfText(line)}) Tj`);
  }

  commands.push("ET");
  return commands.join("\n");
}

function chunkLines(lines: string[], linesPerPage: number): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    chunks.push(lines.slice(index, index + linesPerPage));
  }

  return chunks.length > 0 ? chunks : [[""]];
}

export function buildFallbackPdf(project: ProjectRecord): string {
  const pages = chunkLines(buildFallbackLines(project), 40);

  const catalogObjectNumber = 1;
  const pagesObjectNumber = 2;
  const firstPageObjectNumber = 3;
  const fontObjectNumber = firstPageObjectNumber + pages.length * 2;
  const objectCount = fontObjectNumber;

  const objects: string[] = new Array(objectCount + 1).fill("");

  const pageReferences: string[] = [];

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const pageObjectNumber = firstPageObjectNumber + pageIndex * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    pageReferences.push(`${pageObjectNumber} 0 R`);

    const contentStream = buildPageContent(pages[pageIndex]);
    const contentLength = Buffer.byteLength(contentStream, "latin1");

    objects[pageObjectNumber] =
      `${pageObjectNumber} 0 obj << /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >> endobj\n`;
    objects[contentObjectNumber] =
      `${contentObjectNumber} 0 obj << /Length ${contentLength} >> stream\n${contentStream}\nendstream endobj\n`;
  }

  objects[catalogObjectNumber] = `${catalogObjectNumber} 0 obj << /Type /Catalog /Pages ${pagesObjectNumber} 0 R >> endobj\n`;
  objects[pagesObjectNumber] = `${pagesObjectNumber} 0 obj << /Type /Pages /Kids [${pageReferences.join(" ")}] /Count ${pages.length} >> endobj\n`;
  objects[fontObjectNumber] = `${fontObjectNumber} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n`;

  const header = "%PDF-1.4\n";
  let body = header;
  const offsets: number[] = [0];

  for (let objectNumber = 1; objectNumber <= objectCount; objectNumber += 1) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += objects[objectNumber];
  }

  const xrefOffset = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;

  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }

  const trailer =
    `trailer << /Size ${objectCount + 1} /Root ${catalogObjectNumber} 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return body + xref + trailer;
}
