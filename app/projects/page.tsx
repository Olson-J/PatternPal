import Link from "next/link";
import { listProjects } from "@/lib/projects/store";

export default function ProjectsPage() {
  const projects = listProjects();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Saved Projects</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Project History Dashboard</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Fixture-backed project history used for Milestone 3 UI and API validation.
        </p>
      </header>

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
            <Link
              href={`/projects/${project.id}`}
              className="mt-4 inline-flex rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              View project details
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
