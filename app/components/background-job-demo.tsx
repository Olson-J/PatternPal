"use client";

import { useEffect, useMemo, useState } from "react";
import type { GuidanceMode, GarmentInstructions } from "@/lib/instructions/schema";
import { enqueueBackgroundJob, getBackgroundJob } from "@/lib/jobs/trigger-queue";

type BackgroundJobStatus = "queued" | "running" | "completed" | "failed";

type BackgroundJobRecord = {
  id: string;
  status: BackgroundJobStatus;
  progress: number;
  stage: string;
  description: string;
  mode: GuidanceMode;
  errorMessage?: string;
  instructions?: GarmentInstructions;
};

type BackgroundJobDemoProps = {
  description: string;
  mode: GuidanceMode;
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

export function BackgroundJobDemo({ description, mode }: BackgroundJobDemoProps) {
  const [job, setJob] = useState<BackgroundJobRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isActive = useMemo(
    () => job?.status === "queued" || job?.status === "running",
    [job?.status]
  );

  function startJob(shouldFail = simulateFailure) {
    setIsSubmitting(true);
    setFetchError(null);

    try {
      const created = enqueueBackgroundJob({
        description,
        mode,
        simulateFailure: shouldFail,
      });

      setJob(getBackgroundJob(created.id) ?? created);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Unable to start background job.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!job?.id || !isActive) {
      return undefined;
    }

    const poll = async () => {
      const latest = getBackgroundJob(job.id);

      if (!latest) {
        setFetchError("Unable to load job status.");
        return;
      }

      setJob(latest as BackgroundJobRecord);
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 300);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive, job?.id]);

  const completedInstructions = job?.status === "completed" ? job.instructions : null;
  const failureMessage = job?.status === "failed" ? job.errorMessage ?? "Job failed." : null;

  return (
    <section
      id="background-jobs"
      className="rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-950/70"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Milestone 4
          </p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Background generation job demo
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            This mock job flow queues work, polls status, and renders progress without touching the live API.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void startJob()}
          disabled={isSubmitting}
          className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Queueing job..." : "Start background job"}
        </button>
      </div>

      <label className="mt-4 flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={simulateFailure}
          onChange={(event) => setSimulateFailure(event.target.checked)}
          className="h-4 w-4 accent-amber-500"
        />
        Simulate failure for retry-path testing
      </label>

      {fetchError ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {fetchError}
        </p>
      ) : null}

      <div className="mt-5 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {job ? `${job.status.toUpperCase()} · ${job.stage}` : "No active job yet"}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {job ? `${job.progress}% complete` : "0% complete"}
          </span>
        </div>
        <ProgressBar value={job?.progress ?? 0} />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {job
            ? `Generating guidance for ${job.description} in ${job.mode} mode.`
            : "Start a job to see queued, running, completed, and failed states."}
        </p>
      </div>

      {completedInstructions ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
              Completed result
            </p>
            <h3 className="mt-1 text-lg font-semibold text-emerald-950 dark:text-emerald-50">
              {completedInstructions.garment}
            </h3>
            <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-50/80">
              {completedInstructions.notes ?? "Generated instructions ready for the next workflow stage."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                Materials
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-emerald-950 dark:text-emerald-50">
                {completedInstructions.materials.slice(0, 3).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                Next steps
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-emerald-950 dark:text-emerald-50">
                {completedInstructions.assembly.slice(0, 2).map((step) => (
                  <li key={`${step.step}-${step.description}`}>Step {step.step}: {step.description}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {job?.status === "failed" ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-sm font-medium text-red-800 dark:text-red-100">Job failed</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-200">{failureMessage}</p>
          <button
            type="button"
            onClick={() => {
              setSimulateFailure(false);
              void startJob(false);
            }}
            className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 dark:border-red-400/40 dark:text-red-100 dark:hover:bg-red-500/10"
          >
            Retry job
          </button>
        </div>
      ) : null}
    </section>
  );
}
