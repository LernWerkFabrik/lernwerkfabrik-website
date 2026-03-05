// app/learn/[moduleId]/page.tsx
import { notFound } from "next/navigation";

import { getModuleMeta, getMarkdown, getQuestions } from "@/lib/content";
import LearnClient from "./LearnClient";

type SearchParams = {
  tab?: string;
  filterIds?: string;
};

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { moduleId } = await params;
  const { tab, filterIds } = await searchParams;

  if (!moduleId) return notFound();

  const meta = await getModuleMeta(moduleId);
  if (!meta) return notFound();

  const theory = (await getMarkdown(moduleId, "explanation")) ?? "";
  const symbols = (await getMarkdown(moduleId, "symbols")) ?? "";
  const workflow = (await getMarkdown(moduleId, "workflow")) ?? "";
  const comparison = (await getMarkdown(moduleId, "comparison")) ?? "";
  const formulas = (await getMarkdown(moduleId, "formulas")) ?? "";
  const example = (await getMarkdown(moduleId, "example")) ?? "";

  let questions = (await getQuestions(moduleId, "practice")) ?? [];

  /**
   * ✅ Fehlertraining-Filter (Primär über URL)
   * Erwartet: ?filterIds=id1,id2,id3
   */
  if (filterIds) {
    const ids = filterIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length > 0) {
      const filtered = questions.filter((q) => ids.includes(q.id));
      // Robust fallback: wenn URL-Filter keine Practice-IDs trifft,
      // zeigen wir alle Aufgaben statt "0 von 0".
      if (filtered.length > 0) {
        questions = filtered;
      }
    }
  }

  /**
   * ✅ Fallback: localStorage (z. B. wenn Seite neu geladen wird)
   * Wird NUR genutzt, wenn keine filterIds in der URL stehen
   */
  // ⚠️ Hinweis: localStorage nur im Client → wir geben die Verantwortung an LearnClient weiter
  // LearnClient kann optional beim Mounten prüfen:
  // localStorage.getItem(`lwf:errorTraining:${moduleId}`)

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <LearnClient
        moduleId={moduleId}
        meta={meta}
        theory={theory}
        symbols={symbols}
        workflow={workflow}
        comparison={comparison}
        formulas={formulas}
        example={example}
        questions={questions}
        initialTab={tab}
      />
    </main>
  );
}
