import { getQuestions, listModules } from "@/lib/content";
import {
  EXAM_CHECK_MIN_QUESTIONS,
  type ExamCheckExam,
  type ExamCheckQuestion,
  type ExamCheckInputSpec,
} from "@/lib/examCheck";
import ExamCheckClient from "./ExamCheckClient";

type SearchParams = {
  autostart?: string;
};

type RawQuestion = {
  id?: unknown;
  prompt?: unknown;
  answer?: {
    value?: unknown;
    unit?: unknown;
  };
  tolerance?: unknown;
  input?: ExamCheckInputSpec;
};

function parseExamFromTags(tags?: string[]): ExamCheckExam | null {
  if (!Array.isArray(tags)) return null;
  const set = new Set(tags.map((t) => String(t).trim().toUpperCase()));
  const hasAP1 = set.has("AP1");
  const hasAP2 = set.has("AP2");
  if (hasAP1 && hasAP2) return "AP1_AP2";
  if (hasAP1) return "AP1";
  if (hasAP2) return "AP2";
  return null;
}

function toExamCheckQuestion(
  raw: RawQuestion,
  opts: { moduleId: string; moduleTitle: string; exam: ExamCheckExam }
): ExamCheckQuestion | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : "";
  const value = Number(raw.answer?.value);
  const unit = typeof raw.answer?.unit === "string" ? raw.answer.unit.trim() : "";

  if (!id || !prompt || !Number.isFinite(value) || !unit) return null;

  return {
    id: `${opts.moduleId}::${id}`,
    moduleId: opts.moduleId,
    moduleTitle: opts.moduleTitle,
    exam: opts.exam,
    prompt,
    answer: { value, unit },
    tolerance: typeof raw.tolerance === "number" ? raw.tolerance : undefined,
    input: raw.input,
  };
}

async function buildQuestionPool() {
  const metas = await listModules();

  const candidates = metas
    .map((m) => {
      const exam = parseExamFromTags(m.tags);
      if (!exam) return null;
      return { id: m.id, title: m.title, exam };
    })
    .filter((x): x is { id: string; title: string; exam: ExamCheckExam } => Boolean(x));

  const pool: ExamCheckQuestion[] = [];
  const seen = new Set<string>();

  for (const meta of candidates) {
    const practice = (await getQuestions(meta.id, "practice")) ?? [];
    const exam = (await getQuestions(meta.id, "exam")) ?? [];
    const merged = [...practice, ...exam];

    for (const q of merged) {
      const mapped = toExamCheckQuestion(q as RawQuestion, {
        moduleId: meta.id,
        moduleTitle: meta.title,
        exam: meta.exam,
      });
      if (!mapped) continue;
      if (seen.has(mapped.id)) continue;
      seen.add(mapped.id);
      pool.push(mapped);
    }
  }

  return pool;
}

export default async function ExamCheckPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { autostart } = await searchParams;
  const pool = await buildQuestionPool();

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <ExamCheckClient
        pool={pool}
        autoStart={autostart === "1"}
        hasEnoughPool={pool.length >= EXAM_CHECK_MIN_QUESTIONS}
      />
    </main>
  );
}

