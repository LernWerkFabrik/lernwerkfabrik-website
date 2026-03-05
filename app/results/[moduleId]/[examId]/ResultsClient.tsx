"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { loadExamById, type StoredExamAnswerDraft, type StoredExamResult } from "@/lib/examStorage";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import Surface from "@/components/Surface";

function normalizeUnit(u: string) {
  return (u || "").trim().toLowerCase();
}

function parseNumber(s: string) {
  return Number(String(s).replace(",", "."));
}

function formatDraftAnswer(a: StoredExamAnswerDraft | undefined): string {
  if (!a) return "-";
  const value = String(a.value ?? "").trim();
  const unit = String(a.unit ?? "").trim();

  if (value.length > 0) {
    return [value, unit].filter(Boolean).join(" ");
  }

  const fields = a.textFields && typeof a.textFields === "object" ? Object.values(a.textFields) : [];
  const text = fields.map((v) => String(v ?? "").trim()).filter(Boolean).join(" ");
  return text || "-";
}

function formatExpectedAnswer(q: any): string {
  const answer = q?.answer;
  if (!answer || typeof answer !== "object") return "-";
  if (typeof answer.value === "number") {
    const unit = typeof answer.unit === "string" ? answer.unit : "";
    return [String(answer.value), unit].filter(Boolean).join(" ");
  }
  if (typeof answer.text === "string" && answer.text.trim().length > 0) return answer.text.trim();
  return "-";
}

type ComputedRow = {
  q: any;
  a: StoredExamAnswerDraft;
  score: {
    id: string;
    pointsPossible: number;
    pointsEarned: number;
    correct: boolean;
    type: string;
    competency?: string;
    details?: string;
  };
};

function computeLegacy(result: StoredExamResult) {
  const pointsPerQuestion = 10;
  const valueWeight = 0.8;

  const per: ComputedRow[] = (result.questions ?? []).map((q) => {
    const a = (result.answers?.[q.id] ?? { value: "", unit: "" }) as StoredExamAnswerDraft;
    const num = parseNumber(String(a.value ?? ""));

    const tol = typeof q.tolerance === "number" ? q.tolerance : 0.01;
    const expectedValue = Number((q as any)?.answer?.value);
    const expectedUnit = String((q as any)?.answer?.unit ?? "");

    const valueOk = Number.isFinite(num) && Number.isFinite(expectedValue) && Math.abs(num - expectedValue) <= tol;
    const unitOk = expectedUnit.length === 0 || normalizeUnit(String(a.unit ?? "")) === normalizeUnit(expectedUnit);

    const valuePoints = valueOk ? Math.round(pointsPerQuestion * valueWeight) : 0;
    const unitPoints = unitOk ? pointsPerQuestion - Math.round(pointsPerQuestion * valueWeight) : 0;
    const points = valuePoints + unitPoints;

    return {
      q,
      a,
      score: {
        id: q.id,
        pointsPossible: pointsPerQuestion,
        pointsEarned: points,
        correct: points >= pointsPerQuestion,
        type: "numeric",
      },
    };
  });

  const totalPoints = per.reduce((acc, row) => acc + row.score.pointsPossible, 0);
  const sum = per.reduce((acc, row) => acc + row.score.pointsEarned, 0);
  const percent = totalPoints > 0 ? Math.round((sum / totalPoints) * 100) : 0;
  const wrong = per.filter((row) => row.score.pointsEarned < row.score.pointsPossible).length;
  const passed = typeof (result as any).passed === "boolean" ? Boolean((result as any).passed) : percent >= 60;

  return {
    per,
    totalPoints,
    sum,
    percent,
    wrong,
    passed,
    competencyScores: [] as Array<{ competency: string; ratio: number; level: string }>,
    gateFailedBy: [] as string[],
    recommendations: [] as string[],
  };
}

