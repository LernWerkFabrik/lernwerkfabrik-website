"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  EllipsisVertical,
  History,
  Lock,
  Target,
  TriangleAlert,
} from "lucide-react";

import type { ModuleMeta } from "@/lib/content/types";
import { getSession } from "@/lib/auth";
import { canAccessExam, canAccessModule, getPlanClient, type PlanId } from "@/lib/entitlements";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LearnProgressStatus = "attempted" | "done" | "correct" | "wrong" | string;
type LearnProgressMap = Record<string, LearnProgressStatus | unknown> & {
  ts?: number;
  updatedAt?: number;
  kind?: string;
};

type ExamAttemptQuestion = {
  id: string;
  prompt?: string;
  meta?: {
    competence?: string;
    competency?: string;
    topic?: string;
    [key: string]: unknown;
  };
};

type ExamAttemptScoreRow = {
  id: string;
  pointsPossible?: number;
  pointsEarned?: number;
  competency?: string;
};

type ExamAttemptAnswerDraft = {
  value?: string;
  unit?: string;
  textFields?: Record<string, string>;
};

type ExamAttempt = {
  examId: string;
  moduleId: string;
  createdAt: string;
  percent: number;
  sumPoints?: number;
  totalPoints?: number;
  isTestRun?: boolean;
  questions?: ExamAttemptQuestion[];
  answers?: Record<string, ExamAttemptAnswerDraft>;
  errorTags?: string[];
  mistakeCategories?: string[];
  scoring?: {
    perQuestion?: ExamAttemptScoreRow[];
    competencyScores?: Array<{
      competency: string;
      ratio: number;
    }>;
    errorTags?: string[];
    mistakeCategories?: string[];
  };
};

type FocusKey =
  | "mathe_einheiten"
  | "formelwahl_umstellen"
  | "aufgabenverstaendnis"
  | "plausibilitaet";

const FOCUS_LABELS: Record<FocusKey, string> = {
  mathe_einheiten: "Einheiten & Umrechnungen",
  formelwahl_umstellen: "Formelwahl & Umstellen",
  aufgabenverstaendnis: "Aufgaben richtig lesen",
  plausibilitaet: "Plausibilitätsprüfung",
};

