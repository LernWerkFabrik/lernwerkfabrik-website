"use client";

import * as React from "react";
import Link from "next/link";

import {
  EXAM_CHECK_DURATION_MIN,
  EXAM_CHECK_MIN_QUESTIONS,
  EXAM_CHECK_QUESTIONS_COUNT,
  EXAM_CHECK_READY_PERCENT,
  getExamCheckStatus,
  type ExamCheckQuestion,
  type ExamCheckStatusLabel,
} from "@/lib/examCheck";
import { getPlanClient } from "@/lib/entitlements";
import {
  clearExamCheckSession,
  consumeExamCheckAttempt,
  createExamCheckSession,
  getExamCheckInfo,
  getExamCheckResultCopy,
  markExamCheckUpgradeIntent,
  readExamCheckSession,
  saveExamCheckResult,
  trackExamCheckEvent,
  writeExamCheckSession,
  type ExamCheckAnswer,
  type ExamCheckInfo,
  type ExamCheckSession,
} from "@/lib/examCheckStorage";

import Surface from "@/components/Surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

type Phase = "intro" | "active" | "result" | "locked";

type ResultTopic = {
  moduleId: string;
  title: string;
  count: number;
};

type ResultState = {
  score: number;
  points: number;
  maxPoints: number;
  status: ExamCheckStatusLabel;
  weakTopics: ResultTopic[];
  submitReason: "manual" | "timeout";
};

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatCountdown(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const hh = Math.floor(s / 3600);
  return hh > 0 ? `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}` : `${pad2(mm)}:${pad2(ss)}`;
}

function normalizeUnit(u: string) {
  return String(u ?? "").trim().toLowerCase();
}

function parseNumber(raw: string) {
  return Number(String(raw ?? "").replace(",", "."));
}

function pickQuestionSet(pool: ExamCheckQuestion[]) {
  const target = Math.min(EXAM_CHECK_QUESTIONS_COUNT, pool.length);
  if (target <= 0) return [];

  const selected: ExamCheckQuestion[] = [];
  const used = new Set<string>();

  const ap2Preferred = shuffle(pool.filter((q) => q.exam === "AP2" || q.exam === "AP1_AP2"));
  const minAp2 = Math.min(2, ap2Preferred.length, target);
  for (let i = 0; i < minAp2; i += 1) {
    selected.push(ap2Preferred[i]);
    used.add(ap2Preferred[i].id);
  }

  const fallback = shuffle(pool);
  for (const q of fallback) {
    if (selected.length >= target) break;
    if (used.has(q.id)) continue;
    selected.push(q);
    used.add(q.id);
  }

  return selected;
}

function scoreQuestion(q: ExamCheckQuestion, answer: ExamCheckAnswer, pointsPerQuestion: number) {
  const num = parseNumber(answer.value);
  const tolerance = typeof q.tolerance === "number" ? q.tolerance : 0.01;

  const valueOk = Number.isFinite(num) && Math.abs(num - q.answer.value) <= tolerance;
  const unitOk = normalizeUnit(answer.unit) === normalizeUnit(q.answer.unit);

  const valuePoints = valueOk ? Math.round(pointsPerQuestion * 0.8) : 0;
  const unitPoints = unitOk ? pointsPerQuestion - Math.round(pointsPerQuestion * 0.8) : 0;
  return { points: valuePoints + unitPoints, valueOk, unitOk };
}

function badgeVariantForStatus(status: ExamCheckStatusLabel): "default" | "secondary" | "destructive" {
  if (status === "prüfungsreif") return "default";
  if (status === "kritisch") return "secondary";
  return "destructive";
}

function initialInfo(): ExamCheckInfo {
  return {
    maxAttempts: 2,
    attemptsUsed: 0,
    attemptsRemaining: 2,
    lastScore: null,
    lastCompletedAt: null,
    hasActiveSession: false,
  };
}

