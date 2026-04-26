"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { isGuestModeEnabled } from "@/lib/auth/guest";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PdfExportPanel } from "@/app/components/pdf-export-panel";

type ProjectDetail = {
  id: string;
  title: string;
  description: string;
  instructions: {
    materials: string[];
    assembly: Array<{ step: number; description: string }>;
    finishing: string[];
  };
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

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const supabaseResult = useMemo(() => {
    try {
      return { error: null as string | null };
    } catch {
      return { error: "Supabase auth is not configured." };
    }
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      const guestMode = isGuestModeEnabled();
      setIsGuest(guestMode);

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/projects/${projectId}`, {
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Sign in to view project details.");
            return;
          }

          if (response.status === 404) {
            setError("Project not found.");
            return;
          }

          throw new Error(`Unable to load project (status ${response.status}).`);
        }

        const json = (await response.json()) as { project?: ProjectDetail };
        setProject(json.project ?? null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load project.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProject();
  }, [projectId]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
          Loading project details...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Project Details</p>
        {project ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{project.title}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{project.description}</p>
          </>
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Project not available</h1>
        )}
      </header>

      {supabaseResult.error ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {supabaseResult.error}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
          <p>{error}</p>
          <Link href="/projects" className="mt-3 inline-flex rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900">
            Back to project history
          </Link>
        </div>
      ) : project ? (
        <>
          <section className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/70">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Materials</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {project.instructions.materials.map((material) => (
                  <li key={material}>- {material}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Assembly</h2>
              <ol className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {project.instructions.assembly.map((step) => (
                  <li key={`${step.step}-${step.description}`}>Step {step.step}: {step.description}</li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Finishing</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {project.instructions.finishing.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className="mt-8">
            <PdfExportPanel projectId={project.id} projectTitle={project.title} />
          </div>
        </>
      ) : null}

      {isGuest ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Guest mode is active. Sign in to see saved project details and export PDFs.
        </p>
      ) : null}
    </main>
  );
}
