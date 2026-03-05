export type ExamTiming = {
  startedAt: string;
  submittedAt: string;
  durationSec: number;
  timeSpentSec: number;
  timeLeftSec: number;
  submitReason: "manual" | "timeout";
  timedOut: boolean;
};

export type ExamIntegrity = {
  tabSwitches: number;
  lastTabSwitchAt?: string;
};

export type StoredExamAnswerDraft = {
  value?: string;
  unit?: string;
  textFields?: Record<string, string>;
};

export type StoredExamQuestion = {
  id: string;
  practiceId?: string;
  type?: string;
  prompt: string;
  answer?: unknown;
  tolerance?: number;
  input?: unknown;
  items?: unknown[];
  grading?: unknown;
  meta?: Record<string, unknown>;
  examMeta?: Record<string, unknown>;
};

export type StoredExamQuestionScore = {
  id: string;
  pointsPossible: number;
  pointsEarned: number;
  correct: boolean;
  type: string;
  competency?: string;
  details?: string;
};

export type StoredExamCompetencyScore = {
  competency: string;
  earned: number;
  total: number;
  ratio: number;
  level: "stark" | "stabil" | "kritisch" | "schwach";
};

export type StoredExamGateResult = {
  passPercent?: number;
  mustHaveCompetencies?: Record<string, number>;
  passed: boolean;
  failedBy: string[];
};

export type StoredExamResult = {
  examId: string;
  moduleId: string;
  createdAt: string;
  simulatorId?: string;

  percent: number;
  sumPoints: number;
  totalPoints: number;
  passed?: boolean;

  questions: StoredExamQuestion[];
  answers: Record<string, StoredExamAnswerDraft>;

  scoring?: {
    perQuestion: StoredExamQuestionScore[];
    competencyScores?: StoredExamCompetencyScore[];
    gate?: StoredExamGateResult;
    recommendations?: string[];
  };

  timing?: ExamTiming;
  integrity?: ExamIntegrity;
};

function key(moduleId: string) {
  return `lp:exam:history:${moduleId}`;
}

export function saveExamResult(result: StoredExamResult) {
  const k = key(result.moduleId);
  const raw = localStorage.getItem(k);
  const arr = raw ? (JSON.parse(raw) as StoredExamResult[]) : [];
  arr.unshift(result);
  localStorage.setItem(k, JSON.stringify(arr.slice(0, 20)));
}

export function loadExamHistory(moduleId: string): StoredExamResult[] {
  const raw = localStorage.getItem(key(moduleId));
  const arr = raw ? (JSON.parse(raw) as StoredExamResult[]) : [];

  return arr.map((r) => ({
    ...r,
    passed: typeof (r as any).passed === "boolean" ? (r as any).passed : undefined,
    questions: (r.questions ?? []).map((q) => ({
      ...q,
      practiceId: q.practiceId ?? q.id,
    })),
    answers: Object.fromEntries(
      Object.entries((r as any).answers ?? {}).map(([id, value]) => {
        const v = value as any;
        if (v && typeof v === "object") {
          return [
            id,
            {
              value: typeof v.value === "string" ? v.value : String(v.value ?? ""),
              unit: typeof v.unit === "string" ? v.unit : String(v.unit ?? ""),
              textFields: v.textFields && typeof v.textFields === "object" ? (v.textFields as Record<string, string>) : undefined,
            } satisfies StoredExamAnswerDraft,
          ];
        }
        return [id, { value: "", unit: "" } satisfies StoredExamAnswerDraft];
      })
    ),
  }));
}

export function loadExamById(moduleId: string, examId: string) {
  return loadExamHistory(moduleId).find((x) => x.examId === examId) ?? null;
}

export function deleteExamResult(moduleId: string, examId: string) {
  const k = key(moduleId);
  const arr = loadExamHistory(moduleId).filter((x) => x.examId !== examId);
  localStorage.setItem(k, JSON.stringify(arr));
}

export function clearExamHistory(moduleId: string) {
  localStorage.removeItem(key(moduleId));
}
