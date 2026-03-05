// app/exam/[moduleId]/page.tsx
import { notFound } from "next/navigation";

import { getModuleMeta, getQuestions } from "@/lib/content";
import ExamClient from "./ExamClient";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;

  if (!moduleId) return notFound();

  // Existenz-Check (damit /exam/xyz nicht crasht)
  const meta = await getModuleMeta(moduleId);
  if (!meta) return notFound();

  // Exam-Fragen laden
  const questions = (await getQuestions(moduleId, "exam")) ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <ExamClient moduleId={moduleId} questions={questions as any[]} />
    </main>
  );
}
