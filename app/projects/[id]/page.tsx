import { notFound } from "next/navigation";
import { getProjectByIdForUser } from "@/lib/projects/repository";
import { getDefaultProjectUserId } from "@/lib/projects/user";
import { PdfExportPanel } from "@/app/components/pdf-export-panel";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProjectByIdForUser(id, getDefaultProjectUserId());

  if (!project) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Project Details</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{project.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{project.description}</p>
      </header>

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
    </main>
  );
}
