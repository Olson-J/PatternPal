import type { ProjectRecord } from "../projects/schema";

function formatList(items: string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function formatAssembly(project: ProjectRecord): string {
  return project.instructions.assembly
    .map(
      (step) => `
        <li class="step">
          <div class="step-head">
            <span class="step-number">Step ${step.step}</span>
            <h3>${escapeHtml(step.description)}</h3>
          </div>
          ${step.details && step.details.length > 0 ? `<ul>${formatList(step.details)}</ul>` : ""}
        </li>
      `
    )
    .join("");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPrintableProjectHtml(project: ProjectRecord): string {
  const generatedDate = new Date(project.instructions.generatedAt).toLocaleString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charSet="utf-8" />
  <title>${escapeHtml(project.title)} - PatternPal Export</title>
  <style>
    @page { size: A4; margin: 0.75in; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111827;
      margin: 0;
      background: #fff;
    }
    .page {
      display: grid;
      gap: 18px;
    }
    .hero {
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 16px;
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    h1, h2, h3, p, ul, ol {
      margin: 0;
    }
    h1 {
      font-size: 30px;
      line-height: 1.1;
      margin-bottom: 8px;
    }
    .meta {
      font-size: 12px;
      color: #4b5563;
    }
    .summary {
      background: #fff7ed;
      border: 1px solid #fdba74;
      border-radius: 16px;
      padding: 16px;
      display: grid;
      gap: 8px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 16px;
    }
    .card h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #6b7280;
      margin-bottom: 12px;
    }
    ul, ol {
      padding-left: 20px;
      display: grid;
      gap: 8px;
      font-size: 13px;
      line-height: 1.5;
    }
    .step {
      list-style: none;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .step:last-child { border-bottom: none; }
    .step-head {
      display: grid;
      gap: 4px;
      margin-bottom: 8px;
    }
    .step-number {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #f59e0b;
    }
    .notes {
      font-size: 13px;
      line-height: 1.6;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div class="eyebrow">PatternPal PDF Export</div>
      <h1>${escapeHtml(project.title)}</h1>
      <p class="meta">${escapeHtml(project.description)}</p>
      <p class="meta">Mode: ${escapeHtml(project.mode)} · Generated ${escapeHtml(generatedDate)}</p>
    </section>

    <section class="summary">
      <h2>Garment Notes</h2>
      <p class="notes">${escapeHtml(project.instructions.notes ?? "No additional notes provided.")}</p>
    </section>

    <section class="grid">
      <div class="card">
        <h2>Materials</h2>
        <ul>${formatList(project.instructions.materials)}</ul>
      </div>
      <div class="card">
        <h2>Assembly</h2>
        <ol>${formatAssembly(project)}</ol>
      </div>
      <div class="card">
        <h2>Finishing</h2>
        <ul>${formatList(project.instructions.finishing)}</ul>
      </div>
    </section>
  </div>
</body>
</html>`;
}
