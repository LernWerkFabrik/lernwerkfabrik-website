// app/dashboard/ModuleCardsClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Surface from "@/components/Surface";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Lock } from "lucide-react";

import { getProfileClient, type ProfessionId } from "@/lib/profile";
import {
  getModuleRelevanceForModule,
  type ExamRelevance,
} from "@/lib/curriculum";
import {
  canAccessExam,
  canAccessModule,
  getPlanClient,
  type PlanId,
} from "@/lib/entitlements";

/* ======================= TYPES ======================= */

type ModuleItem = {
  id: string;
  title: string;
  estimatedMinutes?: number | null;
  areaId?: string | null;
  areaTitle?: string | null;
  kind: "learn" | "prep" | "exam";
};

type LearnProgressStatus = "attempted" | "done" | "correct" | "wrong" | string;
type LearnProgressMap = Record<string, LearnProgressStatus | unknown> & {
  ts?: number;
  updatedAt?: number;
  kind?: string;
};

type ExamAttempt = {
  examId: string;
  moduleId: string;
  createdAt: string; // ISO
  percent: number; // 0..100
  sumPoints?: number;
  totalPoints?: number;
};

type ModuleMeta = {
  status: "Neu" | "In Arbeit" | "Abgeschlossen";
  progressPercent: number; // exam: Bestwert, learn/prep: correct/total
  lastActivityTs?: number; // ms
  attempts: number;
  bestExamPercent?: number;
  lastExamPercent?: number;
  hasLearnTouched: boolean;
  learnTotal?: number;
  learnCorrect?: number;
  learnAnswered?: number;
};

/* ======================= HELPERS ======================= */

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function parseIsoToMs(iso?: string) {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : undefined;
}

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "a,button,input,select,textarea,[role='button'],[data-no-card-nav='true']"
    )
  );
}

