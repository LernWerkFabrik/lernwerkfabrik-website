import { evaluateStructuredTextTask } from "@/lib/learn/textEvaluation";

export type AP1Competency =
  | "auftrag_zeichnen"
  | "arbeitsplanung"
  | "fertigung_technologie"
  | "messen_pruefen"
  | "doku_bewertung"
  | "sicherheit_umwelt";

export type AP1QuestionMeta = {
  points?: number;
  competency?: AP1Competency;
  subskills?: string[];
  examRelevant?: boolean;
  partialTolerance?: number;
  [key: string]: unknown;
};

export type AP1AnswerDraft = {
  value?: string;
  unit?: string;
  textFields?: Record<string, string>;
};

export type AP1Question = {
  id: string;
  type?: string;
  prompt?: string;
  answer?: any;
  tolerance?: number;
  items?: any[];
  grading?: any;
  meta?: AP1QuestionMeta;
};

export type AP1QuestionScore = {
  id: string;
  pointsPossible: number;
  pointsEarned: number;
  correct: boolean;
  type: string;
  competency?: AP1Competency;
  details?: string;
};

export type CompetencyScore = {
  competency: AP1Competency;
  earned: number;
  total: number;
  ratio: number;
  level: "stark" | "stabil" | "kritisch" | "schwach";
};

export type AP1ExamGate = {
  passPercent?: number;
  mustHaveCompetencies?: Partial<Record<AP1Competency, number>>;
};

function normalizeUnit(u: string): string {
  return (u ?? "").trim().toLowerCase();
}

function parseNumber(raw: string | undefined): number {
  return Number(String(raw ?? "").replace(",", "."));
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v));
  const s = String(raw ?? "").trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => String(v));
  } catch {
    return [];
  }
}

function getType(q: AP1Question): string {
  const t = String(q?.type ?? "").trim();
  if (t) return t;
  if (typeof q?.answer?.value === "number") return "numeric";
  return "unknown";
}

function getPoints(meta: AP1QuestionMeta | undefined, fallback = 1): number {
  const n = Number(meta?.points);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function scoreNumeric(q: AP1Question, draft: AP1AnswerDraft): AP1QuestionScore {
  const points = getPoints(q.meta, 3);
  const value = parseNumber(draft.value);
  const expected = Number(q?.answer?.value);
  const expectedUnit = String(q?.answer?.unit ?? "");
  const unitOk = expectedUnit.length === 0 || normalizeUnit(String(draft.unit ?? "")) === normalizeUnit(expectedUnit);
  const tolerance = typeof q?.tolerance === "number" ? q.tolerance : 0;
  const diff = Math.abs(value - expected);
  const valueOk = Number.isFinite(value) && Number.isFinite(expected) && diff <= tolerance;

  let earned = valueOk && unitOk ? points : 0;

  const partialTol = Number(q.meta?.partialTolerance);
  if (!valueOk && unitOk && Number.isFinite(partialTol) && partialTol > tolerance && diff <= partialTol) {
    earned = round2(points * 0.5);
  }

  return {
    id: q.id,
    pointsPossible: points,
    pointsEarned: earned,
    correct: earned >= points,
    type: "numeric",
    competency: q.meta?.competency,
    details: valueOk && unitOk ? "numeric-ok" : "numeric-miss",
  };
}

function scoreSingleChoice(q: AP1Question, draft: AP1AnswerDraft): AP1QuestionScore {
  const points = getPoints(q.meta, 2);
  const selectedRaw = draft.textFields?.choice ?? draft.value ?? "";
  const selected = Number(String(selectedRaw).trim());
  const correctIndex = Number(q?.answer?.correctIndex);
  const ok = Number.isFinite(selected) && selected === correctIndex;
  const earned = ok ? points : 0;
  return {
    id: q.id,
    pointsPossible: points,
    pointsEarned: earned,
    correct: ok,
    type: "single_choice",
    competency: q.meta?.competency,
  };
}

function scoreMultiSelect(q: AP1Question, draft: AP1AnswerDraft): AP1QuestionScore {
  const points = getPoints(q.meta, 3);
  const correctIndices: number[] = Array.isArray(q?.answer?.correctIndices)
    ? q.answer.correctIndices.map((n: any) => Number(n)).filter((n: number) => Number.isInteger(n))
    : [];

  const rawSelected = parseJsonArray(draft.textFields?.multi ?? draft.value ?? "[]")
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n));
  const selectedSet = new Set(rawSelected);
  const correctSet = new Set(correctIndices);

  const correctCount = Math.max(1, correctIndices.length);
  const step = points / correctCount;

  let rawScore = 0;
  for (const idx of selectedSet) {
    rawScore += correctSet.has(idx) ? step : -step;
  }

  const earned = round2(clamp(rawScore, 0, points));
  const full = correctSet.size === selectedSet.size && [...correctSet].every((i) => selectedSet.has(i));

  return {
    id: q.id,
    pointsPossible: points,
    pointsEarned: earned,
    correct: full,
    type: "multi_select",
    competency: q.meta?.competency,
  };
}

