// app/results/[moduleId]/page.tsx
import { notFound } from "next/navigation";

import { getModuleMeta } from "@/lib/content";
import ResultsListClient from "./ResultsListClient";

export default async function ResultsHistoryPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;

  if (!moduleId) return notFound();

  // Existenz-Check: Modul muss im Content vorhanden sein
  const meta = await getModuleMeta(moduleId);
  if (!meta) return notFound();

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <ResultsListClient moduleId={moduleId} />
    </main>
  );
}
