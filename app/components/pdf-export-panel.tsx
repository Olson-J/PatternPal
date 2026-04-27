"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type PdfExportJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stage: string;
  fileName?: string;
  storagePath?: string;
  errorMessage?: string;
};

type PdfExportPanelProps = {
  projectId: string;
  projectTitle: string;
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function PdfExportPanel({ projectId, projectTitle }: PdfExportPanelProps) {
  const [job, setJob] = useState<PdfExportJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authHeadersRef = useRef<Record<string, string>>({});

  const isActive = useMemo(
    () => job?.status === "queued" || job?.status === "running",
    [job?.status]
  );

  async function getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const client = getSupabaseBrowserClient();
      const { data } = await client.auth.getSession();
      const token = data.session?.access_token;

      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  async function loadJob(jobId: string, authHeaders: Record<string, string>): Promise<PdfExportJob | null> {
    const response = await fetch(`/api/project-exports/${jobId}`, {
      headers: authHeaders,
    });

    if (!response.ok) {
      throw new Error("Unable to load PDF export status.");
    }

    const json = (await response.json()) as { job: PdfExportJob };
    return json.job;
  }

  async function downloadCompletedExport(): Promise<void> {
    if (!job?.id || job.status !== "completed") {
      return;
    }

    const response = await fetch(`/api/project-exports/${job.id}/download`, {
      headers: authHeadersRef.current,
    });

    if (!response.ok) {
      throw new Error("Unable to download completed PDF export.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = job.fileName ?? "patternpal-export.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }

  async function startExport() {
    setIsSubmitting(true);
    setError(null);

    try {
      const authHeaders = await getAuthHeaders();
      authHeadersRef.current = authHeaders;

      const response = await fetch("/api/project-exports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          projectId,
          simulateFailure,
        }),
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Unable to start PDF export.");
      }

      const json = (await response.json()) as { job: PdfExportJob };
      setJob(json.job);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to start PDF export.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!job?.id || !isActive) {
      return undefined;
    }

    let cancelled = false;
    const authHeaders = authHeadersRef.current;

    const poll = async () => {
      try {
        const latest = await loadJob(job.id, authHeaders);

        if (!cancelled && latest) {
          setJob(latest);
        }
      } catch (pollingError) {
        if (!cancelled) {
          setError(pollingError instanceof Error ? pollingError.message : "Unable to load PDF export status.");
        }
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 300);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isActive, job?.id]);

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">PDF export</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Generate a printable PDF for {projectTitle} here!
          </p>
        </div>

        <button
          type="button"
          onClick={() => void startExport()}
          disabled={isSubmitting}
          className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Starting export..." : "Export PDF"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {job ? `${job.status.toUpperCase()} · ${job.stage}` : "No export running"}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">{job ? `${job.progress}% complete` : "0% complete"}</span>
        </div>
        <ProgressBar value={job?.progress ?? 0} />
      </div>

      {job?.status === "failed" ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-sm font-medium text-red-800 dark:text-red-100">Export failed</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-200">{job.errorMessage ?? "Export failed."}</p>
          <button
            type="button"
            onClick={() => {
              setSimulateFailure(false);
              void startExport();
            }}
            className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 dark:border-red-400/40 dark:text-red-100 dark:hover:bg-red-500/10"
          >
            Retry export
          </button>
        </div>
      ) : null}

      {job?.status === "completed" ? (
        <button
          type="button"
          onClick={() => void downloadCompletedExport()}
          className="mt-6 inline-flex rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
        >
          Download PDF
        </button>
      ) : null}
    </section>
  );
}
