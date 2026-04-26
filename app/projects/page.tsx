"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isGuestModeEnabled } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProjectSummary = {
  id: string;
  title: string;
  description: string;
  mode: "casual" | "professional";
  createdAt: string;
};

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      const guestMode = isGuestModeEnabled();
      setIsGuest(guestMode);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch("/api/projects", {
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Sign in to view your project history.");
            return;
          }

          throw new Error(`Unable to load projects (status ${response.status}).`);
        }

        const json = (await response.json()) as { projects?: ProjectSummary[] };
        setProjects(Array.isArray(json.projects) ? json.projects : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load projects.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  async function handleDeleteProject(project: ProjectSummary): Promise<void> {
    const confirmed = window.confirm(`Delete \"${project.title}\"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setError(null);
    setDeletingProjectId(project.id);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sign in to delete projects.");
        }

        if (response.status === 404) {
          throw new Error("This project no longer exists.");
        }

        throw new Error(`Unable to delete project (status ${response.status}).`);
      }

      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete project.");
    } finally {
      setDeletingProjectId(null);
    }
  }

  const emptyMessage = isGuest
    ? "Guest mode is active. Sign in to see saved projects."
    : "No saved projects yet.";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Saved Projects</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Project History Dashboard</h1>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
          Loading project history...
        </div>
      ) : error && projects.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{project.title}</h2>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">
                  {project.mode}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{project.description}</p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Created {new Date(project.createdAt).toLocaleString()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  View project details
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDeleteProject(project)}
                  disabled={deletingProjectId === project.id}
                  className="inline-flex rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                >
                  {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