export default function ExamCheckClient({
  pool,
  autoStart,
  hasEnoughPool,
}: {
  pool: ExamCheckQuestion[];
  autoStart: boolean;
  hasEnoughPool: boolean;
}) {
  const [phase, setPhase] = React.useState<Phase>("intro");
  const [info, setInfo] = React.useState<ExamCheckInfo>(initialInfo);
  const [isPro, setIsPro] = React.useState(false);

  const [questions, setQuestions] = React.useState<ExamCheckQuestion[]>([]);
  const [answers, setAnswers] = React.useState<Record<string, ExamCheckAnswer>>({});
  const [index, setIndex] = React.useState(0);
  const [visited, setVisited] = React.useState<Set<number>>(new Set([0]));
  const [startedAtMs, setStartedAtMs] = React.useState(0);
  const [durationSec, setDurationSec] = React.useState(EXAM_CHECK_DURATION_MIN * 60);
  const [timeLeftSec, setTimeLeftSec] = React.useState(EXAM_CHECK_DURATION_MIN * 60);

  const [confirmSubmitOpen, setConfirmSubmitOpen] = React.useState(false);
  const [result, setResult] = React.useState<ResultState | null>(null);

  const startedRef = React.useRef(false);
  const submitGuardRef = React.useRef(false);
  const submitNowRef = React.useRef<(reason: "manual" | "timeout") => void>(() => undefined);

  const pointsPerQuestion = 10;
  const totalPoints = questions.length * pointsPerQuestion;
  const current = questions[index];

  const refreshInfo = React.useCallback(() => {
    setInfo(getExamCheckInfo());
  }, []);

  const restoreFromSession = React.useCallback((session: ExamCheckSession) => {
    const safeIndex = Math.min(Math.max(0, session.index ?? 0), Math.max(0, session.questions.length - 1));

    const restoredVisited = new Set<number>();
    for (const n of session.visitedIdx ?? []) {
      const idx = Number(n);
      if (Number.isFinite(idx) && idx >= 0 && idx < session.questions.length) restoredVisited.add(idx);
    }
    if (!restoredVisited.size) restoredVisited.add(0);

    const restoredAnswers = Object.fromEntries(
      session.questions.map((q) => {
        const a = session.answers[q.id];
        if (!a) return [q.id, { value: "", unit: q.answer.unit } satisfies ExamCheckAnswer];
        return [q.id, { value: String(a.value ?? ""), unit: String(a.unit ?? q.answer.unit) } satisfies ExamCheckAnswer];
      })
    );

    setQuestions(session.questions);
    setAnswers(restoredAnswers);
    setIndex(safeIndex);
    setVisited(restoredVisited);
    setStartedAtMs(session.startedAtMs);
    setDurationSec(session.durationSec);
    setResult(null);
    submitGuardRef.current = false;
    setPhase("active");
  }, []);

  const startNewCheck = React.useCallback(() => {
    if (!hasEnoughPool) {
      setPhase("locked");
      return;
    }

    const consumed = consumeExamCheckAttempt();
    if (!consumed.ok) {
      refreshInfo();
      setPhase("locked");
      return;
    }

    const selected = pickQuestionSet(pool);
    if (selected.length < EXAM_CHECK_MIN_QUESTIONS) {
      refreshInfo();
      setPhase("locked");
      return;
    }

    const session = createExamCheckSession(selected);
    writeExamCheckSession(session);
    restoreFromSession(session);
    refreshInfo();

    trackExamCheckEvent("exam_check_started", {
      source: "start",
      attempts_used: consumed.used,
      attempts_remaining: consumed.remaining,
      question_count: selected.length,
    });
  }, [hasEnoughPool, pool, refreshInfo, restoreFromSession]);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const plan = getPlanClient();
    const pro = plan === "pro";
    setIsPro(pro);

    refreshInfo();

    if (pro) {
      setPhase("locked");
      return;
    }

    const session = readExamCheckSession();
    if (session) {
      restoreFromSession(session);
      return;
    }

    const currentInfo = getExamCheckInfo();
    if (!hasEnoughPool || currentInfo.attemptsRemaining <= 0) {
      setPhase("locked");
      return;
    }

    if (autoStart) {
      startNewCheck();
      return;
    }

    setPhase("intro");
  }, [autoStart, hasEnoughPool, refreshInfo, restoreFromSession, startNewCheck]);

  React.useEffect(() => {
    if (phase !== "active" || startedAtMs <= 0 || !questions.length) return;
    const snapshot: ExamCheckSession = {
      v: 1,
      startedAtMs,
      durationSec,
      index,
      visitedIdx: Array.from(visited),
      questions,
      answers,
    };
    writeExamCheckSession(snapshot);
  }, [phase, startedAtMs, durationSec, index, visited, questions, answers]);

  React.useEffect(() => {
    if (phase !== "active" || startedAtMs <= 0) return;

    const tick = () => {
      const elapsedSec = Math.floor((Date.now() - startedAtMs) / 1000);
      const left = Math.max(0, durationSec - elapsedSec);
      setTimeLeftSec(left);

      if (left <= 0) {
        submitNowRef.current("timeout");
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, startedAtMs, durationSec]);

  const answerState = React.useMemo(() => {
    const total = questions.length;
    let answered = 0;
    for (const q of questions) {
      const a = answers[q.id] ?? { value: "", unit: "" };
      const hasValue = String(a.value ?? "").trim().length > 0;
      const hasUnit = String(a.unit ?? "").trim().length > 0;
      if (hasValue && hasUnit) answered += 1;
    }
    const empty = Math.max(0, total - answered);
    return { total, answered, empty, notVisited: Math.max(0, total - visited.size) };
  }, [questions, answers, visited]);

  const setAnswer = React.useCallback((qid: string, patch: Partial<ExamCheckAnswer>) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: { ...prev[qid], ...patch },
    }));
  }, []);

  const goto = React.useCallback(
    (nextIndex: number) => {
      const clamped = Math.min(Math.max(0, nextIndex), Math.max(0, questions.length - 1));
      setIndex(clamped);
      setVisited((prev) => {
        const next = new Set(prev);
        next.add(clamped);
        return next;
      });
    },
    [questions.length]
  );

  const submitNow = React.useCallback(
    (submitReason: "manual" | "timeout") => {
      if (submitGuardRef.current) return;
      submitGuardRef.current = true;

      const per = questions.map((q) => {
        const a = answers[q.id] ?? { value: "", unit: "" };
        return { q, ...scoreQuestion(q, a, pointsPerQuestion) };
      });

      const points = per.reduce((acc, x) => acc + x.points, 0);
      const score = totalPoints > 0 ? Math.round((points / totalPoints) * 100) : 0;
      const status = getExamCheckStatus(score);

      const weakMap = new Map<string, ResultTopic>();
      for (const row of per) {
        if (row.points >= pointsPerQuestion) continue;
        const key = `${row.q.moduleId}::${row.q.moduleTitle}`;
        const existing = weakMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          weakMap.set(key, {
            moduleId: row.q.moduleId,
            title: row.q.moduleTitle,
            count: 1,
          });
        }
      }

      const weakTopics = Array.from(weakMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 2);

      saveExamCheckResult(score);
      clearExamCheckSession();
      refreshInfo();

      setResult({
        score,
        points,
        maxPoints: totalPoints,
        status,
        weakTopics,
        submitReason,
      });
      setPhase("result");
      setConfirmSubmitOpen(false);

      trackExamCheckEvent("exam_check_completed", {
        score,
        status,
        submit_reason: submitReason,
        question_count: questions.length,
      });
    },
    [answers, pointsPerQuestion, questions, refreshInfo, totalPoints]
  );

  React.useEffect(() => {
    submitNowRef.current = submitNow;
  }, [submitNow]);

  if (isPro) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Prüfungs-Check ist im Free-Plan verfügbar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Du hast bereits Pro. Nutze direkt den vollständigen Prüfungs-Simulator ohne Free-Limit.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="rounded-full">
                  <Link href="/module">Zum Prüfungs-Simulator</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/dashboard">Zum Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Surface>
      </div>
    );
  }

  if (!hasEnoughPool) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Prüfungs-Check aktuell nicht verfügbar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Für den Check werden mindestens {EXAM_CHECK_MIN_QUESTIONS} geeignete Aufgaben benötigt.
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard">Zurück zum Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </Surface>
      </div>
    );
  }

  const exhausted = phase !== "active" && !info.hasActiveSession && info.attemptsRemaining <= 0;
  const trainingHref = result?.weakTopics[0] ? `/learn/${encodeURIComponent(result.weakTopics[0].moduleId)}` : "/module";

  if (phase === "locked" && exhausted) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Kostenloser Prüfungs-Check</span>
                <Badge variant="destructive" className="rounded-full">
                  Aufgebraucht
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deine Free-Versuche sind aufgebraucht. Für weitere Exam-Runs nutze den vollständigen Prüfungs-Simulator.
              </p>

              {typeof info.lastScore === "number" ? (
                <div className="text-sm text-muted-foreground">
                  Letztes Ergebnis: <span className="font-semibold text-foreground">{info.lastScore}%</span>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button asChild className="rounded-full">
                  <Link
                    href="/pricing"
                    onClick={() => markExamCheckUpgradeIntent("locked_screen")}
                  >
                    Prüfungs-Simulator freischalten
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/module">Training starten</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/dashboard">Zurück zum Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Surface>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Surface tone="neutral" className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Kostenloser Prüfungs-Check</h1>
              <p className="text-sm text-muted-foreground">10-15 Minuten • 8-12 Aufgaben • Diagnose-Test</p>
            </div>
            <Badge variant={info.attemptsRemaining === 1 ? "secondary" : "outline"} className="rounded-full">
              {info.attemptsRemaining} von {info.maxAttempts} Versuchen übrig
            </Badge>
          </div>
        </Surface>

        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Prüfungsreife schnell einschätzen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Der Check zeigt dir, wie stabil dein aktueller Stand unter Zeitdruck ist. Es gibt kein Live-Feedback und
                keine Detailanalyse im Free-Plan.
              </p>

              {typeof info.lastScore === "number" ? (
                <div className="text-sm text-muted-foreground">
                  Letztes Ergebnis: <span className="font-semibold text-foreground">{info.lastScore}%</span>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button className="rounded-full" onClick={startNewCheck}>
                  Prüfungs-Check starten
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/dashboard">Zurück zum Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Surface>
      </div>
    );
  }

  if (phase === "result" && result) {
    const statusVariant = badgeVariantForStatus(result.status);
    const scarcityText =
      info.attemptsRemaining <= 0
        ? "Keine kostenlosen Checks mehr verfügbar"
        : info.attemptsRemaining === 1
          ? "Noch 1 kostenloser Check verfügbar"
          : `Noch ${info.attemptsRemaining} kostenlose Checks verfügbar`;
    const boosterText =
      result.status === "prüfungsreif"
        ? "Für echte Sicherheit: mindestens 2-3 vollständige Simulationen."
        : "Die meisten bestehen erst nach 2-3 vollständigen Simulationen.";

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Surface tone="neutral" className="p-5">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Dein Prüfungs-Check Ergebnis</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant} className="rounded-full">
                {result.status}
              </Badge>
              <span className="text-sm text-muted-foreground">Bestehen ab: {EXAM_CHECK_READY_PERCENT}%</span>
              {result.submitReason === "timeout" ? (
                <Badge variant="outline" className="rounded-full">
                  automatisch abgegeben
                </Badge>
              ) : null}
            </div>
          </div>
        </Surface>

        <Surface tone="neutral" className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="space-y-5 pt-6">
              <div>
                <Badge variant="outline" className="rounded-full">
                  {scarcityText}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Prüfungsreife-Score</span>
                  <span className="font-semibold text-foreground">{result.score}%</span>
                </div>
                <Progress value={result.score} />
                <div className="text-xs text-muted-foreground">
                  Punkte: {result.points}/{result.maxPoints}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">{getExamCheckResultCopy(result.status)}</div>
              <div className="text-xs text-muted-foreground">
                Kurze Checks können schwanken. Für eine verlässliche Einschätzung empfiehlt sich der vollständige
                Prüfungs-Simulator.
              </div>

              <div className="rounded-xl border border-border/60 bg-transparent p-3 text-sm lp-card-grad-subtle">
                <div className="font-medium">Themenhinweise</div>
                {result.weakTopics.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.weakTopics.map((topic) => (
                      <Badge key={`${topic.moduleId}:${topic.title}`} variant="outline" className="rounded-full">
                        {topic.title}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-muted-foreground">Keine deutlichen Schwachthemen erkannt.</div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">{boosterText}</div>
                <Button asChild className="rounded-full">
                  <Link href="/pricing" onClick={() => markExamCheckUpgradeIntent("result_screen")}>
                    Prüfungs-Simulator freischalten
                  </Link>
                </Button>

                <div>
                  <Button asChild variant="outline" className="rounded-full h-9 px-4 text-sm">
                    <Link href={trainingHref}>Training starten</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <Link href="/dashboard" className="underline-offset-4 hover:underline">
                    Zum Dashboard
                  </Link>
                  {info.attemptsRemaining > 0 ? (
                    <button
                      type="button"
                      onClick={startNewCheck}
                      className="underline-offset-4 hover:underline"
                    >
                      Nächsten Check starten
                    </button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </Surface>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Surface tone="neutral" className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Kostenloser Prüfungs-Check</h1>
            <p className="text-sm text-muted-foreground">
              Kein Live-Feedback während des Checks. Abgabe am Ende für Score & kurze Themenhinweise.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={timeLeftSec <= 2 * 60 ? "destructive" : timeLeftSec <= 5 * 60 ? "secondary" : "outline"}
              className={["rounded-full font-mono tabular-nums", timeLeftSec <= 2 * 60 ? "animate-pulse" : ""].join(" ")}
            >
              {formatCountdown(timeLeftSec)}
            </Badge>
            <Badge variant="default" className="rounded-full">
              In Bearbeitung
            </Badge>
          </div>
        </div>
      </Surface>

      <Surface tone="neutral" className="p-0">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="text-base font-semibold">
                Aufgabe {index + 1} von {questions.length}
              </span>
              <span className="text-sm font-normal text-muted-foreground">{pointsPerQuestion} Punkte</span>
            </CardTitle>

            <div className="rounded-xl border bg-card/60 p-4 text-card-foreground backdrop-blur">
              <div className="text-xs text-muted-foreground">Aufgabenstellung</div>
              <p className="mt-1 text-base font-semibold leading-relaxed text-foreground">{current?.prompt}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {current ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-foreground">Ergebnis</label>
                  <Input
                    numeric
                    numericMode={current.input?.mode ?? "decimal"}
                    allowNegative={current.input?.allowNegative ?? false}
                    maxDecimals={(current.input?.mode ?? "decimal") === "decimal" ? current.input?.maxDecimals : undefined}
                    value={answers[current.id]?.value ?? ""}
                    onChange={(e) => setAnswer(current.id, { value: e.target.value })}
                    placeholder={(current.input?.mode ?? "decimal") === "integer" ? "Ganze Zahl eingeben" : "Zahl eingeben"}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Einheit</label>
                  <Input
                    value={answers[current.id]?.unit ?? current.answer.unit}
                    onChange={(e) => setAnswer(current.id, { unit: e.target.value })}
                    placeholder={current.answer.unit}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => goto(index - 1)} disabled={index === 0}>
                Zurück
              </Button>

              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => goto(index + 1)}
                disabled={index >= questions.length - 1}
              >
                Nächste
              </Button>

              <div className="flex-1" />

              <Button className="rounded-full" onClick={() => setConfirmSubmitOpen(true)}>
                Prüfungs-Check abgeben
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">Hinweis: Eingaben mit Komma sind möglich (z. B. 10,5).</p>
          </CardContent>
        </Card>
      </Surface>

      <AlertDialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle>Check wirklich abgeben?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Nach der Abgabe siehst du deinen Score und 1-2 Themenhinweise.
            </AlertDialogDescription>
            <div className="rounded-lg border bg-card/60 p-3 backdrop-blur">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Beantwortet: {answerState.answered}/{answerState.total}</Badge>
                {answerState.empty > 0 ? <Badge variant="destructive">Offen: {answerState.empty}</Badge> : null}
                {answerState.notVisited > 0 ? <Badge variant="secondary">Nicht angesehen: {answerState.notVisited}</Badge> : null}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="rounded-full">
                Abbrechen
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button className="rounded-full" onClick={() => submitNow("manual")}>
                Final abgeben
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
