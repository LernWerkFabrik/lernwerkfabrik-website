"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { saveExamResult, type StoredExamAnswerDraft } from "@/lib/examStorage";
import {
  computeCompetencyScores,
  evaluateAp1ExamPass,
  getAp1WeaknessRecommendations,
  scoreAp1Set,
  type AP1Competency,
  type AP1ExamGate,
  type AP1QuestionScore,
} from "@/lib/ap1WorktasksScoring";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import Surface from "@/components/Surface";

type InputSpec = {
  mode?: "decimal" | "integer";
  maxDecimals?: number;
  allowNegative?: boolean;
};

type Question = {
  id: string;
  practiceId?: string;
  type?: string;
  prompt: string;
  answer?: any;
  tolerance?: number;
  input?: InputSpec;
  items?: any[];
  grading?: any;
  meta?: {
    mode?: "competency_check" | string;
    points?: number;
    competency?: AP1Competency;
    examRelevant?: boolean;
    noHints?: boolean;
    deferSolutions?: boolean;
    [key: string]: unknown;
  };
  examMeta?: {
    mode?: "competency_check" | string;
    durationMinutes?: number;
    passPercent?: number;
    mustHaveCompetencies?: Partial<Record<AP1Competency, number>>;
    [key: string]: unknown;
  };
};

type NormalizedQuestion = Question & {
  tolerance: number;
  practiceId: string;
  input: Required<Pick<InputSpec, "mode" | "allowNegative">> & Pick<InputSpec, "maxDecimals">;
};

type ScoreViewRow = {
  q: NormalizedQuestion;
  score: AP1QuestionScore;
};

type ExamEvaluation = {
  perQuestion: ScoreViewRow[];
  sum: number;
  totalPoints: number;
  percent: number;
  passed: boolean;
  gateFailedBy: string[];
  competencyScores: ReturnType<typeof computeCompetencyScores>;
  recommendations: string[];
  wrongPracticeIds: string[];
};

function normalizeUnit(u: string) {
  return (u || "").trim().toLowerCase();
}

function parseNumber(s: string) {
  return Number(String(s).replace(",", "."));
}

function getExpectedUnit(q: Question): string {
  const u = q?.answer && typeof q.answer === "object" ? q.answer.unit : "";
  return typeof u === "string" ? u : "";
}

function makeEmptyAnswerDraft(q: Question): StoredExamAnswerDraft {
  return { value: "", unit: getExpectedUnit(q), textFields: {} };
}

function isNumericQuestion(q: Question): boolean {
  return typeof q?.answer?.value === "number" && Number.isFinite(q.answer.value);
}

function normalizeGate(raw?: Question["examMeta"]): AP1ExamGate | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const passPercentRaw = Number(raw.passPercent);
  const passPercent = Number.isFinite(passPercentRaw) ? passPercentRaw : 60;

  const mustHaveRaw = raw.mustHaveCompetencies;
  const mustHaveCompetencies: Partial<Record<AP1Competency, number>> = {};

  if (mustHaveRaw && typeof mustHaveRaw === "object") {
    for (const [k, v] of Object.entries(mustHaveRaw)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) {
        mustHaveCompetencies[k as AP1Competency] = n;
      }
    }
  }

  return {
    passPercent,
    mustHaveCompetencies: Object.keys(mustHaveCompetencies).length ? mustHaveCompetencies : undefined,
  };
}

function getExamDurationMinutes(
  moduleId: string,
  questions: NormalizedQuestion[]
): number {
  const fromMeta = questions.find((q) => q.examMeta && typeof q.examMeta === "object")?.examMeta;
  const configured = Number(fromMeta?.durationMinutes);
  if (Number.isFinite(configured) && configured > 0) return configured;

  if (moduleId === "ap1-rechen-fachaufgaben") return 90;

  const isCompetencyCheck =
    moduleId === "ap1-arbeitsaufgaben" &&
    questions.some((q) => String(q.meta?.mode ?? fromMeta?.mode ?? "").trim().toLowerCase() === "competency_check");

  if (isCompetencyCheck) return 15;
  return 60;
}

