"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect, useRef, type ReactNode } from "react";
import { clearGuestMode, isGuestModeEnabled } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  createMockInstructions,
  mockCasualStays,
  mockProfessionalStays,
  mockSimpleDress,
  type AssemblyStep,
  type GarmentInstructions,
} from "../../__tests__/fixtures/garmentInstructions";

type ApiGuidanceMode = GarmentInstructions["mode"];

type ExamplePrompt = {
  label: string;
  value: string;
  mode: ApiGuidanceMode;
};

type PdfExportJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stage: string;
  fileName?: string;
  errorMessage?: string;
};

const examplePrompts: ExamplePrompt[] = [
  { label: "18th-century stays", value: "18th-century stays", mode: "casual" },
  { label: "Professional 18th-century stays", value: "18th-century stays", mode: "professional" },
  { label: "Simple shift dress", value: "simple linen shift dress", mode: "casual" },
];

function capitalizeLabel(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Untitled garment";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function pickMockFixture(description: string, mode: ApiGuidanceMode): GarmentInstructions {
  const normalized = description.toLowerCase();

  if (normalized.includes("dress")) {
    return mockSimpleDress;
  }

  if (normalized.includes("stays") || normalized.includes("corset")) {
    return mode === "professional" ? mockProfessionalStays : mockCasualStays;
  }

  return mode === "professional" ? mockProfessionalStays : mockCasualStays;
}

