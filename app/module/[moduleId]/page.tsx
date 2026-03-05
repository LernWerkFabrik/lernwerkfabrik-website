// app/module/[moduleId]/page.tsx
import { notFound } from "next/navigation";
import { getModuleMeta, getQuestions } from "@/lib/content";
import ModuleClient from "./ModuleClient";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;

  if (!moduleId) return notFound();

  const meta = await getModuleMeta(moduleId);
  if (!meta) return notFound();

  const [practiceQuestions, examQuestions] = await Promise.all([
    getQuestions(moduleId, "practice"),
    getQuestions(moduleId, "exam"),
  ]);

  const practiceCount = Array.isArray(practiceQuestions) ? practiceQuestions.length : 0;
  const examCount = Array.isArray(examQuestions) ? examQuestions.length : 0;

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <ModuleClient
        moduleId={moduleId}
        meta={meta}
        practiceCount={practiceCount}
        examCount={examCount}
      />
    </main>
  );
}