function getLearnAnswerKeys(obj: Record<string, any>) {
  // Nur echte Aufgaben-Keys (keine Meta-/Event-Felder)
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
  return Object.keys(obj).filter((k) => !meta.has(k));
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

function getScopedLearnAnswerKeys(obj: Record<string, any>, onlyQuestionIds: Set<string> | null) {
  const keys = getLearnAnswerKeys(obj);
  if (!onlyQuestionIds) return keys;
  return keys.filter((k) => onlyQuestionIds.has(k));
}

/* ======================= LEARN PROGRESS ======================= */
/**
 * lp:learn:progress:<moduleId>
 * -> StatusMap pro Frage + optional ts/updatedAt
 * -> Prozent wie im Dashboard:
 *    correct / total; total = max(25, vorhandene keys)
 */
function readLearnProgressInfo(moduleId: string): {
  hasTouched: boolean;
  percent: number;
  lastTs?: number;
  total: number;
  correct: number;
  answered: number;
} {
  const key = `lp:learn:progress:${moduleId}`;
  const obj = safeJsonParse<LearnProgressMap>(localStorage.getItem(key));

  if (!obj || typeof obj !== "object") {
    return { hasTouched: false, percent: 0, total: 25, correct: 0, answered: 0 };
  }

  const qidsRaw =
    safeJsonParse<unknown>(localStorage.getItem(`lp:learn:qids:${moduleId}`)) ??
    safeJsonParse<unknown>(localStorage.getItem(`lp.learn.qids.${moduleId}`));
  const questionIds = normalizeStoredQuestionIds(qidsRaw);
  const onlyQuestionIds = questionIds.length ? new Set(questionIds) : null;

  const qKeys = getScopedLearnAnswerKeys(obj as Record<string, any>, onlyQuestionIds);
  const total = onlyQuestionIds?.size ? onlyQuestionIds.size : Math.max(25, qKeys.length || 0);

  const correct = qKeys.reduce((acc, k) => {
    const v = (obj as any)[k];
    return acc + (v === "correct" ? 1 : 0);
  }, 0);
  const answered = qKeys.reduce((acc, k) => {
    const v = String((obj as any)[k] ?? "").toLowerCase();
    return acc + (["attempted", "done", "correct", "wrong", "assisted"].includes(v) ? 1 : 0);
  }, 0);

  const percent = total > 0 ? clamp(Math.round((correct / total) * 100)) : 0;

  const lastTs =
    typeof obj.updatedAt === "number"
      ? obj.updatedAt
      : typeof obj.ts === "number"
      ? obj.ts
      : undefined;

  const hasTouched = qKeys.length > 0 || typeof lastTs === "number";

  return { hasTouched, percent, lastTs, total, correct, answered };
}

/* ======================= EXAM PROGRESS ======================= */

function readExamHistory(moduleId: string): ExamAttempt[] {
  const key = `lp:exam:history:${moduleId}`;
  const data = safeJsonParse<ExamAttempt[]>(localStorage.getItem(key));
  return Array.isArray(data) ? data : [];
}

/* ======================= META ======================= */

function computeModuleMeta(module: ModuleItem): ModuleMeta {
  const exams = readExamHistory(module.id);
  const attempts = exams.length;

  const learnInfo = module.kind !== "exam" ? readLearnProgressInfo(module.id) : null;
  const hasLearnTouched = learnInfo?.hasTouched ?? false;

  const sorted = [...exams].sort((a, b) => {
    const ta = parseIsoToMs(a.createdAt) ?? 0;
    const tb = parseIsoToMs(b.createdAt) ?? 0;
    return tb - ta;
  });

  const lastExam = sorted[0];
  const lastExamTs = parseIsoToMs(lastExam?.createdAt);

  const bestExamPercent =
    attempts > 0 ? clamp(Math.max(...exams.map((e) => Number(e.percent) || 0))) : undefined;

  const lastExamPercent = lastExam ? clamp(Number(lastExam.percent) || 0) : undefined;

  const progressPercent =
    module.kind === "exam"
      ? typeof bestExamPercent === "number"
        ? bestExamPercent
        : 0
      : learnInfo?.percent ?? 0;

  const lastActivityTs = module.kind === "exam" ? lastExamTs : learnInfo?.lastTs;

  let status: ModuleMeta["status"] = "Neu";
  if (progressPercent >= 100) status = "Abgeschlossen";
  else if (attempts > 0 || hasLearnTouched) status = "In Arbeit";

  return {
    status,
    progressPercent,
    lastActivityTs,
    attempts,
    bestExamPercent,
    lastExamPercent,
    hasLearnTouched,
    learnTotal: learnInfo?.total,
    learnCorrect: learnInfo?.correct,
    learnAnswered: learnInfo?.answered,
  };
}

/* ======================= UI HELPERS ======================= */

function formatRelative(ts?: number) {
  if (!ts) return null;
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

function formatAbsoluteDateTime(ts?: number) {
  if (!ts) return null;
  const d = new Date(ts);
  const date = d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function ProgressBar({ value }: { value: number }) {
  const v = clamp(value);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-amber-500/20 ring-1 ring-amber-400/45 dark:bg-amber-300/20 dark:ring-amber-300/40">
      <div
        className="h-full rounded-full bg-amber-400/85 shadow-[0_6px_14px_-10px_rgba(20,24,32,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] dark:bg-amber-300/80"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function examBadgeLabel(exam?: ExamRelevance): string | null {
  if (exam === "AP1") return "AP Teil 1";
  if (exam === "AP2") return "AP Teil 2";
  if (exam === "AP1_AP2") return "AP Teil 1 & 2";
  return null;
}

function lehrjahrLabel(lehrjahre?: Array<1 | 2 | 3 | 4>): string | null {
  if (!lehrjahre || lehrjahre.length === 0) return null;
  const sorted = [...new Set(lehrjahre)].sort((a, b) => a - b);
  if (sorted.length === 1) return `typisch ${sorted[0]}. LJ`;
  return `typisch ${sorted[0]}.-${sorted[sorted.length - 1]}. LJ`;
}

function kindBadge(kind: ModuleItem["kind"]) {
  if (kind === "prep") return { label: "Vorbereitung", variant: "secondary" as const };
  if (kind === "exam") return { label: "Prüfungs-Simulator", variant: "destructive" as const };
  return { label: "Lernen", variant: "outline" as const };
}


/* ======================= COMPONENT ======================= */

export default function ModuleCardsClient({ modules }: { modules: ModuleItem[] }) {
  const router = useRouter();
  const [meta, setMeta] = React.useState<Record<string, ModuleMeta>>({});
  const [profession, setProfession] = React.useState<ProfessionId>("industriemechaniker");
  const [plan, setPlan] = React.useState<PlanId>("free");
  const [isGuest, setIsGuest] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    const profile = getProfileClient();
    setIsGuest(!profile);

    if (profile?.professionId) setProfession(profile.professionId);

    setPlan(getPlanClient());
  }, []);

  React.useEffect(() => {
    const computeAll = () => {
      const next: Record<string, ModuleMeta> = {};
      for (const m of modules) next[m.id] = computeModuleMeta(m);
      setMeta(next);
    };

    computeAll();
    window.addEventListener("storage", computeAll);
    return () => window.removeEventListener("storage", computeAll);
  }, [modules]);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
      {modules.map((m) => {
        const info = meta[m.id];
        const status = info?.status ?? "Neu";
        const last = formatRelative(info?.lastActivityTs);
        const attempts = info?.attempts ?? 0;
        const bestExam = info?.bestExamPercent;
        const lastExam = info?.lastExamPercent;
        const progress = info?.progressPercent ?? 0;
        const isAp1Worktasks = m.id === "ap1-arbeitsaufgaben";
        const correctCount = info?.learnCorrect ?? 0;
        const totalPractice = info?.learnTotal ?? 25;
        const answeredCount = info?.learnAnswered ?? 0;
        const hasActivityData = progress > 0 || answeredCount > 0 || attempts > 0;
        const lastActivityAbsolute = formatAbsoluteDateTime(info?.lastActivityTs);
        const ap1ActivityLine = hasActivityData
          ? lastActivityAbsolute
            ? `Letzte Aktivität: ${lastActivityAbsolute}`
            : null
          : "Noch keine Aktivität.";

        const relevance = getModuleRelevanceForModule(profession, m.id);
        const examLabel = examBadgeLabel(relevance?.exam);
        const ljLabel = lehrjahrLabel(relevance?.lehrjahre);

        const kb = kindBadge(m.kind);

        const moduleLocked = mounted ? !canAccessModule(plan, m.id) : false;
        const examLocked = mounted ? (m.kind === "exam" ? !canAccessExam(plan) : false) : false;
        const locked = moduleLocked || examLocked;

        const primaryHref = locked
          ? isGuest
            ? "/signup"
            : "/pricing"
          : m.kind === "exam"
          ? `/exam/${m.id}`
          : `/learn/${m.id}`;

        const primaryLabel = locked
          ? isGuest
            ? "Konto erstellen"
            : "Pro freischalten"
          : m.kind === "exam"
          ? "Prüfung starten"
          : isAp1Worktasks
          ? progress === 0
            ? "Lernen starten"
            : "Fortsetzen"
          : status === "Neu"
          ? "Starten"
          : "Fortsetzen";
        const overviewHref = `/module/${m.id}`;

        return (
          <Surface
            key={m.id}
            className="cursor-pointer p-0 lp-surface-1"
            role="link"
            tabIndex={0}
            aria-label={`${m.title} öffnen`}
            onClick={(event) => {
              if (isInteractiveElement(event.target)) return;
              router.push(overviewHref);
            }}
            onKeyDown={(event) => {
              if (isInteractiveElement(event.target)) return;
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              router.push(overviewHref);
            }}
          >
            <Card className="h-full border-0 !bg-transparent shadow-none">
              <CardHeader className={isAp1Worktasks ? "space-y-1 pb-0" : "space-y-2 pb-4"}>
                <div className="relative min-h-8">
                  <CardTitle className="min-w-0 pr-36 lp-title leading-snug">{m.title}</CardTitle>
                  <Badge
                    className="absolute right-0 top-0 rounded-full whitespace-nowrap shrink-0"
                    variant={isAp1Worktasks ? "outline" : status === "Neu" ? "outline" : status === "In Arbeit" ? "default" : "secondary"}
                  >
                    {status}
                  </Badge>
                </div>

                {isAp1Worktasks ? (
                  <div className="text-xs text-muted-foreground">
                    AP1{typeof m.estimatedMinutes === "number" ? ` · ${m.estimatedMinutes} min` : ""}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {m.areaTitle ? (
                      <Badge variant="secondary" className="rounded-full">
                        {m.areaTitle}
                      </Badge>
                    ) : null}

                    <Badge variant={kb.variant} className="rounded-full">
                      {kb.label}
                    </Badge>

                    {examLabel ? (
                      <Badge variant="outline" className="rounded-full">
                        {examLabel}
                      </Badge>
                    ) : null}

                    {ljLabel ? (
                      <Badge variant="secondary" className="rounded-full">
                        {ljLabel}
                      </Badge>
                    ) : null}

                    {typeof m.estimatedMinutes === "number" ? (
                      <Badge variant="secondary" className="rounded-full">
                        {m.estimatedMinutes} min
                      </Badge>
                    ) : null}

                    {mounted && locked ? (
                      <Badge
                        variant="secondary"
                        className="inline-flex items-center gap-1 rounded-full"
                      >
                        <Lock className="h-3 w-3" />
                        {isGuest ? "Anmelden" : "Pro"}
                      </Badge>
                    ) : null}

                    {m.kind === "exam" && attempts > 0 ? (
                      <Badge variant="secondary" className="rounded-full">
                        {attempts} Prüfung{attempts === 1 ? "" : "en"}
                      </Badge>
                    ) : null}

                    {m.kind === "exam" && typeof bestExam === "number" ? (
                      <Badge variant="secondary" className="rounded-full">
                        Bestwert {bestExam}%
                      </Badge>
                    ) : null}

                    {m.kind === "exam" && typeof lastExam === "number" ? (
                      <Badge variant="secondary" className="rounded-full">
                        Letzte {lastExam}%
                      </Badge>
                    ) : null}
                  </div>
                )}

                {isAp1Worktasks ? (
                  ap1ActivityLine ? <div className="text-xs text-muted-foreground">{ap1ActivityLine}</div> : null
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {last ? `Zuletzt ${last}` : "Noch keine Aktivität gespeichert."}
                  </div>
                )}
              </CardHeader>

              <CardContent className={isAp1Worktasks ? "-mt-2 space-y-2" : "space-y-3"}>
                <div className={isAp1Worktasks ? "space-y-1.5" : "space-y-2"}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Fortschritt</span>
                    <span className="tabular-nums text-foreground/80">{progress}%</span>
                  </div>

                  <ProgressBar value={progress} />

                  {isAp1Worktasks ? (
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <div>{`${progress}% · ${correctCount}/${totalPractice} Aufgaben korrekt`}</div>
                      {answeredCount > 0 ? <div>{`${answeredCount}/${totalPractice} bearbeitet`}</div> : null}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {m.kind === "exam"
                        ? "Fortschritt basiert auf deinem besten Simulationsergebnis."
                        : "Fortschritt basiert auf korrekt gelösten Aufgaben (Übungsmodus)."}
                    </div>
                  )}
                </div>

                <div className="mt-auto border-t border-border/40 pt-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild className="rounded-full">
                      <Link href={primaryHref}>
                        {primaryLabel} <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {isAp1Worktasks
                      ? progress >= 80
                        ? "Bereit für Kompetenz-Check."
                        : "Sauber messen, sauber dokumentieren."
                      : locked
                      ? isGuest
                        ? "Tipp: Mit Konto speicherst du deinen Fortschritt."
                        : "Tipp: Pro schaltet alle Bereiche + Exam frei."
                      : m.kind === "exam"
                      ? "Tipp: Bearbeite die Simulation ohne Hilfe."
                      : "Tipp: 2 Aufgaben sauber - dann kurze Pause."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Surface>
        );
      })}
    </div>
  );
}



