// app/results/[moduleId]/[examId]/page.tsx
import { notFound } from "next/navigation";

import { getModuleMeta } from "@/lib/content";
import ResultsClient from "./ResultsClient";

export default async function ResultsDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string; examId: string }>;
}) {
  const { moduleId, examId } = await params;

  if (!moduleId || !examId) return notFound();

  // Existenz-Check: Modul muss im Content vorhanden sein
  const meta = await getModuleMeta(moduleId);
  if (!meta) return notFound();

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <ResultsClient moduleId={moduleId} examId={examId} />
    </main>
  );
}