function scoreDefaultSet(
  questions: NormalizedQuestion[],
  answers: Record<string, StoredExamAnswerDraft>
): ExamEvaluation {
  const pointsPerQuestion = 10;
  const perQuestion: ScoreViewRow[] = questions.map((q) => {
    const a = answers[q.id] ?? makeEmptyAnswerDraft(q);
    const value = parseNumber(a.value ?? "");
    const expected = Number(q.answer?.value);
    const expectedUnit = getExpectedUnit(q);
    const valueOk = isNumericQuestion(q) && Number.isFinite(value) && Math.abs(value - expected) <= q.tolerance;
    const unitOk = expectedUnit.length === 0 || normalizeUnit(a.unit ?? "") === normalizeUnit(expectedUnit);
    const valuePoints = valueOk ? Math.round(pointsPerQuestion * 0.8) : 0;
    const unitPoints = unitOk ? pointsPerQuestion - Math.round(pointsPerQuestion * 0.8) : 0;
    const points = valuePoints + unitPoints;

    return {
      q,
      score: {
        id: q.id,
        pointsPossible: pointsPerQuestion,
        pointsEarned: points,
        correct: points >= pointsPerQuestion,
        type: "numeric",
        competency: q.meta?.competency,
      },
    };
  });

  const sum = perQuestion.reduce((acc, row) => acc + row.score.pointsEarned, 0);
  const totalPoints = perQuestion.reduce((acc, row) => acc + row.score.pointsPossible, 0);
  const percent = totalPoints > 0 ? Math.round((sum / totalPoints) * 100) : 0;
  const wrongPracticeIds = Array.from(
    new Set(
      perQuestion
        .filter((row) => row.score.pointsEarned < row.score.pointsPossible)
        .map((row) => row.q.practiceId ?? row.q.id)
    )
  );

  return {
    perQuestion,
    sum,
    totalPoints,
    percent,
    passed: percent >= 60,
    gateFailedBy: [],
    competencyScores: [],
    recommendations: [],
    wrongPracticeIds,
  };
}

function scoreAp1Exam(
  questions: NormalizedQuestion[],
  answers: Record<string, StoredExamAnswerDraft>,
  gate?: AP1ExamGate
): ExamEvaluation {
  const scored = scoreAp1Set(questions as any, answers as any);
  const rows = questions.map((q) => ({
    q,
    score:
      scored.perQuestion.find((s) => s.id === q.id) ??
      ({
        id: q.id,
        pointsPossible: Number(q.meta?.points ?? 1),
        pointsEarned: 0,
        correct: false,
        type: String(q.type ?? "unknown"),
        competency: q.meta?.competency,
      } as AP1QuestionScore),
  }));

  const competencyScores = computeCompetencyScores(scored.perQuestion);
  const gateResult = evaluateAp1ExamPass({
    percent: scored.percent,
    competencyScores,
    gate,
  });
  const wrongPracticeIds = Array.from(
    new Set(
      rows
        .filter((row) => row.score.pointsEarned < row.score.pointsPossible)
        .map((row) => row.q.practiceId ?? row.q.id)
    )
  );

  return {
    perQuestion: rows,
    sum: scored.earnedPoints,
    totalPoints: scored.totalPoints,
    percent: scored.percent,
    passed: gateResult.passed,
    gateFailedBy: gateResult.failedBy,
    competencyScores,
    recommendations: getAp1WeaknessRecommendations(competencyScores),
    wrongPracticeIds,
  };
}

function scoreExamSet(
  moduleId: string,
  questions: NormalizedQuestion[],
  answers: Record<string, StoredExamAnswerDraft>,
  gate?: AP1ExamGate
): ExamEvaluation {
  if (moduleId === "ap1-arbeitsaufgaben") {
    return scoreAp1Exam(questions, answers, gate);
  }
  return scoreDefaultSet(questions, answers);
}

function makeExamId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeInputSpec(
  spec?: InputSpec
): Required<Pick<InputSpec, "mode" | "allowNegative">> & Pick<InputSpec, "maxDecimals"> {
  return {
    mode: spec?.mode ?? "decimal",
    allowNegative: spec?.allowNegative ?? false,
    maxDecimals: typeof spec?.maxDecimals === "number" ? spec.maxDecimals : undefined,
  };
}

function encodeCsv(ids: string[]) {
  return ids
    .map((s) => String(s).trim())
    .filter(Boolean)
    .join(",");
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return hh > 0 ? `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}` : `${pad2(mm)}:${pad2(ss)}`;
}