function buildMockInstructions(description: string, mode: ApiGuidanceMode): GarmentInstructions {
  const effectiveMode: ApiGuidanceMode = mode === "professional" ? "professional" : "casual";
  const baseFixture = pickMockFixture(description, effectiveMode);
  const garmentName = capitalizeLabel(description);

  return createMockInstructions({
    garment: garmentName,
    mode: effectiveMode,
    materials: baseFixture.materials,
    assembly: baseFixture.assembly,
    finishing: baseFixture.finishing,
    notes: baseFixture.notes,
    generatedAt: new Date().toISOString(),
  });
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
      {children}
    </span>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AssemblyList({ steps }: { steps: AssemblyStep[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li
          key={step.step}
          className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Step {step.step}: {step.description}
            </h3>
          </div>
          {step.details ? (
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {step.details.map((detail) => (
                <li key={detail} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export default function AppHome() {
  const resultsSectionRef = useRef<HTMLElement | null>(null);
  const [description, setDescription] = useState("18th-century stays");
  const [mode, setMode] = useState<ApiGuidanceMode>("casual");
  const [instructions, setInstructions] = useState<GarmentInstructions>(mockCasualStays);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [appMode, setAppMode] = useState<"mock" | "live">("mock");
  const [lastGenerationSource, setLastGenerationSource] = useState<"mock" | "api">("mock");
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [savedProjectFingerprint, setSavedProjectFingerprint] = useState<string | null>(null);

  useEffect(() => {
    const guestMode = isGuestModeEnabled();
    setIsGuestMode(guestMode);

    const maybeRedirectToSignIn = async () => {
      let client;

      try {
        client = getSupabaseBrowserClient();
      } catch {
        return;
      }

      const { data } = await client.auth.getSession();
      const session = data.session;

      if (session?.user) {
        if (guestMode) {
          clearGuestMode();
          setIsGuestMode(false);
        }
        return;
      }

      if (!guestMode) {
        window.location.replace("/auth/sign-in");
      }
    };

    void maybeRedirectToSignIn();
  }, []);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const response = await fetch("/api/config");
        const data = (await response.json()) as { mode: "mock" | "live" };
        setAppMode(data.mode);
      } catch {
        setAppMode("mock");
      }
    };

    void fetchMode();
  }, []);

  function scrollToResults(): void {
    window.requestAnimationFrame(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError("Enter a garment description before generating guidance.");
      return;
    }

    setError(null);
    setSaveStatus(null);
    setExportStatus(null);
    setIsLoading(true);

    // Prepare the request payload
    const payload = {
      description: trimmedDescription,
      mode,
    };

    // Call the real API endpoint
    fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          let detail = "";

          try {
            const errorBody = (await response.json()) as { error?: string; detail?: string };
            detail = errorBody.detail ? ` ${errorBody.detail}` : "";
          } catch {
            // Ignore JSON parsing errors and fall back to a status-only message.
          }

          if (response.status === 429) {
            throw new Error(`Rate limit exceeded. Please try again later.${detail}`);
          }
          throw new Error(`API error: ${response.status}${detail}`);
        }
        return response.json();
      })
      .then((data) => {
        // Expect response: { instructions: GarmentInstructions, meta: {...} }
        if (data && data.instructions) {
          setInstructions(data.instructions);
          setLastGenerationSource("api");
          setSavedProjectId(null);
          setSavedProjectFingerprint(null);
          setError(null);
          scrollToResults();
        } else {
          throw new Error("Invalid API response format");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to generate instructions");
        setIsLoading(false);
      });
  }

  function applyExample(example: ExamplePrompt) {
    setDescription(example.value);
    setMode(example.mode);
    setError(null);
    setSaveStatus(null);
    setExportStatus(null);
    setInstructions(buildMockInstructions(example.value, example.mode));
    setLastGenerationSource("mock");
    setSavedProjectId(null);
    setSavedProjectFingerprint(null);
    scrollToResults();
  }

  function buildProjectSavePayload() {
    return {
      title: description.trim() || instructions.garment,
      description: description.trim() || instructions.garment,
      mode: instructions.mode,
      instructions,
    };
  }

  function getPayloadFingerprint(payload: ReturnType<typeof buildProjectSavePayload>): string {
    return JSON.stringify(payload);
  }

  async function ensureProjectSaved(
    authHeaders: Record<string, string>
  ): Promise<{ projectId: string; reused: boolean }> {
    const payload = buildProjectSavePayload();
    const payloadFingerprint = getPayloadFingerprint(payload);

    if (savedProjectId && savedProjectFingerprint === payloadFingerprint) {
      return { projectId: savedProjectId, reused: true };
    }

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = response.status === 400
        ? "Could not save project due to invalid data."
        : `Failed to save project (status ${response.status}).`;
      throw new Error(message);
    }

    const saved = (await response.json()) as { project?: { id?: string } };
    const projectId = saved.project?.id;

    if (!projectId) {
      throw new Error("Missing project id after save.");
    }

    setSavedProjectId(projectId);
    setSavedProjectFingerprint(payloadFingerprint);

    return { projectId, reused: false };
  }

  async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        return {};
      }

      return { Authorization: `Bearer ${token}` };
    } catch {
      return {};
    }
  }

  async function waitForCompletedExport(
    jobId: string,
    authHeaders: Record<string, string>
  ): Promise<PdfExportJob> {
    const maxAttempts = 25;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await fetch(`/api/project-exports/${jobId}`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error("Unable to load PDF export status.");
      }

      const json = (await response.json()) as { job?: PdfExportJob };

      if (!json.job) {
        throw new Error("Unexpected PDF export response.");
      }

      if (json.job.status === "completed") {
        return json.job;
      }

      if (json.job.status === "failed") {
        throw new Error(json.job.errorMessage ?? "PDF export failed.");
      }

      setExportStatus(`Export in progress... ${json.job.progress}%`);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 300);
      });
    }

    throw new Error("PDF export timed out. Please try again.");
  }

  function handleSaveProject() {
    if (isGuestMode) {
      setSaveStatus("Guest mode is active. Sign in to save projects.");
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    void (async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const saveResult = await ensureProjectSaved(authHeaders);
        setSaveStatus(saveResult.reused ? "Already saved to project history." : "Saved to project history.");
      } catch (saveError: unknown) {
        const message = saveError instanceof Error ? saveError.message : "Failed to save project.";
        setSaveStatus(message);
      } finally {
        setIsSaving(false);
      }
    })();
  }

  async function handleExportPdf() {
    if (isGuestMode) {
      setExportStatus("Guest mode is active. Sign in to export PDFs.");
      return;
    }

    if (isSaving || isExporting || isLoading) {
      return;
    }

    setIsExporting(true);
    setExportStatus("Preparing project for PDF export...");

    try {
      const authHeaders = await getAuthHeaders();

      const saveResult = await ensureProjectSaved(authHeaders);
      const projectId = saveResult.projectId;
      setExportStatus(saveResult.reused ? "Using saved project for PDF export..." : "Saving project for PDF export...");

      setExportStatus("Starting PDF export...");

      const exportResponse = await fetch("/api/project-exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!exportResponse.ok) {
        const json = (await exportResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Unable to start PDF export.");
      }

      const exportJson = (await exportResponse.json()) as { job?: PdfExportJob };
      const jobId = exportJson.job?.id;

      if (!jobId) {
        throw new Error("Missing PDF export job id.");
      }

      const completed = await waitForCompletedExport(jobId, authHeaders);
      const downloadUrl = `/api/project-exports/${completed.id}/download`;
      const downloadResponse = await fetch(downloadUrl, {
        headers: authHeaders,
      });

      if (!downloadResponse.ok) {
        throw new Error("Unable to download completed PDF export.");
      }

      const downloadBlob = await downloadResponse.blob();
      const objectUrl = URL.createObjectURL(downloadBlob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = completed.fileName ?? "patternpal-export.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      setExportStatus("PDF export complete. Download started.");
    } catch (exportError) {
      setExportStatus(exportError instanceof Error ? exportError.message : "Unable to export PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eff6ff_48%,_#e0ecff_100%)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(24,24,27,0.32),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#111827_100%)] dark:text-zinc-50">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(9,9,11,0.92),rgba(9,9,11,0))]" />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
        <section className="grid gap-8 rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-8 dark:border-white/10 dark:bg-zinc-950/60">
          <div className="space-y-6">
            {isGuestMode ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-950 dark:text-blue-100">
                <p>Guest mode is active. You can generate instructions, but you cannot save projects or export PDFs.</p>
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 transition hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
                >
                  Log in
                </Link>
              </div>
            ) : null}

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                PatternPal: turn garment ideas into structured sewing guidance!
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg dark:text-zinc-300">
                Found a historical pattern with no instructions? Not sure where to start with assembling a self drafted design? Planning out the steps for a future project? PatternPal can help!
              </p>
            </div>

          </div>

          <SectionCard
            title="Try a guided example"
            description="New to PatternPal? Try an example prompt!"
          >
            <div className="grid gap-3">
              {examplePrompts.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => applyExample(example)}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-800 transition hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:border-blue-500/40 dark:hover:bg-zinc-900"
                >
                  <span className="block text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Example</span>
                  <span className="mt-1 block">{example.label}</span>
                </button>
              ))}
            </div>
          </SectionCard>
        </section>

        <section className="space-y-8">
          <SectionCard
            title="Get Started!"
            description="Describe your project, then select a guidance mode and click 'Generate' to receive structured garment instructions. 'Casual' mode is great for hobbyists and makers looking for more flexible, general guidance, while 'Professional' mode provides more detailed and precise instructions suitable for experienced sewers or those working on complex garments."
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Garment description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-blue-400"
                  placeholder="Describe the garment you want to make..."
                />
              </label>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Guidance mode</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    { label: "Casual", value: "casual" },
                    { label: "Professional", value: "professional" },
                  ] as const).map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        mode === option.value
                          ? "border-blue-500 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      }`}
                    >
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{option.label}</span>
                      <input
                        type="radio"
                        name="mode"
                        value={option.value}
                        checked={mode === option.value}
                        onChange={() => setMode(option.value)}
                        className="h-4 w-4 accent-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                {isLoading ? "Generating guidance..." : "Generate"}
              </button>
            </form>
          </SectionCard>

          <section ref={resultsSectionRef}>
            <SectionCard
              title="Project Results"
              description="See the generated garment instructions here! You can save this result to your project history, or export it as a PDF."
            >
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{instructions.mode} mode</Badge>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {lastGenerationSource === "api" ? "Generated through API" : "Generated from local fixture data"}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{instructions.garment}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {instructions.notes ?? "No additional notes provided."}
                  </p>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-1">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Materials
                    </h4>
                    <div className="mt-4">
                      <FeatureList items={instructions.materials} />
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                      Assembly
                    </h4>
                    <div className="mt-4">
                      <AssemblyList steps={instructions.assembly} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Finishing
                  </h4>
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <FeatureList items={instructions.finishing} />
                  </div>
                </div>

                {lastGenerationSource === "mock" ? (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-950 dark:text-blue-50">
                    This result is mock-generated using local fixture data.
                  </div>
                ) : null}

                <div className="grid gap-3 border-t border-zinc-200 pt-4 md:grid-cols-2 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleSaveProject}
                    disabled={isSaving || isLoading || isExporting || isGuestMode}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    {isSaving ? "Saving result..." : "Save results to project history"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExportPdf()}
                    disabled={isSaving || isLoading || isExporting || isGuestMode}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    {isExporting ? "Exporting PDF..." : "Export PDF"}
                  </button>
                  {saveStatus ? (
                    <p className="text-sm text-zinc-600 md:col-span-2 dark:text-zinc-300">{saveStatus}</p>
                  ) : null}
                  {exportStatus ? (
                    <p className="text-sm text-zinc-600 md:col-span-2 dark:text-zinc-300">{exportStatus}</p>
                  ) : null}
                </div>
              </div>
            )}
            </SectionCard>
          </section>
        </section>
      </main>
    </div>
  );
}
