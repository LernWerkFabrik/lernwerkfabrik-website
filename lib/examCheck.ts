export const FREE_EXAM_CHECK_MAX_ATTEMPTS = 2;
export const EXAM_CHECK_DURATION_MIN = 12;
export const EXAM_CHECK_QUESTIONS_COUNT = 10;
export const EXAM_CHECK_MIN_QUESTIONS = 8;

export const EXAM_CHECK_READY_PERCENT = 67;
export const EXAM_CHECK_CRITICAL_PERCENT = 55;

export type ExamCheckExam = "AP1" | "AP2" | "AP1_AP2";

export type ExamCheckInputSpec = {
  mode?: "decimal" | "integer";
  maxDecimals?: number;
  allowNegative?: boolean;
};

export type ExamCheckQuestion = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  exam: ExamCheckExam;
  prompt: string;
  answer: { value: number; unit: string };
  tolerance?: number;
  input?: ExamCheckInputSpec;
};

export type ExamCheckStatusLabel = "prüfungsreif" | "kritisch" | "noch nicht";

export function getExamCheckStatus(score: number): ExamCheckStatusLabel {
  if (score >= EXAM_CHECK_READY_PERCENT) return "prüfungsreif";
  if (score >= EXAM_CHECK_CRITICAL_PERCENT) return "kritisch";
  return "noch nicht";
}