type PersistedExamSession = {
  v: 1;
  moduleId: string;
  durationSec: number;
  startedAtMs: number;

  index: number;
  visitedIdx: number[];
  answers: Record<string, StoredExamAnswerDraft>;

  warn10Shown: boolean;
  warn5Shown: boolean;

  tabSwitchCount: number;
};

function sessionKey(moduleId: string) {
  return `lwf:examSession:${moduleId}`;
}

function safeReadSession(moduleId: string): PersistedExamSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(moduleId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedExamSession;
    if (!parsed || parsed.v !== 1) return null;
    if (parsed.moduleId !== moduleId) return null;
    if (!Number.isFinite(parsed.durationSec) || !Number.isFinite(parsed.startedAtMs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWriteSession(moduleId: string, data: PersistedExamSession) {
  try {
    localStorage.setItem(sessionKey(moduleId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

function safeClearSession(moduleId: string) {
  try {
    localStorage.removeItem(sessionKey(moduleId));
  } catch {
    // ignore
  }
}

export default function ExamClient({
  moduleId,
  questions,
}: {
  moduleId: string;
  questions: Question[];
}) {
  const router = useRouter();

  const qs = useMemo<NormalizedQuestion[]>(
    () =>
      questions.map((q) => ({
        ...q,
        tolerance: typeof q.tolerance === "number" ? q.tolerance : 0.01,
        practiceId: q.practiceId ?? q.id,
        input: normalizeInputSpec(q.input),
      })),
    [questions]
  );
  const examGate = useMemo(() => {
    if (moduleId !== "ap1-arbeitsaufgaben") return undefined;
    const withMeta = qs.find((q) => q.examMeta && typeof q.examMeta === "object");
    return normalizeGate(withMeta?.examMeta);
  }, [moduleId, qs]);
  const isCompetencyCheckMode = useMemo(
    () =>
      qs.some((q) => String(q.meta?.mode ?? q.examMeta?.mode ?? "").trim().toLowerCase() === "competency_check"),
    [qs]
  );

  // =========================
  // AP1-Prüfungszeit (realistisch)
  // =========================
  const EXAM_DURATION_MINUTES = useMemo(() => getExamDurationMinutes(moduleId, qs), [moduleId, qs]);
  const durationSec = EXAM_DURATION_MINUTES * 60;

  // =========================
  // Session-State (persistiert)
  // =========================
  const [submitted, setSubmitted] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));

  const [answers, setAnswers] = useState<Record<string, StoredExamAnswerDraft>>(() =>
    Object.fromEntries(qs.map((q) => [q.id, makeEmptyAnswerDraft(q)]))
  );

  // Timer: Startzeit soll NICHT durch rerender/reset verloren gehen
  const startedAtMsRef = useRef<number>(Date.now());
  const [startedAtIso, setStartedAtIso] = useState<string>(() => new Date().toISOString());
  const [timeLeftSec, setTimeLeftSec] = useState<number>(durationSec);
  const timeoutSubmittedRef = useRef(false);
  const prevLeftRef = useRef<number>(durationSec);

  // Warnings
  const [warn10Open, setWarn10Open] = useState(false);
  const [warn5Open, setWarn5Open] = useState(false);
  const [warn10Shown, setWarn10Shown] = useState(false);
  const [warn5Shown, setWarn5Shown] = useState(false);

  // Submit confirm
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tab switch
  const [tabWarnOpen, setTabWarnOpen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const current = qs[index];
  const currentInput = current?.input ?? normalizeInputSpec(undefined);
  const currentPoints = moduleId === "ap1-arbeitsaufgaben" ? Number(current?.meta?.points ?? 1) : 10;
  const modeTitle = isCompetencyCheckMode ? "Kompetenz-Check" : "Pruefungsmodus";
  const modeSubtitle = isCompetencyCheckMode
    ? "Modulinterner Kompetenz-Check ohne Hilfen. Die Auswertung erscheint erst nach Abgabe."
    : "Keine Hilfe waehrend der Pruefung. Nach Abgabe bekommst du Auswertung und Feedback.";
  const submitCta = isCompetencyCheckMode ? "Check abgeben" : "Pruefung abgeben";
  const submitDialogTitle = isCompetencyCheckMode ? "Kompetenz-Check jetzt abgeben?" : "Pruefung wirklich abgeben?";

  // =========================
  // Restore persisted session on mount
  // =========================
  useEffect(() => {
    if (!qs.length) return;

    const sess = safeReadSession(moduleId);
    if (!sess) {
      // create initial session
      const now = Date.now();
      startedAtMsRef.current = now;
      setStartedAtIso(new Date(now).toISOString());
      setTimeLeftSec(durationSec);
      prevLeftRef.current = durationSec;

      safeWriteSession(moduleId, {
        v: 1,
        moduleId,
        durationSec,
        startedAtMs: now,
        index: 0,
        visitedIdx: [0],
        answers: Object.fromEntries(qs.map((q) => [q.id, makeEmptyAnswerDraft(q)])),
        warn10Shown: false,
        warn5Shown: false,
        tabSwitchCount: 0,
      });
      return;
    }

    // If duration changed between builds, keep existing start but clamp
    startedAtMsRef.current = sess.startedAtMs;
    setStartedAtIso(new Date(sess.startedAtMs).toISOString());

    const restoredAnswers = sess.answers ?? {};
    const mergedAnswers: Record<string, StoredExamAnswerDraft> = Object.fromEntries(
      qs.map((q) => {
        const a = restoredAnswers[q.id];
        if (!a || typeof a !== "object") return [q.id, makeEmptyAnswerDraft(q)];
        return [
          q.id,
          {
            value: String((a as any).value ?? ""),
            unit: String((a as any).unit ?? getExpectedUnit(q)),
            textFields:
              (a as any).textFields && typeof (a as any).textFields === "object"
                ? ((a as any).textFields as Record<string, string>)
                : {},
          } satisfies StoredExamAnswerDraft,
        ];
      })
    );

    setAnswers(mergedAnswers);
    setIndex(Math.min(Math.max(0, sess.index ?? 0), qs.length - 1));

    const vset = new Set<number>();
    for (const n of sess.visitedIdx ?? []) {
      const idx = Number(n);
      if (Number.isFinite(idx) && idx >= 0 && idx < qs.length) vset.add(idx);
    }
    if (vset.size === 0) vset.add(0);
    setVisited(vset);

    setWarn10Shown(!!sess.warn10Shown);
    setWarn5Shown(!!sess.warn5Shown);
    setTabSwitchCount(Number.isFinite(sess.tabSwitchCount) ? sess.tabSwitchCount : 0);

    // compute initial time left from start
    const elapsed = Math.floor((Date.now() - sess.startedAtMs) / 1000);
    const left = Math.max(0, (sess.durationSec ?? durationSec) - elapsed);
    setTimeLeftSec(left);
    prevLeftRef.current = left;
  }, [moduleId, qs, durationSec]);

  // =========================
  // Persist session on changes (answers/index/visited/warnings/tabSwitchCount)
  // =========================
  const persistTimer = useRef<number | null>(null);

  function schedulePersist(next: Partial<PersistedExamSession>) {
    if (submitted) return;

    // debounce mini (damit input nicht bei jedem keystroke blockt)
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      const existing = safeReadSession(moduleId);
      const base: PersistedExamSession =
        existing ?? ({
          v: 1,
          moduleId,
          durationSec,
          startedAtMs: startedAtMsRef.current,
          index,
          visitedIdx: Array.from(visited),
          answers,
          warn10Shown,
          warn5Shown,
          tabSwitchCount,
        } as PersistedExamSession);

      const merged: PersistedExamSession = {
        ...base,
        ...next,
        v: 1,
        moduleId,
      };

      safeWriteSession(moduleId, merged);
    }, 120);
  }

  useEffect(() => {
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, []);

  // =========================
  // Timer tick (hard, no pause) + thresholds + auto-submit
  // =========================
  useEffect(() => {
    if (submitted) return;

    const tick = () => {
      const sess = safeReadSession(moduleId);
      const dSec = sess?.durationSec ?? durationSec;
      const startMs = sess?.startedAtMs ?? startedAtMsRef.current;

      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const left = Math.max(0, dSec - elapsed);

      setTimeLeftSec(left);

      const prev = prevLeftRef.current;
      prevLeftRef.current = left;

      // one-time warnings when crossing thresholds
      if (!warn10Shown && prev > 10 * 60 && left <= 10 * 60 && left > 0) {
        setWarn10Open(true);
        setWarn10Shown(true);
        schedulePersist({ warn10Shown: true });
      }
      if (!warn5Shown && prev > 5 * 60 && left <= 5 * 60 && left > 0) {
        setWarn5Open(true);
        setWarn5Shown(true);
        schedulePersist({ warn5Shown: true });
      }

      if (left <= 0 && !timeoutSubmittedRef.current) {
        timeoutSubmittedRef.current = true;
        setConfirmOpen(false);
        setWarn10Open(false);
        setWarn5Open(false);
        setTabWarnOpen(false);
        submitNow({ reason: "timeout" });
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, moduleId, durationSec, warn10Shown, warn5Shown]);

  // =========================
  // Prevent accidental leaving (browser prompt)
  // =========================
  useEffect(() => {
    if (submitted) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [submitted]);

  // =========================
  // Tab visibility tracking (realistic proctoring-lite)
  // =========================
  useEffect(() => {
    if (submitted) return;

    const onVis = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => {
          const next = c + 1;
          schedulePersist({ tabSwitchCount: next });
          return next;
        });
        setTabWarnOpen(true);
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  // =========================
  // Helpers
  // =========================
  function setAnswer(qid: string, patch: Partial<StoredExamAnswerDraft>) {
    setAnswers((prev) => {
      const fallbackQuestion = qs.find((q) => q.id === qid) ?? ({ id: qid, prompt: "" } as Question);
      const base = prev[qid] ?? makeEmptyAnswerDraft(fallbackQuestion);
      const next = { ...prev, [qid]: { ...base, ...patch } };
      schedulePersist({ answers: next });
      return next;
    });
  }

  function goto(i: number) {
    const clamped = Math.min(Math.max(0, i), qs.length - 1);
    setIndex(clamped);
    setVisited((s) => {
      const next = new Set(s);
      next.add(clamped);
      schedulePersist({ index: clamped, visitedIdx: Array.from(next) });
      return next;
    });
    schedulePersist({ index: clamped });
  }

  function isQuestionAnswered(q: NormalizedQuestion, draft: StoredExamAnswerDraft | undefined): boolean {
    if (!draft) return false;
    const type = String(q.type ?? "").trim();

    if (type === "structured_text") {
      const fields = draft.textFields ?? {};
      return Object.values(fields).some((v) => String(v ?? "").trim().length > 0);
    }

    const value = String(draft.value ?? "").trim();
    const unit = String(draft.unit ?? "").trim();
    const expectedUnit = getExpectedUnit(q);
    if (!value.length) return false;
    if (expectedUnit.length > 0 && !unit.length) return false;
    return true;
  }

  function computeAnswerState() {
    const total = qs.length;

    let answered = 0;
    let empty = 0;

    for (const q of qs) {
      const a = answers[q.id];
      if (isQuestionAnswered(q, a)) answered += 1;
      else empty += 1;
    }

    const visitedCount = visited.size;
    const notVisited = Math.max(0, total - visitedCount);

    return { total, answered, empty, visitedCount, notVisited };
  }

  const liveEvaluation = useMemo(
    () => scoreExamSet(moduleId, qs, answers, examGate),
    [moduleId, qs, answers, examGate]
  );
  const results = submitted ? liveEvaluation : null;
  const wrongPracticeIds = results?.wrongPracticeIds ?? [];
  const wrongCount = wrongPracticeIds.length;

  function persistErrorTrainingIds(ids: string[]) {
    try {
      const key = `lwf:errorTraining:${moduleId}`;
      localStorage.setItem(key, JSON.stringify({ ids, createdAt: new Date().toISOString() }));
    } catch {
      // ignore
    }
  }

  function startErrorTraining() {
    const ids = wrongPracticeIds;
    if (!ids.length) {
      router.push(`/learn/${moduleId}?tab=practice`);
      return;
    }

    persistErrorTrainingIds(ids);

    const csv = encodeCsv(ids);
    const url = `/learn/${moduleId}?tab=practice&filterIds=${encodeURIComponent(csv)}`;
    router.push(url);
  }

  function submitNow(meta?: { reason: "manual" | "timeout" }) {
    const scored = scoreExamSet(moduleId, qs, answers, examGate);

    const id = makeExamId();
    setExamId(id);

    const submittedAtIso = new Date().toISOString();

    const sess = safeReadSession(moduleId);
    const startMs = sess?.startedAtMs ?? startedAtMsRef.current;
    const dSec = sess?.durationSec ?? durationSec;

    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    const spentSec = Math.min(dSec, Math.max(0, elapsed));
    const left = Math.max(0, dSec - spentSec);

    const payload = {
      examId: id,
      moduleId,
      createdAt: submittedAtIso,
      percent: scored.percent,
      sumPoints: scored.sum,
      totalPoints: scored.totalPoints,
      passed: scored.passed,
      questions: qs.map((q) => ({
        id: q.id,
        practiceId: q.practiceId ?? q.id,
        type: q.type,
        prompt: q.prompt,
        answer: q.answer,
        tolerance: q.tolerance,
        input: q.input,
        items: q.items,
        grading: q.grading,
        meta: q.meta,
        examMeta: q.examMeta,
      })),
      answers,
      scoring: {
        perQuestion: scored.perQuestion.map((row) => row.score),
        competencyScores: scored.competencyScores,
        gate: {
          passPercent: examGate?.passPercent ?? 60,
          mustHaveCompetencies: examGate?.mustHaveCompetencies as Record<string, number> | undefined,
          passed: scored.passed,
          failedBy: scored.gateFailedBy,
        },
        recommendations: scored.recommendations,
      },

      // Timing + Prüfungsintegrität
      timing: {
        startedAt: new Date(startMs).toISOString(),
        submittedAt: submittedAtIso,
        durationSec: dSec,
        timeSpentSec: spentSec,
        timeLeftSec: left,
        submitReason: meta?.reason ?? "manual",
        timedOut: (meta?.reason ?? "manual") === "timeout",
      },
      integrity: {
        tabSwitches: tabSwitchCount,
      },
    } as any;

    saveExamResult(payload);

    setSubmitted(true);
    safeClearSession(moduleId);
  }

  function resetExam() {
    // Realismus: neue Prüfung = neue Session
    setSubmitted(false);
    setExamId(null);

    timeoutSubmittedRef.current = false;

    const now = Date.now();
    startedAtMsRef.current = now;
    setStartedAtIso(new Date(now).toISOString());
    setTimeLeftSec(durationSec);
    prevLeftRef.current = durationSec;

    setIndex(0);
    setVisited(new Set([0]));
    setAnswers(Object.fromEntries(qs.map((q) => [q.id, makeEmptyAnswerDraft(q)])));

    setWarn10Open(false);
    setWarn5Open(false);
    setWarn10Shown(false);
    setWarn5Shown(false);

    setTabWarnOpen(false);
    setTabSwitchCount(0);

    safeWriteSession(moduleId, {
      v: 1,
      moduleId,
      durationSec,
      startedAtMs: now,
      index: 0,
      visitedIdx: [0],
      answers: Object.fromEntries(qs.map((q) => [q.id, makeEmptyAnswerDraft(q)])),
      warn10Shown: false,
      warn5Shown: false,
      tabSwitchCount: 0,
    });

    try {
      localStorage.removeItem(`lwf:errorTraining:${moduleId}`);
    } catch {
      // ignore
    }
  }

  if (!qs.length) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Keine Prüfungsfragen gefunden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Für dieses Modul gibt es noch keine <code>questions.exam.json</code>.
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={`/module/${moduleId}`}>Zurück zum Modul</Link>
              </Button>
            </CardContent>
          </Card>
        </Surface>
      </div>
    );
  }

  const state = computeAnswerState();
  const passed = results ? results.passed : false;

  const timerVariant =
    submitted
      ? "secondary"
      : timeLeftSec <= 5 * 60
      ? "destructive"
      : timeLeftSec <= 10 * 60
      ? "secondary"
      : "outline";

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <Surface tone="neutral" className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">
              {modeTitle}: <span className="font-mono [overflow-wrap:anywhere]">{moduleId}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {modeSubtitle}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:flex-col md:items-end">
            <Badge
              variant={timerVariant as any}
              className={[
                "rounded-full font-mono tabular-nums whitespace-nowrap",
                !submitted && timeLeftSec <= 5 * 60 ? "animate-pulse" : "",
              ].join(" ")}
              title={
                submitted
                  ? "Timer gestoppt"
                  : timeLeftSec <= 0
                  ? "Zeit abgelaufen - automatisch abgegeben"
                  : `Restzeit (${isCompetencyCheckMode ? "Checkdauer" : "Pruefungsdauer"}: ${EXAM_DURATION_MINUTES} min)`
              }
            >
              Zeit: {formatCountdown(timeLeftSec)}
            </Badge>

            <Badge variant={submitted ? "secondary" : "default"} className="rounded-full">
              {submitted ? "Abgegeben" : "In Bearbeitung"}
            </Badge>

            {!submitted && tabSwitchCount > 0 ? (
              <Badge variant="destructive" className="rounded-full">
                Tab-Wechsel: {tabSwitchCount}
              </Badge>
            ) : null}
          </div>
        </div>
      </Surface>

      {!submitted ? (
        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold">
                  Aufgabe {index + 1} von {qs.length}
                </span>
                <span className="text-sm font-normal text-muted-foreground">{currentPoints} Punkte</span>
              </CardTitle>

              <Separator className="bg-border/60" />

              <div className="rounded-xl border bg-card/60 p-4 text-card-foreground backdrop-blur">
                <div className="text-xs text-muted-foreground">Aufgabenstellung</div>
                <p className="mt-1 text-base font-semibold leading-relaxed text-foreground">{current.prompt}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-foreground">Ergebnis</label>
                  <Input
                    numeric
                    numericMode={currentInput.mode}
                    allowNegative={currentInput.allowNegative}
                    maxDecimals={currentInput.mode === "decimal" ? currentInput.maxDecimals : undefined}
                    value={answers[current.id]?.value ?? ""}
                    onChange={(e) => setAnswer(current.id, { value: e.target.value })}
                    placeholder={currentInput.mode === "integer" ? "Ganze Zahl eingeben" : "Zahl eingeben"}
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <label className="text-sm font-medium text-foreground">Einheit</label>
                  <Input
                    value={answers[current.id]?.unit ?? ""}
                    onChange={(e) => setAnswer(current.id, { unit: e.target.value })}
                    placeholder={getExpectedUnit(current)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => goto(Math.max(index - 1, 0))}
                  disabled={index === 0}
                >
                  Zurück
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => goto(Math.min(index + 1, qs.length - 1))}
                  disabled={index === qs.length - 1}
                >
                  Nächste
                </Button>
              </div>

              <Button className="mt-3 w-full rounded-full" onClick={() => setConfirmOpen(true)}>
                {submitCta}
              </Button>

              <p className="text-xs text-muted-foreground">
                Hinweis: Ergebnis kann mit Komma eingegeben werden (z. B. 10,5).
              </p>
            </CardContent>
          </Card>

          {/* Abgabe-Dialog */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent className="sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>{submitDialogTitle}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Nach dem finalen Abgeben wird dein Ergebnis gespeichert und du bekommst die Auswertung.</p>

                    <div className="rounded-lg border bg-card/60 p-3 backdrop-blur">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Beantwortet: {state.answered}/{state.total}</Badge>
                        {state.empty > 0 ? (
                          <Badge variant="destructive">Offen: {state.empty}</Badge>
                        ) : (
                          <Badge variant="default">Alles beantwortet</Badge>
                        )}
                        {state.notVisited > 0 ? (
                          <Badge variant="secondary">Nicht angesehen: {state.notVisited}</Badge>
                        ) : null}
                      </div>

                      {state.empty > 0 ? (
                        <p className="mt-2">
                          Du hast noch <b>{state.empty}</b> Aufgabe(n) ohne vollständige Antwort. Wenn du jetzt abgibst,
                          werden diese sehr wahrscheinlich als falsch gewertet.
                        </p>
                      ) : (
                        <p className="mt-2">Sieht gut aus. Wenn du bereit bist, kannst du final abgeben.</p>
                      )}
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="gap-2 sm:gap-2">
                <AlertDialogCancel asChild>
                  <Button variant="outline" className="rounded-full">
                    Abbrechen
                  </Button>
                </AlertDialogCancel>

                <AlertDialogAction asChild>
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setConfirmOpen(false);
                      submitNow({ reason: "manual" });
                    }}
                  >
                    Final abgeben
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Warnung 10 Minuten */}
          <AlertDialog open={warn10Open} onOpenChange={setWarn10Open}>
            <AlertDialogContent className="sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Zeitwarnung</AlertDialogTitle>
                <AlertDialogDescription>
                  Es sind noch <b>10 Minuten</b> übrig. Prüfe offene Aufgaben und Einheiten.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction asChild>
                  <Button className="rounded-full" onClick={() => setWarn10Open(false)}>
                    Verstanden
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Warnung 5 Minuten */}
          <AlertDialog open={warn5Open} onOpenChange={setWarn5Open}>
            <AlertDialogContent className="sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>5 Minuten</AlertDialogTitle>
                <AlertDialogDescription>
                  Es sind noch <b>5 Minuten</b> übrig. Triff Entscheidungen: notfalls schätzen, Einheit setzen, alles
                  abgeben.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction asChild>
                  <Button className="rounded-full" onClick={() => setWarn5Open(false)}>
                    Verstanden
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Tab-Wechsel Warnung */}
          <AlertDialog open={tabWarnOpen} onOpenChange={setTabWarnOpen}>
            <AlertDialogContent className="sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Prüfungsmodus verlassen</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Du hast den Tab gewechselt oder die Seite verlassen. In einer echten Prüfung wäre das kritisch.</p>
                    <div className="rounded-lg border bg-card/60 p-3">
                      Aktuelle Anzahl Tab-Wechsel: <b>{tabSwitchCount}</b>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction asChild>
                  <Button className="rounded-full" onClick={() => setTabWarnOpen(false)}>
                    Zurück zur Prüfung
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Surface>
      ) : (
        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Auswertung</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {results && (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={passed ? "default" : "destructive"} className="rounded-full">
                      {results.percent}% ({results.sum}/{results.totalPoints} Punkte)
                    </Badge>

                    <span className="text-sm text-muted-foreground">
                      {passed ? "Bestanden." : "Nicht bestanden."}
                    </span>
                  </div>

                  
                  {!passed && results.gateFailedBy.length > 0 ? (
                    <div className="rounded-xl border bg-card/60 p-3 text-sm text-muted-foreground">
                      Nicht bestanden wegen: {results.gateFailedBy.join(", ")}
                    </div>
                  ) : null}

                  {results.competencyScores.length > 0 ? (
                    <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur space-y-3">
                      <div className="text-sm font-semibold text-foreground">Kompetenzprofil</div>
                      <div className="flex flex-wrap gap-2">
                        {results.competencyScores.map((row) => (
                          <Badge key={row.competency} variant="outline" className="rounded-full">
                            {row.competency}: {Math.round(row.ratio * 100)}% ({row.level})
                          </Badge>
                        ))}
                      </div>
                      {results.recommendations.length > 0 ? (
                        <div className="text-xs text-muted-foreground">
                          Empfehlung: {results.recommendations.join(" | ")}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="rounded-2xl border bg-card/60 p-4 backdrop-blur space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-foreground">Fehlertraining</div>
                        <div className="text-xs text-muted-foreground">
                          Wir nehmen genau die Aufgaben, die nicht voll gepunktet haben (inkl. Einheit/Teilpunkte).
                        </div>
                      </div>

                      <Badge
                        variant={wrongCount === 0 ? "default" : passed ? "secondary" : "destructive"}
                        className="rounded-full"
                      >
                        {wrongCount === 0 ? "0 Fehler" : `${wrongCount} Aufgabe(n) offen`}
                      </Badge>
                    </div>

                    {wrongCount > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <Button className="rounded-full" onClick={startErrorTraining}>
                          Fehlertraining starten
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => router.push(`/learn/${moduleId}?tab=practice`)}
                        >
                          Ueben ohne Filter
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button className="rounded-full" onClick={() => router.push(`/learn/${moduleId}?tab=practice`)}>
                          Weiter üben
                        </Button>
                      </div>
                    )}

                    {wrongCount > 0 ? (
                      <div className="rounded-xl border bg-background/40 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Betroffene Aufgaben (IDs)
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {wrongPracticeIds.map((id) => (
                            <Badge key={id} variant="outline" className="rounded-full font-mono">
                              {id}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {examId ? (
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href={`/results/${moduleId}/${examId}`}>Ergebnis ansehen</Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href={`/results/${moduleId}`}>Historie</Link>
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={`/learn/${moduleId}`}>Zurück in den Lernmodus</Link>
                    </Button>
                    <Button className="rounded-full" onClick={resetExam}>
                      Neue Prüfung starten
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Surface>
      )}
    </div>
  );
}




