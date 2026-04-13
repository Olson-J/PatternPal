import { describe, expect, it } from "vitest";
import { fixtureProjects } from "../lib/projects/fixtures";
import { renderPrintableProjectHtml, escapeHtml } from "../lib/pdf/template";

describe("PDF template", () => {
  it("renders printable project content", () => {
    const html = renderPrintableProjectHtml(fixtureProjects[0]);

    expect(html).toContain("PatternPal PDF Export");
    expect(html).toContain(fixtureProjects[0].title);
    expect(html).toContain("Materials");
    expect(html).toContain("Assembly");
    expect(html).toContain("Finishing");
  });

  it("escapes html-sensitive text", () => {
    expect(escapeHtml('<tag attr="1">&\'test\'</tag>')).toBe(
      "&lt;tag attr=&quot;1&quot;&gt;&amp;&#39;test&#39;&lt;/tag&gt;"
    );
  });
});