export default function ResultsClient({
  moduleId,
  examId,
}: {
  moduleId: string;
  examId: string;
}) {
  const [data, setData] = useState<StoredExamResult | null>(null);

  useEffect(() => {
    const r = loadExamById(moduleId, examId);
    setData(r);
  }, [moduleId, examId]);

  const computed = useMemo(() => {
    if (!data) return null;

    const storedScores = Array.isArray(data.scoring?.perQuestion) ? data.scoring?.perQuestion ?? [] : [];
    if (storedScores.length === 0) return computeLegacy(data);

    const scoreById = new Map(storedScores.map((row) => [row.id, row]));
    const per: ComputedRow[] = (data.questions ?? []).map((q) => {
      const a = (data.answers?.[q.id] ?? { value: "", unit: "" }) as StoredExamAnswerDraft;
      const score =
        scoreById.get(q.id) ??
        ({
          id: q.id,
          pointsPossible: Number((q as any)?.meta?.points ?? 0),
          pointsEarned: 0,
          correct: false,
          type: String((q as any)?.type ?? "unknown"),
        } as ComputedRow["score"]);
      return { q, a, score };
    });

    const totalPoints = Number.isFinite(Number(data.totalPoints))
      ? Number(data.totalPoints)
      : per.reduce((acc, row) => acc + row.score.pointsPossible, 0);
    const sum = Number.isFinite(Number(data.sumPoints))
      ? Number(data.sumPoints)
      : per.reduce((acc, row) => acc + row.score.pointsEarned, 0);
    const percent = Number.isFinite(Number(data.percent))
      ? Number(data.percent)
      : totalPoints > 0
      ? Math.round((sum / totalPoints) * 100)
      : 0;

    const wrong = per.filter((row) => row.score.pointsEarned < row.score.pointsPossible).length;
    const passed = typeof data.passed === "boolean" ? data.passed : percent >= 60;

    const competencyScores = Array.isArray(data.scoring?.competencyScores)
      ? data.scoring?.competencyScores.map((row) => ({
          competency: String(row.competency),
          ratio: Number(row.ratio ?? 0),
          level: String(row.level ?? ""),
        }))
      : [];

    const gateFailedBy = Array.isArray(data.scoring?.gate?.failedBy)
      ? data.scoring?.gate?.failedBy.map((x) => String(x))
      : [];

    const recommendations = Array.isArray(data.scoring?.recommendations)
      ? data.scoring?.recommendations.map((x) => String(x))
      : [];

    return {
      per,
      totalPoints,
      sum,
      percent,
      wrong,
      passed,
      competencyScores,
      gateFailedBy,
      recommendations,
    };
  }, [data]);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Surface className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Ergebnis nicht gefunden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Dieses Ergebnis ist nicht (mehr) im Browser gespeichert.</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/module/${moduleId}`}>Zum Modul</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href={`/exam/${moduleId}`}>Neue Prüfung starten</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Surface>
      </div>
    );
  }

  if (!computed) return null;

  const wrongPracticeIds = computed.per
    .filter((row) => row.score.pointsEarned < row.score.pointsPossible)
    .map((row) => row.q.practiceId ?? row.q.id)
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Surface className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Ergebnis</h1>
            <p className="text-sm text-muted-foreground">
              Modul: <span className="font-semibold text-foreground">{data.moduleId}</span> • {new Date(data.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ID: <span className="font-mono">{data.examId}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant={computed.passed ? "default" : "destructive"} className="rounded-full">
              {computed.percent}% ({computed.sum}/{computed.totalPoints} Punkte)
            </Badge>

            <span className="text-sm text-muted-foreground">
              {computed.passed ? "Bestanden" : "Noch nicht bestanden"}
            </span>
          </div>
        </div>
      </Surface>

      {computed.gateFailedBy.length > 0 ? (
        <Surface className="p-4">
          <p className="text-sm text-muted-foreground">Nicht bestanden wegen: {computed.gateFailedBy.join(", ")}</p>
        </Surface>
      ) : null}

      {computed.competencyScores.length > 0 ? (
        <Surface className="p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">Kompetenzprofil</div>
          <div className="flex flex-wrap gap-2">
            {computed.competencyScores.map((row) => (
              <Badge key={row.competency} variant="outline" className="rounded-full">
                {row.competency}: {Math.round(row.ratio * 100)}% ({row.level})
              </Badge>
            ))}
          </div>
          {computed.recommendations.length > 0 ? (
            <div className="text-xs text-muted-foreground">Empfehlung: {computed.recommendations.join(" | ")}</div>
          ) : null}
        </Surface>
      ) : null}

      <Surface className="p-0">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="space-y-2">
            <CardTitle>Detailauswertung</CardTitle>
            <Separator className="bg-border/60" />
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">Fragen: {data.questions.length}</Badge>
              <Badge variant="outline" className="rounded-full">Fehler: {computed.wrong}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {computed.per.map((row, i) => {
              const status =
                row.score.pointsEarned >= row.score.pointsPossible
                  ? "korrekt"
                  : row.score.pointsEarned > 0
                  ? "teilweise"
                  : "falsch";

              const pointsVariant =
                row.score.pointsEarned >= row.score.pointsPossible
                  ? "default"
                  : row.score.pointsEarned > 0
                  ? "secondary"
                  : "destructive";

              return (
                <div
                  key={row.q.id}
                  className="rounded-xl border bg-card/60 p-4 text-card-foreground backdrop-blur shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">Aufgabe {i + 1}</div>

                    <div className="flex items-center gap-2">
                      <Badge variant={pointsVariant} className="rounded-full">
                        {row.score.pointsEarned}/{row.score.pointsPossible} Punkte
                      </Badge>

                      <Badge variant="outline" className="rounded-full text-muted-foreground">
                        {status}
                      </Badge>
                    </div>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{row.q.prompt}</p>

                  <div className="mt-3 text-sm text-muted-foreground space-y-1">
                    <div>
                      Deine Antwort: <span className="font-semibold text-foreground">{formatDraftAnswer(row.a)}</span>
                    </div>
                    <div>
                      Erwartet: <span className="font-semibold text-foreground">{formatExpectedAnswer(row.q)}</span>
                    </div>
                    {row.score.details ? (
                      <div className="text-xs">Hinweis: {row.score.details}</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </Surface>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/results/${moduleId}`}>Zur Historie</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/learn/${moduleId}`}>Zum Lernmodus</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/module/${moduleId}`}>Zum Modul</Link>
        </Button>

        {wrongPracticeIds.length ? (
          <Button asChild className="rounded-full">
            <Link href={`/learn/${moduleId}?tab=practice&filterIds=${encodeURIComponent(wrongPracticeIds.join(","))}`}>
              Fehler üben
            </Link>
          </Button>
        ) : (
          <Badge variant="secondary" className="rounded-full">
            Keine Fehler
          </Badge>
        )}

        <Button asChild className="rounded-full">
          <Link href={`/exam/${moduleId}`}>Neue Prüfung starten</Link>
        </Button>
      </div>
    </div>
  );
}
