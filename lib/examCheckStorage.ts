import {
  FREE_EXAM_CHECK_MAX_ATTEMPTS,
  EXAM_CHECK_DURATION_MIN,
  type ExamCheckQuestion,
  type ExamCheckStatusLabel,
} from "@/lib/examCheck";

const EXAM_CHECK_STATE_KEY = "lwf:examCheck:state:v1";
const EXAM_CHECK_SESSION_KEY = "lwf:examCheck:session:v1";
const EXAM_CHECK_EVENTS_KEY = "lwf:analytics:events:v1";
const EXAM_CHECK_UPGRADE_CLICK_KEY = "lwf:examCheck:upgradeClick:v1";

type ExamCheckState = {
  exam_check_attempts_used: number;
  exam_check_last_score: number | null;
  exam_check_last_completed_at: string | null;
};

export type ExamCheckAnswer = { value: string; unit: string };

export type ExamCheckSession = {
  v: 1;
  startedAtMs: number;
  durationSec: number;
  index: number;
  visitedIdx: number[];
  questions: ExamCheckQuestion[];
  answers: Record<string, ExamCheckAnswer>;
};

export type ExamCheckInfo = {
  maxAttempts: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  lastScore: number | null;
  lastCompletedAt: string | null;
  hasActiveSession: boolean;
};

export type ExamCheckEventName =
  | "exam_check_card_viewed"
  | "exam_check_started"
  | "exam_check_completed"
  | "exam_check_upgraded_click"
  | "exam_check_upgrade_success";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeReadState(): ExamCheckState {
  if (typeof window === "undefined") {
    return {
      exam_check_attempts_used: 0,
      exam_check_last_score: null,
      exam_check_last_completed_at: null,
    };
  }

  const parsed = safeParse<Partial<ExamCheckState>>(localStorage.getItem(EXAM_CHECK_STATE_KEY));
  const usedRaw = Number(parsed?.exam_check_attempts_used ?? 0);
  const used = Number.isFinite(usedRaw) ? Math.max(0, Math.floor(usedRaw)) : 0;

  const scoreRaw = parsed?.exam_check_last_score;
  const score =
    typeof scoreRaw === "number" && Number.isFinite(scoreRaw)
      ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
      : null;

  const completedAt =
    typeof parsed?.exam_check_last_completed_at === "string" && parsed.exam_check_last_completed_at.trim().length
      ? parsed.exam_check_last_completed_at
      : null;

  return {
    exam_check_attempts_used: used,
    exam_check_last_score: score,
    exam_check_last_completed_at: completedAt,
  };
}