function scoreOrder(q: AP1Question, draft: AP1AnswerDraft): AP1QuestionScore {
  const points = getPoints(q.meta, 3);
  const correctOrder = Array.isArray(q?.answer?.correctOrderIds)
    ? q.answer.correctOrderIds.map((v: any) => String(v))
    : Array.isArray(q?.answer?.correctOrder)
    ? q.answer.correctOrder.map((v: any) => String(v))
    : [];

  const selectedOrder = parseJsonArray(draft.textFields?.order ?? draft.value ?? "");
  const total = Math.max(1, correctOrder.length);

  let correctPositions = 0;
  for (let i = 0; i < total; i += 1) {
    if (selectedOrder[i] != null && selectedOrder[i] === correctOrder[i]) correctPositions += 1;
  }

  const score = correctPositions / total;
  const earned = round2(points * score);
  const full = correctPositions === total;

  return {
    id: q.id,
    pointsPossible: points,
    pointsEarned: earned,
    correct: full,
    type: "order",
    competency: q.meta?.competency,
    details: `order-positions:${correctPositions}/${total}`,
  };
}

function scoreStructuredText(q: AP1Question, draft: AP1AnswerDraft): AP1QuestionScore {
  const points = getPoints(q.meta, 4);
  const textFields = draft.textFields ?? {};

  const evaluation = evaluateStructuredTextTask(
    {
      id: q.id,
      type: "structured_text",
      points,
      prompt: String(q.prompt ?? ""),
      answer: q.answer,
      grading: q.grading,
    } as any,
    textFields
  );

  const ratio = evaluation.pointsPossible > 0 ? evaluation.pointsEarned / evaluation.pointsPossible : 0;
  const earned = round2(points * ratio);
  const correct = evaluation.passed;

  return {
    id: q.id,
    pointsPossible: points,
    pointsEarned: earned,
    correct,
    type: "structured_text",
    competency: q.meta?.competency,
    details: evaluation.missingChecklist?.join(" | ") || undefined,
  };
}

export function scoreAp1Question(q: AP1Question, draft: AP1AnswerDraft): AP1QuestionScore {
  const type = getType(q);
  if (type === "single_choice") return scoreSingleChoice(q, draft);
  if (type === "multi_select") return scoreMultiSelect(q, draft);
  if (type === "order") return scoreOrder(q, draft);
  if (type === "structured_text") return scoreStructuredText(q, draft);
  return scoreNumeric(q, draft);
}

export function scoreAp1Set(
  questions: AP1Question[],
  answers: Record<string, AP1AnswerDraft>
): {
  perQuestion: AP1QuestionScore[];
  totalPoints: number;
  earnedPoints: number;
  percent: number;
} {
  const perQuestion = questions.map((q) => scoreAp1Question(q, answers[q.id] ?? {}));
  const totalPoints = round2(perQuestion.reduce((acc, q) => acc + q.pointsPossible, 0));
  const earnedPoints = round2(perQuestion.reduce((acc, q) => acc + q.pointsEarned, 0));
  const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  return { perQuestion, totalPoints, earnedPoints, percent };
}

function classify(ratio: number): CompetencyScore["level"] {
  if (ratio >= 0.8) return "stark";
  if (ratio >= 0.6) return "stabil";
  if (ratio >= 0.4) return "kritisch";
  return "schwach";
}

export function computeCompetencyScores(
  scored: AP1QuestionScore[]
): CompetencyScore[] {
  const map = new Map<AP1Competency, { earned: number; total: number }>();

  for (const row of scored) {
    const c = row.competency;
    if (!c) continue;
    const prev = map.get(c) ?? { earned: 0, total: 0 };
    prev.earned += row.pointsEarned;
    prev.total += row.pointsPossible;
    map.set(c, prev);
  }

  return Array.from(map.entries()).map(([competency, v]) => {
    const ratio = v.total > 0 ? v.earned / v.total : 0;
    return {
      competency,
      earned: round2(v.earned),
      total: round2(v.total),
      ratio: round2(ratio),
      level: classify(ratio),
    };
  });
}

export function evaluateAp1ExamPass(args: {
  percent: number;
  competencyScores: CompetencyScore[];
  gate?: AP1ExamGate;
}): {
  passed: boolean;
  failedBy: string[];
} {
  const passPercent = Number(args.gate?.passPercent ?? 60);
  const mustHave = args.gate?.mustHaveCompetencies ?? {};
  const scoreByComp = new Map(args.competencyScores.map((s) => [s.competency, s.ratio]));
  const failedBy: string[] = [];

  if (args.percent < passPercent) {
    failedBy.push(`gesamt<${passPercent}%`);
  }

  for (const [comp, minRatio] of Object.entries(mustHave) as [AP1Competency, number][]) {
    const actual = scoreByComp.get(comp) ?? 0;
    if (actual < minRatio) {
      failedBy.push(`${comp}<${Math.round(minRatio * 100)}%`);
    }
  }

  return { passed: failedBy.length === 0, failedBy };
}

export function getAp1WeaknessRecommendations(scores: CompetencyScore[]): string[] {
  const weak = scores.filter((s) => s.level === "schwach" || s.level === "kritisch").map((s) => s.competency);
  const rec = new Set<string>();

  for (const c of weak) {
    if (c === "auftrag_zeichnen") rec.add("Technische Zeichnungen + Maße & Toleranzen prüfen");
    if (c === "arbeitsplanung") rec.add("Arbeitsabläufe planen");
    if (c === "fertigung_technologie") rec.add("Fertigungsverfahren + Werkzeuge/Maschinen");
    if (c === "messen_pruefen") rec.add("Maße & Toleranzen prüfen");
    if (c === "doku_bewertung") rec.add("Qualität/Maßnahmen + Dokumentation (Aufbau)");
    if (c === "sicherheit_umwelt") rec.add("Sicherheit & Umwelt");
  }

  return Array.from(rec);
}