function normalizeFocusToken(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toFocusKey(value: string): FocusKey | null {
  const token = normalizeFocusToken(value);
  if (!token) return null;

  if (token.includes("mathe_einheiten")) return "mathe_einheiten";
  if (token.includes("formelwahl_umstellen")) return "formelwahl_umstellen";
  if (token.includes("aufgabenverstaendnis")) return "aufgabenverstaendnis";
  if (token.includes("plausibilitaet")) return "plausibilitaet";

  if (token.includes("einheit") || token.includes("umrechn")) return "mathe_einheiten";
  if (token.includes("formel") || token.includes("umstell")) return "formelwahl_umstellen";
  if (token.includes("aufgabe") || token.includes("lesen")) return "aufgabenverstaendnis";
  if (token.includes("plausibil")) return "plausibilitaet";

  return null;
}

function inferFocusFromQuestion(
  question?: ExamAttemptQuestion,
  score?: ExamAttemptScoreRow
): FocusKey[] {
  const out = new Set<FocusKey>();

  const metaCandidates = [
    String(score?.competency ?? ""),
    String(question?.meta?.competency ?? ""),
    String(question?.meta?.competence ?? ""),
    String(question?.meta?.topic ?? ""),
  ];

  for (const candidate of metaCandidates) {
    const key = toFocusKey(candidate);
    if (key) out.add(key);
  }

  const prompt = normalizeFocusToken(String(question?.prompt ?? ""));
  if (!prompt) return Array.from(out);

  const hasUnitSignals =
    /(umrechn|einheit|mm|cm|dm|m2|m3|cm2|cm3|dm3|kg\/m3|bar|pa|kn|nm|watt|kw)/.test(prompt);
  if (hasUnitSignals) out.add("mathe_einheiten");

  const hasFormulaSignals =
    /(berechn|drehmoment|leistung|druck|volumen|flaech|dichte|kraft|arbeit|zeit|geschwindigkeit|durchmesser|radius|hebel)/.test(
      prompt
    );
  if (hasFormulaSignals) out.add("formelwahl_umstellen");

  const hasReadingSignals =
    /(aufgabe|gegeben|gesucht|ermitt|bestimm|auswahl|welche|angabe|auftrag)/.test(prompt);
  if (hasReadingSignals) out.add("aufgabenverstaendnis");

  const hasPlausibilitySignals = /(plausibil|beurteil|bewert|technisch|pruef)/.test(prompt);
  if (hasPlausibilitySignals) out.add("plausibilitaet");

  return Array.from(out);
}

function isAttemptAnswerEmpty(answer?: ExamAttemptAnswerDraft) {
  if (!answer || typeof answer !== "object") return true;

  const value = String(answer.value ?? "").trim();
  if (value.length > 0) return false;

  const textFields =
    answer.textFields && typeof answer.textFields === "object"
      ? Object.values(answer.textFields)
      : [];
  const hasTextInput = textFields.some((raw) => String(raw ?? "").trim().length > 0);

  return !hasTextInput;
}

type LearnProgressInfo = {
  hasTouched: boolean;
  percent: number;
  total: number;
  correct: number;
  completed: number;
  lastTs?: number;
};

type ModuleClientProps = {
  moduleId: string;
  meta: ModuleMeta;
  practiceCount: number;
  examCount: number;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function normalizeExamPercent(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return clampPercent(numeric);
}

function formatExamPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function parseIsoToMs(iso?: string) {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
}

function normalizeStoredQuestionIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((id): id is string => typeof id === "string")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  if (!raw || typeof raw !== "object") return [];

  const ids = (raw as { ids?: unknown }).ids;
  if (!Array.isArray(ids)) return [];

  return ids
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter(Boolean);
}

function getLearnAnswerKeys(obj: Record<string, unknown>) {
  const meta = new Set([
    "ts",
    "updatedAt",
    "kind",
    "moduleId",
    "module",
    "lessonId",
    "status",
    "questionIndex",
    "qIndex",
    "currentQuestionIndex",
    "activeQuestionIndex",
    "date",
    "lastUpdated",
  ]);

  return Object.keys(obj).filter((key) => !meta.has(key));
}

function getScopedLearnAnswerKeys(
  obj: Record<string, unknown>,
  onlyQuestionIds: Set<string> | null
) {
  const keys = getLearnAnswerKeys(obj);
  if (!onlyQuestionIds) return keys;
  return keys.filter((key) => onlyQuestionIds.has(key));
}

function readLearnProgress(moduleId: string): LearnProgressInfo {
  if (typeof window === "undefined") {
    return { hasTouched: false, percent: 0, total: 25, correct: 0, completed: 0 };
  }

  const progressKey = `lp:learn:progress:${moduleId}`;
  const data = safeJsonParse<LearnProgressMap>(localStorage.getItem(progressKey));
  if (!data || typeof data !== "object") {
    return { hasTouched: false, percent: 0, total: 25, correct: 0, completed: 0 };
  }

  const qidsRaw =
    safeJsonParse<unknown>(localStorage.getItem(`lp:learn:qids:${moduleId}`)) ??
    safeJsonParse<unknown>(localStorage.getItem(`lp.learn.qids.${moduleId}`));

  const questionIds = normalizeStoredQuestionIds(qidsRaw);
  const scopedIds = questionIds.length ? new Set(questionIds) : null;

  const keys = getScopedLearnAnswerKeys(data as Record<string, unknown>, scopedIds);
  const total = scopedIds?.size ? scopedIds.size : Math.max(25, keys.length || 0);
  const correct = keys.reduce((sum, key) => {
    const value = (data as Record<string, unknown>)[key];
    return sum + (value === "correct" ? 1 : 0);
  }, 0);
  const completed = keys.reduce((sum, key) => {
    const value = String((data as Record<string, unknown>)[key] ?? "").toLowerCase();
    return sum + (["attempted", "done", "correct", "wrong", "assisted"].includes(value) ? 1 : 0);
  }, 0);

  const percent = total > 0 ? clampPercent(Math.round((correct / total) * 100)) : 0;
  const lastTs =
    typeof data.updatedAt === "number"
      ? data.updatedAt
      : typeof data.ts === "number"
      ? data.ts
      : undefined;

  return {
    hasTouched: keys.length > 0 || typeof lastTs === "number",
    percent,
    total,
    correct,
    completed: Math.min(total, completed),
    lastTs,
  };
}

function readExamHistory(moduleId: string): ExamAttempt[] {
  if (typeof window === "undefined") return [];
  const historyKey = `lp:exam:history:${moduleId}`;
  const data = safeJsonParse<ExamAttempt[]>(localStorage.getItem(historyKey));
  return Array.isArray(data) ? data : [];
}

function writeExamHistory(moduleId: string, entries: ExamAttempt[]) {
  if (typeof window === "undefined") return;
  const historyKey = `lp:exam:history:${moduleId}`;
  localStorage.setItem(historyKey, JSON.stringify(entries));
}

function formatRelative(ts?: number) {
  if (!ts) return "Noch keine Aktivität";
  const diff = Date.now() - ts;
  if (diff < 0) return "gerade eben";

  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "gerade eben";
  if (mins < 60) return `vor ${mins} min`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} h`;

  const days = Math.floor(hrs / 24);
  if (days === 1) return "gestern";
  return `vor ${days} Tagen`;
}

function formatAbsoluteTimestamp(ts?: number) {
  if (!ts || !Number.isFinite(ts)) return "unbekannt";
  const date = new Date(ts);
  const datePart = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

function formatAbsoluteDate(iso?: string) {
  return formatAbsoluteTimestamp(parseIsoToMs(iso));
}

function kindLabel(kind: ModuleMeta["kind"]) {
  if (kind === "exam") return "Prüfungs-Simulator";
  if (kind === "prep") return "Vorbereitung";
  return "Lernen";
}

function difficultyLabel(difficulty?: ModuleMeta["difficulty"]) {
  if (difficulty === "easy") return "Leicht";
  if (difficulty === "medium") return "Mittel";
  if (difficulty === "hard") return "Schwer";
  return null;
}

function statusLabel(progressPercent: number, hasActivity: boolean) {
  if (progressPercent >= 100) return "Abgeschlossen";
  if (hasActivity) return "In Arbeit";
  return "Neu";
}

function statusBadgeVariant(label: string): "outline" | "default" | "secondary" {
  if (label === "Neu") return "outline";
  if (label === "Abgeschlossen") return "secondary";
  return "default";
}

function ProgressBar({ value }: { value: number }) {
  const v = clampPercent(value);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-amber-500/20 ring-1 ring-amber-400/45 dark:bg-amber-300/20 dark:ring-amber-300/40">
      <div
        className="h-full rounded-full bg-amber-400/85 shadow-[0_6px_14px_-10px_rgba(20,24,32,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] dark:bg-amber-300/80"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export default function ModuleClient({ moduleId, meta, practiceCount, examCount }: ModuleClientProps) {
  const [mounted, setMounted] = React.useState(false);
  const [plan, setPlan] = React.useState<PlanId>("free");
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [version, setVersion] = React.useState(0);
  const historySectionRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToHistory = React.useCallback(() => {
    historySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const toggleAttemptTestRun = React.useCallback(
    (examId: string, nextIsTestRun: boolean) => {
      const currentHistory = readExamHistory(moduleId);
      if (!currentHistory.length) return;

      const updated = currentHistory.map((entry) =>
        entry.examId === examId ? { ...entry, isTestRun: nextIsTestRun } : entry
      );
      writeExamHistory(moduleId, updated);
      setVersion((value) => value + 1);
    },
    [moduleId]
  );

  const syncAccess = React.useCallback(async () => {
    setPlan(getPlanClient());
    const session = await getSession();
    setIsAuthed(Boolean(session.ok && session.data));
  }, []);

  React.useEffect(() => {
    setMounted(true);
    void syncAccess();

    const bump = () => setVersion((value) => value + 1);
    const onStorage = (event: StorageEvent) => {
      if (!event.key) {
        bump();
        void syncAccess();
        return;
      }

      if (event.key.startsWith("lp:learn:progress:") || event.key.startsWith("lp:exam:history:")) {
        bump();
      }

      if (
        event.key === "lp.plan.v1" ||
        event.key === "DEV_FORCE_PLAN" ||
        event.key === "lp.auth.v1" ||
        event.key === "lp_auth_user"
      ) {
        void syncAccess();
      }
    };

    const onFocus = () => {
      bump();
      void syncAccess();
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      bump();
      void syncAccess();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncAccess]);

  const learn = React.useMemo(
    () =>
      mounted
        ? readLearnProgress(moduleId)
        : { hasTouched: false, percent: 0, total: 25, correct: 0, completed: 0 },
    [mounted, moduleId, version]
  );

  const exams = React.useMemo(() => {
    if (!mounted) return [];
    return [...readExamHistory(moduleId)].sort((a, b) => {
      const aMs = parseIsoToMs(a.createdAt) ?? 0;
      const bMs = parseIsoToMs(b.createdAt) ?? 0;
      return bMs - aMs;
    });
  }, [mounted, moduleId, version]);

  const attempts = exams.length;
  const scoreRelevantExams = exams.filter((entry) => !entry.isTestRun);
  const scoreRelevantAttempts = scoreRelevantExams.length;
  const scoreRelevantValues = scoreRelevantExams.map((entry) => normalizeExamPercent(entry.percent));
  const bestExamPercent = scoreRelevantAttempts
    ? Math.max(...scoreRelevantValues)
    : 0;
  const lastRelevantExamPercent = scoreRelevantAttempts
    ? normalizeExamPercent(scoreRelevantExams[0]?.percent)
    : 0;
  const lastExamPercent = attempts ? normalizeExamPercent(exams[0]?.percent) : 0;
  const lastRelevantExamAttemptTs = parseIsoToMs(scoreRelevantExams[0]?.createdAt);
  const lastExamAttemptTs = parseIsoToMs(exams[0]?.createdAt);
  const isAp1Worktasks = moduleId === "ap1-arbeitsaufgaben";
  const isAp1ExamSimulator = moduleId === "ap1-rechen-fachaufgaben";
  const passPercent = isAp1ExamSimulator ? 50 : 60;
  const ap1TotalExercises = 25;
  const ap1Correct = Math.max(0, Math.min(ap1TotalExercises, Number(learn.correct) || 0));
  const ap1Completed = Math.max(0, Math.min(ap1TotalExercises, Number(learn.completed) || 0));
  const ap1ProgressPercent = clampPercent(Math.round((ap1Completed / ap1TotalExercises) * 100));

  const progressPercent = meta.kind === "exam" ? bestExamPercent : learn.percent;
  const hasActivity = meta.kind === "exam" ? scoreRelevantAttempts > 0 : learn.hasTouched;
  const status = statusLabel(progressPercent, hasActivity);

  const examActivityTs = meta.kind === "exam" ? lastRelevantExamAttemptTs : lastExamAttemptTs;
  const lastActivityTs = Math.max(learn.lastTs ?? 0, examActivityTs ?? 0) || undefined;
  const hasTrackedActivity =
    (meta.kind === "exam" ? scoreRelevantAttempts > 0 : attempts > 0) ||
    (Number(learn.completed) || 0) > 0 ||
    typeof learn.lastTs === "number" ||
    typeof examActivityTs === "number";
  const lastActivity = hasTrackedActivity
    ? isAp1Worktasks
      ? formatAbsoluteTimestamp(lastActivityTs)
      : formatRelative(lastActivityTs)
    : "Noch keine Aktivität";
  const hasPassedAttempt = scoreRelevantExams.some((entry) => clampPercent(Number(entry.percent) || 0) >= passPercent);
  const hasBestScoreAttempt = scoreRelevantAttempts > 0 && (bestExamPercent > 0 || hasPassedAttempt);
  const noOfficialExamAttempt = isAp1ExamSimulator && scoreRelevantAttempts === 0;
  const bestScoreValue = isAp1Worktasks
    ? scoreRelevantAttempts === 0
      ? "—"
      : hasBestScoreAttempt
      ? `${formatExamPercent(bestExamPercent)}%`
      : "—"
    : isAp1ExamSimulator
    ? noOfficialExamAttempt
      ? "—"
      : `${formatExamPercent(bestExamPercent)}%`
    : scoreRelevantAttempts
    ? `${formatExamPercent(bestExamPercent)}%`
    : "-";
  const bestScoreStatus =
    isAp1Worktasks && scoreRelevantAttempts > 0 && hasBestScoreAttempt
      ? bestExamPercent >= passPercent
        ? "Bestanden"
        : "Nicht bestanden"
      : "";
  const hasLastAttempt = meta.kind === "exam" ? scoreRelevantAttempts > 0 : attempts > 0;
  const isFirstZeroAttempt = isAp1Worktasks && attempts === 1 && lastExamPercent === 0;
  const lastScoreValue = isAp1Worktasks
    ? !hasLastAttempt
      ? "—"
      : isFirstZeroAttempt
      ? "Erster Versuch – weiter üben"
      : `${formatExamPercent(meta.kind === "exam" ? lastRelevantExamPercent : lastExamPercent)}%`
    : isAp1ExamSimulator
    ? noOfficialExamAttempt
      ? "—"
      : `${formatExamPercent(meta.kind === "exam" ? lastRelevantExamPercent : lastExamPercent)}%`
    : hasLastAttempt
    ? `${formatExamPercent(meta.kind === "exam" ? lastRelevantExamPercent : lastExamPercent)}%`
    : "-";
  const lastScoreStatus =
    isAp1Worktasks && hasLastAttempt && !isFirstZeroAttempt
      ? (meta.kind === "exam" ? lastRelevantExamPercent : lastExamPercent) >= passPercent
        ? "Bestanden"
        : "Nicht bestanden"
      : "";

  const moduleLocked = mounted ? !canAccessModule(plan, moduleId) : false;
  const examLocked = mounted ? !canAccessExam(plan) : false;

  const primaryLocked = meta.kind === "exam" ? moduleLocked || examLocked : moduleLocked;
  const upgradeHref = isAuthed ? "/pricing" : "/signup";
  const primaryHref = primaryLocked
    ? upgradeHref
    : meta.kind === "exam"
    ? `/exam/${moduleId}`
    : `/learn/${moduleId}`;
  const primaryLabel = primaryLocked
    ? isAuthed
      ? "Pro freischalten"
      : "Konto erstellen"
    : meta.kind === "exam"
    ? "Prüfung starten"
    : isAp1Worktasks
    ? ap1ProgressPercent === 0
      ? "Lernen starten"
      : "Lernen fortsetzen"
    : status === "Neu"
    ? "Lernen starten"
    : "Lernen fortsetzen";

  const ap1ExamDescriptionIntro =
    "In AP Teil 1 zählt nicht nur das Ergebnis, sondern dein strukturiertes Vorgehen unter Zeitdruck: Aufgabe verstehen, passend rechnen und Ergebnisse technisch plausibel absichern. Die häufigsten Punktverluste entstehen durch falsches Lesen, Einheitenfehler und fehlende Plausibilitätsprüfung.";
  const ap1ExamGoals = [
    "Aufgabenstellungen schnell und vollständig erfassen",
    "Passende Formeln auswählen und korrekt umstellen",
    "Rechnen mit Einheiten sicher beherrschen",
    "Ergebnisse technisch plausibel prüfen und begründen",
  ];
  const ap1ExamLosses = [
    "Angaben übersehen oder falsch interpretiert",
    "Formel oder Größe falsch gewählt trotz korrekter Rechnung",
    "Einheiten nicht umgerechnet oder vergessen",
    "Ergebnis übernommen ohne Plausibilitätsprüfung",
  ];
  const trains = isAp1ExamSimulator
    ? ap1ExamGoals
    : Array.isArray(meta.intro?.trains)
    ? meta.intro?.trains.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const traps = isAp1ExamSimulator
    ? ap1ExamLosses
    : Array.isArray(meta.intro?.traps)
    ? meta.intro?.traps.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  const difficulty = difficultyLabel(meta.difficulty);
  const tags = Array.isArray(meta.tags)
    ? meta.tags.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const competencyCheckMinutes =
    moduleId === "ap1-arbeitsaufgaben"
      ? (meta as { prep?: { examSimulators?: Array<{ durationMinutes?: number }> } }).prep?.examSimulators?.find(
          (entry) => typeof entry?.durationMinutes === "number"
        )?.durationMinutes
      : undefined;
  const ap1CheckMinutes = typeof competencyCheckMinutes === "number" ? competencyCheckMinutes : 15;
  const ap1StatusLine =
    ap1ProgressPercent === 0
      ? `0 % Fortschritt · ${ap1TotalExercises} Übungen · Check: ${ap1CheckMinutes} min`
      : ap1ProgressPercent < 90
      ? `${ap1ProgressPercent}% Fortschritt · ${ap1Completed}/${ap1TotalExercises} Übungen abgeschlossen`
      : `${ap1ProgressPercent}% Fortschritt · Bereit für Kompetenz-Check`;
  const ap1CheckNeedsPrep = isAp1Worktasks && ap1ProgressPercent < 40;
  const ap1CompetencyDots = React.useMemo(() => {
    if (!isAp1Worktasks || ap1ProgressPercent < 50) return null;

    const firstWithScores = exams.find(
      (entry) => Array.isArray(entry.scoring?.competencyScores) && (entry.scoring?.competencyScores?.length ?? 0) > 0
    );
    const rows = firstWithScores?.scoring?.competencyScores;
    if (!rows || rows.length === 0) return null;

    const ratioByCompetency = new Map<string, number>();
    for (const row of rows) {
      const ratio = Number(row?.ratio);
      if (typeof row?.competency === "string" && Number.isFinite(ratio)) {
        ratioByCompetency.set(row.competency, Math.max(0, Math.min(1, ratio)));
      }
    }

    const zeichnung = ratioByCompetency.get("auftrag_zeichnen");
    const planung = ratioByCompetency.get("arbeitsplanung");
    const pruefen = ratioByCompetency.get("messen_pruefen");
    const doku = ratioByCompetency.get("doku_bewertung");

    if (
      typeof zeichnung !== "number" ||
      typeof planung !== "number" ||
      typeof pruefen !== "number" ||
      typeof doku !== "number"
    ) {
      return null;
    }

    const toDots = (score: number) => {
      const dots = Math.max(0, Math.min(4, Math.round(score * 4)));
      return `${"\u25cf".repeat(dots)}${"\u25cb".repeat(4 - dots)}`;
    };

    return {
      zeichnung: toDots(zeichnung),
      planung: toDots(planung),
      pruefen: toDots(pruefen),
      doku: toDots(doku),
    };
  }, [isAp1Worktasks, ap1ProgressPercent, exams]);
  const displayMinutes =
    typeof meta.exam?.durationMinutes === "number" ? meta.exam.durationMinutes : meta.estimatedMinutes;
  const showPracticeCountBadge = !isAp1ExamSimulator && practiceCount > 0;
  const ap1ExamTaskCount = examCount > 0 ? examCount : 20;
  const ap1FocusHint = React.useMemo(() => {
    if (!isAp1ExamSimulator || scoreRelevantAttempts === 0) return null;

    const lastAttempt = scoreRelevantExams[0];
    if (!lastAttempt) return null;
    const remainingPercent = Math.max(0, 100 - lastRelevantExamPercent);
    const formatFocusLabels = (keys: FocusKey[]) => keys.map((key) => FOCUS_LABELS[key]);

    const scoreRows = Array.isArray(lastAttempt.scoring?.perQuestion)
      ? lastAttempt.scoring.perQuestion
      : [];
    const scoreById = new Map(scoreRows.map((row) => [String(row?.id ?? ""), row]));
    const questions = Array.isArray(lastAttempt.questions) ? lastAttempt.questions : [];
    const questionById = new Map(questions.map((question) => [String(question?.id ?? ""), question]));
    const answersById =
      lastAttempt.answers && typeof lastAttempt.answers === "object" ? lastAttempt.answers : {};

    const unansweredFocusCounts = new Map<FocusKey, number>();
    for (const question of questions) {
      const questionId = String(question?.id ?? "");
      if (!questionId) continue;
      if (!isAttemptAnswerEmpty(answersById[questionId])) continue;

      const focusKeys = inferFocusFromQuestion(question, scoreById.get(questionId));
      for (const key of focusKeys) {
        unansweredFocusCounts.set(key, (unansweredFocusCounts.get(key) ?? 0) + 1);
      }
    }

    const selectedUnansweredFocus = Array.from(unansweredFocusCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);

    let selectedFocus: FocusKey[] = [];

    const competencyRows = Array.isArray(lastAttempt.scoring?.competencyScores)
      ? lastAttempt.scoring?.competencyScores
      : [];

    if (competencyRows.length > 0) {
      const weakestByFocus = new Map<FocusKey, number>();

      for (const row of competencyRows) {
        const key = toFocusKey(String(row?.competency ?? ""));
        const ratio = Number(row?.ratio);
        if (!key || !Number.isFinite(ratio)) continue;

        const bounded = Math.max(0, Math.min(1, ratio));
        const current = weakestByFocus.get(key);
        if (typeof current !== "number" || bounded < current) {
          weakestByFocus.set(key, bounded);
        }
      }

      selectedFocus = Array.from(weakestByFocus.entries())
        .filter(([, score]) => score < 0.6)
        .sort((a, b) => a[1] - b[1])
        .map(([key]) => key);
    }

    if (selectedFocus.length === 0) {
      const rawTags = [
        ...(Array.isArray(lastAttempt.errorTags) ? lastAttempt.errorTags : []),
        ...(Array.isArray(lastAttempt.mistakeCategories) ? lastAttempt.mistakeCategories : []),
        ...(Array.isArray(lastAttempt.scoring?.errorTags) ? lastAttempt.scoring.errorTags : []),
        ...(Array.isArray(lastAttempt.scoring?.mistakeCategories) ? lastAttempt.scoring.mistakeCategories : []),
      ];

      selectedFocus = Array.from(
        new Set(
          rawTags
            .map((tag) => toFocusKey(String(tag)))
            .filter((key): key is FocusKey => Boolean(key))
        )
      );
    }

    if (selectedFocus.length === 0) {
      const wrongRows = scoreRows.filter((row) => {
        const possible = Number(row?.pointsPossible);
        const earned = Number(row?.pointsEarned);
        if (!Number.isFinite(possible) || !Number.isFinite(earned)) return false;
        return earned < possible;
      });

      const focusCounts = new Map<FocusKey, number>();
      for (const row of wrongRows) {
        const questionId = String(row?.id ?? "");
        const question = questionById.get(questionId);
        const focusKeys = inferFocusFromQuestion(question, row);
        for (const key of focusKeys) {
          focusCounts.set(key, (focusCounts.get(key) ?? 0) + 1);
        }
      }

      selectedFocus = Array.from(focusCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key);
    }

    if (selectedFocus.length === 0 && selectedUnansweredFocus.length > 0) {
      selectedFocus = selectedUnansweredFocus;
    }

    if (selectedFocus.length === 0) return null;

    return {
      line1: `Letztes Ergebnis: ${formatExamPercent(lastRelevantExamPercent)} %`,
      line2: `${formatExamPercent(remainingPercent)} % der Aufgaben waren nicht korrekt.`,
      focusItems: formatFocusLabels(selectedFocus),
    };
  }, [isAp1ExamSimulator, scoreRelevantAttempts, scoreRelevantExams, lastRelevantExamPercent]);

  return (
    <div className="space-y-6">
      <Card className="lp-accent-top rounded-2xl border-black/10 bg-transparent lp-card-grad shadow-[0_30px_78px_-40px_rgba(20,24,32,0.36)] backdrop-blur dark:border-white/10 dark:shadow-[0_26px_70px_-42px_rgba(0,0,0,0.52)]">
        <CardHeader className={`space-y-3 ${isAp1ExamSimulator ? "pb-0" : ""}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl tracking-tight md:text-3xl">{meta.title}</CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {isAp1Worktasks
                  ? "Zeichnung auswerten. Ablauf planen. Prüfen. Dokumentieren."
                  : isAp1ExamSimulator
                  ? "AP1 unter Prüfungsbedingungen."
                  : meta.description?.trim() || "Modulübersicht mit Inhalt, Verlauf und passender Aktion."}
              </p>
              {isAp1ExamSimulator ? (
                <div className="max-w-3xl rounded-xl border border-border/70 bg-background/55 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Rahmenbedingungen</p>
                  <ul className="mt-2 space-y-1">
                    <li>90 Minuten</li>
                    <li>{`${ap1ExamTaskCount} Aufgaben`}</li>
                    <li>Ohne Hilfen</li>
                    <li>Auto-Abgabe bei Zeitablauf</li>
                    <li>Auswertung nach Abgabe</li>
                  </ul>
                </div>
              ) : null}
              {isAp1Worktasks ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{ap1StatusLine}</div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-border/60 bg-muted/50">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                      style={{ width: `${ap1ProgressPercent === 0 ? 0 : Math.max(ap1ProgressPercent, 4)}%` }}
                    />
                  </div>
                  {ap1CompetencyDots ? (
                    <div className="text-xs text-muted-foreground">
                      Zeichnung {ap1CompetencyDots.zeichnung}{" "}
                      <span className="mx-1">Planung {ap1CompetencyDots.planung}</span>
                      Prüfen {ap1CompetencyDots.pruefen}{" "}
                      <span className="mx-1">Doku {ap1CompetencyDots.doku}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {!isAp1Worktasks && !isAp1ExamSimulator ? (
              <Badge variant={statusBadgeVariant(status)} className="w-fit rounded-full">
                {status}
              </Badge>
            ) : null}
          </div>

          {!isAp1Worktasks && !isAp1ExamSimulator ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">
                <BookOpenCheck className="mr-1 h-3.5 w-3.5" />
                {kindLabel(meta.kind)}
              </Badge>
              {difficulty ? (
                <Badge variant="secondary" className="rounded-full">
                  {difficulty}
                </Badge>
              ) : null}
              {typeof displayMinutes === "number" ? (
                <Badge variant="secondary" className="rounded-full">
                  <Clock3 className="mr-1 h-3.5 w-3.5" />
                  {displayMinutes} min
                </Badge>
              ) : null}
              {typeof competencyCheckMinutes === "number" ? (
                <Badge variant="secondary" className="rounded-full">
                  Kompetenz-Check {competencyCheckMinutes} min
                </Badge>
              ) : null}
              {showPracticeCountBadge ? (
                <Badge variant="secondary" className="rounded-full">
                  {practiceCount} Übungsaufgaben
                </Badge>
              ) : null}
              {examCount > 0 ? (
                <Badge variant="secondary" className="rounded-full">
                  {moduleId === "ap1-arbeitsaufgaben"
                    ? `${examCount} Kompetenz-Check-Aufgaben`
                    : `${examCount} Prüfungsaufgaben`}
                </Badge>
              ) : null}
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className={`flex flex-wrap gap-2 pt-0 ${isAp1ExamSimulator ? "-mt-1" : ""}`}>
          <Button
            asChild
            className={`rounded-full ${isAp1ExamSimulator ? "bg-amber-400 text-black hover:bg-amber-300 dark:bg-amber-300 dark:text-black dark:hover:bg-amber-200" : ""}`}
          >
            <Link href={primaryHref}>
              {primaryLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          {examCount > 0 && meta.kind !== "exam" ? (
            <div className="flex flex-col items-start gap-1">
              <Button
                asChild
                variant="outline"
                className={`rounded-full transition-opacity ${ap1CheckNeedsPrep ? "opacity-80" : ""}`}
                title={ap1CheckNeedsPrep ? "Kompetenz-Check empfohlen ab ca. 40 % Fortschritt." : undefined}
              >
                <Link href={moduleLocked || examLocked ? upgradeHref : `/exam/${moduleId}`}>
                  {isAp1Worktasks ? `Kompetenz-Check (${ap1CheckMinutes} min)` : "Prüfung öffnen"}
                </Link>
              </Button>
              {isAp1Worktasks && ap1CheckNeedsPrep ? (
                <p className="pl-1 text-[11px] italic text-muted-foreground/70">
                  Kompetenz-Check empfohlen ab ca. 40 % Fortschritt.
                </p>
              ) : null}
            </div>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className={`rounded-full ${
              isAp1Worktasks
                ? "border-border/60 text-muted-foreground hover:border-border/80 hover:text-foreground"
                : isAp1ExamSimulator
                ? "border-border/60 bg-transparent text-muted-foreground/85 shadow-none hover:border-border/70 hover:bg-transparent hover:text-foreground/85"
                : ""
            }`}
            onClick={scrollToHistory}
          >
            Verlauf
          </Button>

          {isAp1ExamSimulator ? (
            <Link
              href="/module"
              className="self-center pl-1 text-sm text-muted-foreground/70 transition-colors hover:text-muted-foreground"
            >
              Zur Modulliste
            </Link>
          ) : (
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/module">Zur Modulliste</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-2xl border-black/10 bg-transparent lp-card-grad-subtle shadow-[0_24px_66px_-42px_rgba(20,24,32,0.30)] backdrop-blur dark:border-white/10 dark:shadow-[0_20px_54px_-42px_rgba(0,0,0,0.48)] lg:col-span-3">
            <CardHeader className="space-y-2">
            <CardTitle>Beschreibung</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isAp1ExamSimulator
                ? ap1ExamDescriptionIntro
                : meta.intro?.why?.trim() || "Dieses Modul vertieft die prüfungsrelevanten Grundlagen mit Fokus auf sichere Anwendung."}
            </p>
            </CardHeader>

            <CardContent className={isAp1ExamSimulator ? "space-y-6 pt-2" : "space-y-4"}>
            {isAp1ExamSimulator && ap1FocusHint ? (
              <div className="space-y-1 rounded-lg border border-border/40 bg-background/35 px-3 py-2">
                <div className="text-sm font-medium">Dein Fokus</div>
                <p className="text-sm text-muted-foreground">{ap1FocusHint.line1}</p>
                <p className="text-sm text-muted-foreground">{ap1FocusHint.line2}</p>
                <p className="text-sm text-muted-foreground">Schwerpunkt für die nächste Prüfung:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {ap1FocusHint.focusItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {trains.length > 0 ? (
              <div className={isAp1ExamSimulator ? "space-y-3" : "space-y-2"}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {!isAp1ExamSimulator ? <Target className="h-4 w-4" /> : null}
                  {isAp1Worktasks
                    ? "Nach diesem Modul kannst du:"
                    : isAp1ExamSimulator
                    ? "Prüfungsziele"
                    : "Das trainierst du"}
                </div>
                {isAp1ExamSimulator ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {trains.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {trains.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {traps.length > 0 ? (
              <div className={isAp1ExamSimulator ? "space-y-3 border-t border-border/40 pt-4" : "space-y-2"}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {!isAp1ExamSimulator ? <TriangleAlert className="h-4 w-4" /> : null}
                  {isAp1ExamSimulator ? "Typische Punktverluste" : "Typische Fehler"}
                </div>
                {isAp1ExamSimulator ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {traps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {traps.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500/90" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div id="module-verlauf" ref={historySectionRef} className="scroll-mt-24 lg:col-span-2">
          <Card className="rounded-2xl border-black/10 bg-transparent lp-card-grad-subtle shadow-[0_24px_66px_-42px_rgba(20,24,32,0.30)] backdrop-blur dark:border-white/10 dark:shadow-[0_20px_54px_-42px_rgba(0,0,0,0.48)]">
            <CardHeader className="space-y-2">
            <CardTitle>Verlauf</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isAp1Worktasks
                  ? "Fortschritt, letzte Aktivität und letzte Kompetenz-Checks."
                  : isAp1ExamSimulator
                  ? "Prüfungsergebnisse, letzter Versuch und Verlauf unter Zeitdruck."
                  : "Fortschritt, letzte Aktivität und letzte Prüfungsversuche."}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
            {!isAp1ExamSimulator ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fortschritt</span>
                  {!isAp1Worktasks ? <span className="font-medium tabular-nums">{progressPercent}%</span> : null}
                </div>
                <ProgressBar value={progressPercent} />
                {isAp1Worktasks ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>{`${progressPercent}% · ${ap1Correct}/${ap1TotalExercises} Aufgaben richtig`}</div>
                    <div>{`${ap1Completed}/${ap1TotalExercises} bearbeitet`}</div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {meta.kind === "exam"
                      ? "Basiert auf deinem besten Prüfungsergebnis."
                      : `Richtig gelöst: ${learn.correct} von ${learn.total} Aufgaben.`}
                  </div>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-border/60 bg-transparent p-3 lp-card-grad-subtle shadow-[0_12px_30px_-28px_rgba(20,24,32,0.26)] dark:shadow-[0_12px_30px_-26px_rgba(0,0,0,0.42)]">
                <div className="text-xs text-muted-foreground">Zuletzt aktiv</div>
                <div className="mt-1 font-medium">{lastActivity}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-transparent p-3 lp-card-grad-subtle shadow-[0_12px_30px_-28px_rgba(20,24,32,0.26)] dark:shadow-[0_12px_30px_-26px_rgba(0,0,0,0.42)]">
                <div className="text-xs text-muted-foreground">Versuche</div>
                <div className="mt-1 font-medium">{meta.kind === "exam" ? scoreRelevantAttempts : attempts}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-transparent p-3 lp-card-grad-subtle shadow-[0_12px_30px_-28px_rgba(20,24,32,0.26)] dark:shadow-[0_12px_30px_-26px_rgba(0,0,0,0.42)]">
                <div className="text-xs text-muted-foreground">Bestwert</div>
                <div className="mt-1 font-medium">{bestScoreValue}</div>
                {bestScoreStatus ? <div className="mt-0.5 text-xs text-muted-foreground">{bestScoreStatus}</div> : null}
              </div>
              <div className="rounded-xl border border-border/60 bg-transparent p-3 lp-card-grad-subtle shadow-[0_12px_30px_-28px_rgba(20,24,32,0.26)] dark:shadow-[0_12px_30px_-26px_rgba(0,0,0,0.42)]">
                <div className="text-xs text-muted-foreground">Letztes Ergebnis</div>
                <div className={`mt-1 ${isFirstZeroAttempt ? "text-sm text-muted-foreground" : "font-medium"}`}>
                  {lastScoreValue}
                </div>
                {lastScoreStatus ? <div className="mt-0.5 text-xs text-muted-foreground">{lastScoreStatus}</div> : null}
              </div>
            </div>
            {noOfficialExamAttempt ? (
              <p className="text-xs text-muted-foreground">Kein gewerteter Versuch vorhanden.</p>
            ) : null}

            {attempts > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <History className="h-4 w-4" />
                  {isAp1Worktasks
                    ? "Letzte Kompetenz-Checks"
                    : "Letzte Prüfungen"}
                </div>
                <div className="space-y-2">
                  {exams.slice(0, 4).map((entry, idx) => {
                    const score = normalizeExamPercent(entry.percent);
                    const scoreLabel = formatExamPercent(score);
                    const passed = score >= passPercent;
                    const firstZeroListEntry = isAp1Worktasks && attempts === 1 && idx === 0 && score === 0;
                    const isTestRun = entry.isTestRun === true;
                    const scoreLabelWithFlag = isAp1ExamSimulator
                      ? isTestRun
                        ? `${scoreLabel} % · Testlauf`
                        : `${scoreLabel} % · Gewertet · ${passed ? "Bestanden" : "Nicht bestanden"}`
                      : isAp1Worktasks
                      ? firstZeroListEntry
                        ? "Erster Versuch – weiter üben"
                        : `${scoreLabel} % · ${passed ? "Bestanden" : "Nicht bestanden"}`
                      : `${scoreLabel}%`;

                    return (
                      <div
                        key={`${entry.examId}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-transparent px-3 py-2 lp-card-grad-subtle shadow-[0_10px_26px_-26px_rgba(20,24,32,0.22)] dark:shadow-[0_10px_26px_-24px_rgba(0,0,0,0.38)]"
                      >
                        <span className="text-xs text-foreground">{formatAbsoluteDate(entry.createdAt)}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{scoreLabelWithFlag}</span>
                          {isAp1ExamSimulator ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 rounded-full p-0 text-muted-foreground/75 hover:bg-transparent hover:text-foreground"
                                  aria-label="Status wählen"
                                >
                                  <EllipsisVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuRadioGroup
                                  value={isTestRun ? "test" : "official"}
                                  onValueChange={(value) =>
                                    toggleAttemptTestRun(entry.examId, value === "test")
                                  }
                                >
                                  <DropdownMenuRadioItem value="official">Als gewerteter Versuch führen</DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="test">Als Testlauf führen</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-transparent p-3 text-xs text-muted-foreground lp-card-grad-subtle shadow-[0_10px_24px_-26px_rgba(20,24,32,0.20)] dark:shadow-[0_10px_24px_-24px_rgba(0,0,0,0.34)]">
                {isAp1Worktasks
                  ? "Noch keine Kompetenz-Checks."
                  : "Noch keine gespeicherten Prüfungsversuche."}
              </div>
            )}

            {isAp1Worktasks ? (
              <p className="text-xs text-muted-foreground/80">
                {ap1ProgressPercent < 40
                  ? "Empfehlung: erst Übungen bearbeiten (ca. 40%), dann Kompetenz-Check."
                  : "Kompetenz-Check ist jetzt sinnvoll."}
              </p>
            ) : null}

            {primaryLocked ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground">
                <div className="mb-1 flex items-center gap-1 font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  Zugriff eingeschränkt
                </div>
                {isAuthed
                  ? "Mit Pro erhältst du Zugriff auf dieses Modul und den Prüfungsmodus."
                  : "Melde dich an, um Fortschritt zu speichern und Inhalte freizuschalten."}
              </div>
            ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