function safeWriteState(next: ExamCheckState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXAM_CHECK_STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function readExamCheckSession(): ExamCheckSession | null {
  if (typeof window === "undefined") return null;
  const parsed = safeParse<ExamCheckSession>(localStorage.getItem(EXAM_CHECK_SESSION_KEY));
  if (!parsed || parsed.v !== 1) return null;
  if (!Array.isArray(parsed.questions) || !parsed.questions.length) return null;
  if (!Number.isFinite(parsed.startedAtMs) || !Number.isFinite(parsed.durationSec)) return null;
  return parsed;
}

export function writeExamCheckSession(session: ExamCheckSession) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXAM_CHECK_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearExamCheckSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EXAM_CHECK_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getExamCheckInfo(): ExamCheckInfo {
  const state = safeReadState();
  const attemptsUsed = Math.min(FREE_EXAM_CHECK_MAX_ATTEMPTS, state.exam_check_attempts_used);
  const attemptsRemaining = Math.max(0, FREE_EXAM_CHECK_MAX_ATTEMPTS - attemptsUsed);
  const hasActiveSession = Boolean(readExamCheckSession());

  return {
    maxAttempts: FREE_EXAM_CHECK_MAX_ATTEMPTS,
    attemptsUsed,
    attemptsRemaining,
    lastScore: state.exam_check_last_score,
    lastCompletedAt: state.exam_check_last_completed_at,
    hasActiveSession,
  };
}

export function consumeExamCheckAttempt(): { ok: boolean; used: number; remaining: number; max: number } {
  const current = safeReadState();
  const currentUsed = Math.min(FREE_EXAM_CHECK_MAX_ATTEMPTS, current.exam_check_attempts_used);
  if (currentUsed >= FREE_EXAM_CHECK_MAX_ATTEMPTS) {
    return { ok: false, used: currentUsed, remaining: 0, max: FREE_EXAM_CHECK_MAX_ATTEMPTS };
  }

  const nextUsed = currentUsed + 1;
  safeWriteState({
    ...current,
    exam_check_attempts_used: nextUsed,
  });

  return {
    ok: true,
    used: nextUsed,
    remaining: Math.max(0, FREE_EXAM_CHECK_MAX_ATTEMPTS - nextUsed),
    max: FREE_EXAM_CHECK_MAX_ATTEMPTS,
  };
}

export function saveExamCheckResult(score: number) {
  const current = safeReadState();
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  safeWriteState({
    ...current,
    exam_check_last_score: normalized,
    exam_check_last_completed_at: new Date().toISOString(),
  });
}

export function createExamCheckSession(questions: ExamCheckQuestion[]): ExamCheckSession {
  const now = Date.now();
  return {
    v: 1,
    startedAtMs: now,
    durationSec: EXAM_CHECK_DURATION_MIN * 60,
    index: 0,
    visitedIdx: [0],
    questions,
    answers: Object.fromEntries(
      questions.map((q) => [q.id, { value: "", unit: q.answer.unit } satisfies ExamCheckAnswer])
    ),
  };
}

export function trackExamCheckEvent(
  name: ExamCheckEventName,
  payload?: Record<string, string | number | boolean | null | undefined>
) {
  if (typeof window === "undefined") return;
  try {
    const nowIso = new Date().toISOString();
    const event = {
      name,
      ts: nowIso,
      payload: payload ?? {},
    };

    const arr = safeParse<Array<{ name: string; ts: string; payload: Record<string, unknown> }>>(
      localStorage.getItem(EXAM_CHECK_EVENTS_KEY)
    ) ?? [];
    arr.unshift(event);
    localStorage.setItem(EXAM_CHECK_EVENTS_KEY, JSON.stringify(arr.slice(0, 200)));

    window.dispatchEvent(new CustomEvent("lp:analytics", { detail: event }));
  } catch {
    // ignore
  }
}

export function markExamCheckUpgradeIntent(source: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      EXAM_CHECK_UPGRADE_CLICK_KEY,
      JSON.stringify({ source, ts: new Date().toISOString() })
    );
  } catch {
    // ignore
  }
  trackExamCheckEvent("exam_check_upgraded_click", { source });
}

export function trackExamCheckUpgradeSuccessIfEligible(plan: "free" | "pro") {
  if (typeof window === "undefined") return;
  if (plan !== "pro") return;

  const marker = safeParse<{ source?: string; ts?: string }>(localStorage.getItem(EXAM_CHECK_UPGRADE_CLICK_KEY));
  if (!marker) return;

  trackExamCheckEvent("exam_check_upgrade_success", {
    source: marker.source ?? "unknown",
    clicked_at: marker.ts ?? null,
  });

  try {
    localStorage.removeItem(EXAM_CHECK_UPGRADE_CLICK_KEY);
  } catch {
    // ignore
  }
}

export function getExamCheckStatusBadge(info: ExamCheckInfo): "Verfügbar" | "1 Versuch übrig" | "Aufgebraucht" {
  if (!info.hasActiveSession && info.attemptsRemaining <= 0) return "Aufgebraucht";
  if (info.attemptsRemaining === 1) return "1 Versuch übrig";
  return "Verfügbar";
}

export function getExamCheckResultCopy(status: ExamCheckStatusLabel) {
  if (status === "prüfungsreif") {
    return "Starke Basis. Jetzt im vollständigen Prüfungs-Simulator absichern.";
  }
  if (status === "kritisch") {
    return "Du bist nah dran - aber aktuell würdest du die Prüfung wahrscheinlich nicht bestehen.";
  }
  return "Aktuell noch nicht prüfungsreif. Starte gezielt Training und arbeite mit dem Simulator.";
}
