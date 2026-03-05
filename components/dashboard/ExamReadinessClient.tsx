"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type Totals = { correct: number; wrong: number; help: number };
type ErrorTagsById = Record<string, string[]>;

const CRITICAL_TAGS = ["unit", "justification", "documentation", "tolerance", "calculation"] as const;

const TAG_LABELS: Record<string, string> = {
  unit: "Einheiten",
  justification: "Begründung",
  documentation: "Dokumentation",
  tolerance: "Toleranzen",
  calculation: "Rechnen",
};

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function normalizeTag(tag: string) {
  return String(tag ?? "").trim().toLowerCase();
}

function readMergedErrorTags(moduleIds: string[]) {
  const merged: ErrorTagsById = {};
  for (const moduleId of moduleIds) {
    const key = `lp:learn:errorTags:${moduleId}`;
    const parsed = safeParseJSON<ErrorTagsById>(localStorage.getItem(key));
    if (!parsed) continue;
    for (const [qid, tags] of Object.entries(parsed)) {
      merged[`${moduleId}::${qid}`] = Array.isArray(tags) ? tags : [];
    }
  }
  return merged;
}

function summarize(tagsById: ErrorTagsById) {
  const counts = new Map<string, number>();
  let total = 0;

  for (const tags of Object.values(tagsById)) {
    if (!Array.isArray(tags)) continue;
    for (const t of tags) {
      const tag = normalizeTag(t);
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      total += 1;
    }
  }

  const criticalCounts = CRITICAL_TAGS.map((t) => [t, counts.get(t) ?? 0] as const)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);

  const criticalTotal = criticalCounts.reduce((sum, [, c]) => sum + c, 0);
  return { total, criticalCounts, criticalTotal };
}

function getLevel(params: {
  attempts: number;
  assistedRate: number;
  wrongRate: number;
  criticalShare: number;
}) {
  const { attempts, assistedRate, wrongRate, criticalShare } = params;

  if (attempts < 12) {
    return {
      level: "unknown" as const,
      label: "Noch keine Aussage",
      mobileLabel: "Keine Aussage",
      badge: "outline" as const,
    };
  }

  if (attempts >= 40 && assistedRate <= 0.25 && wrongRate <= 0.25 && criticalShare <= 0.35) {
    return {
      level: "green" as const,
      label: "Prüfungsreif (Prep)",
      mobileLabel: "Prüfungsreif",
      badge: "secondary" as const,
    };
  }

  if (attempts >= 20 && assistedRate <= 0.4 && wrongRate <= 0.4) {
    return {
      level: "yellow" as const,
      label: "Fast - gezielt nachschärfen",
      mobileLabel: "Fast",
      badge: "default" as const,
    };
  }

  return {
    level: "red" as const,
    label: "Noch nicht prüfungsreif",
    mobileLabel: "Noch nicht",
    badge: "destructive" as const,
  };
}

export function ExamReadinessClient({
  moduleIds,
  totals,
  className,
  disabled = false,
  title = "Prüfungsreife",
}: {
  moduleIds: string[];
  totals?: Totals | null;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [summary, setSummary] = React.useState<{
    totalMarks: number;
    attempts: number;
    assistedRate: number;
    wrongRate: number;
    criticalShare: number;
    criticalCounts: ReadonlyArray<readonly [string, number]>;
  } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted || disabled) {
      if (disabled) setSummary(null);
      return;
    }

    const tagsById = readMergedErrorTags(moduleIds);
    const tagSummary = summarize(tagsById);

    const correct = totals?.correct ?? 0;
    const wrong = totals?.wrong ?? 0;
    const help = totals?.help ?? 0;
    const attempts = correct + wrong + help;

    const assistedRate = attempts ? help / attempts : 0;
    const wrongRate = attempts ? wrong / attempts : 0;
    const criticalShare = tagSummary.total ? tagSummary.criticalTotal / tagSummary.total : 0;

    setSummary({
      totalMarks: tagSummary.total,
      attempts,
      assistedRate,
      wrongRate,
      criticalShare,
      criticalCounts: tagSummary.criticalCounts,
    });
  }, [mounted, disabled, moduleIds, totals?.correct, totals?.wrong, totals?.help]);

  const level = disabled
    ? {
        level: "locked" as const,
        label: "Nur in Pro aktiv",
        mobileLabel: "Nur in Pro aktiv",
        badge: "outline" as const,
      }
    : getLevel({
        attempts: summary?.attempts ?? 0,
        assistedRate: summary?.assistedRate ?? 0,
        wrongRate: summary?.wrongRate ?? 0,
        criticalShare: summary?.criticalShare ?? 0,
      });

  const score =
    summary?.attempts && summary.attempts >= 12
      ? Math.round(
          100 *
            clamp01(
              1 -
                0.5 * clamp01(summary.assistedRate) -
                0.5 * clamp01(summary.wrongRate) -
                0.5 * clamp01(summary.criticalShare)
            )
        )
      : 0;

  const topCritical = (summary?.criticalCounts ?? []).slice(0, 2);

  return (
    <Card
      className={
        className
          ? `lp-accent-top border bg-transparent backdrop-blur lp-card-grad ${className}`
          : "lp-accent-top border bg-transparent backdrop-blur lp-card-grad"
      }
    >
      <CardHeader className="space-y-2 max-md:space-y-1 max-md:pb-1 max-md:px-3">
        <CardTitle className="text-base flex items-center justify-between gap-3 max-md:gap-2 max-md:min-w-0">
          <span className="max-md:text-sm max-md:whitespace-nowrap">{title}</span>
          <Badge
            variant={level.badge}
            className="rounded-full max-md:ml-auto max-md:px-2.5 max-md:text-center max-md:border-primary/60 max-md:text-foreground max-md:bg-transparent max-md:max-w-[9.5rem] max-md:min-w-0 max-md:shrink max-md:truncate"
          >
            <span className="max-md:hidden">{level.label}</span>
            <span className="md:hidden">{level.mobileLabel}</span>
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 max-md:space-y-2 max-md:px-3 max-md:pt-0 max-md:-mt-4">
        {disabled ? (
          <div className="text-sm text-muted-foreground max-md:text-sm max-md:leading-snug">
            In Free sichtbar, aber nicht aktiv. Mit Pro wird die Prüfungsreife live berechnet.
          </div>
        ) : level.level === "unknown" ? (
          <div className="text-sm text-muted-foreground max-md:text-sm max-md:leading-snug">
            Bearbeite zuerst ca. <span className="font-medium">12-20 Aufgaben</span>, dann ist die Einschätzung belastbar.
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Prüfungsreife-Score</span>
                <span className="font-medium">{score}%</span>
              </div>
              <Progress value={score} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-border/60 bg-transparent p-2 lp-card-grad-subtle">
                <div className="text-muted-foreground">Versuche</div>
                <div className="mt-0.5 font-semibold">{summary?.attempts ?? 0}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-transparent p-2 lp-card-grad-subtle">
                <div className="text-muted-foreground">Mit Hilfe</div>
                <div className="mt-0.5 font-semibold">{Math.round(100 * (summary?.assistedRate ?? 0))}%</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-transparent p-2 lp-card-grad-subtle">
                <div className="text-muted-foreground">Falsch</div>
                <div className="mt-0.5 font-semibold">{Math.round(100 * (summary?.wrongRate ?? 0))}%</div>
              </div>
            </div>

            {topCritical.length ? (
              <div className="rounded-xl border border-border/60 bg-transparent p-2 text-xs lp-card-grad-subtle">
                <div className="text-muted-foreground">Aktuell größte Punktkiller</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {topCritical.map(([tag, c]) => (
                    <Badge key={tag} variant="outline" className="rounded-full">
                      {(TAG_LABELS[tag] ?? tag) + ` - ${c}x`}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Noch keine Fehlermuster erkannt. Wenn du Aufgaben bearbeitest, erscheinen hier typische Punktkiller (z. B.
                Einheiten, Begründung).
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Hinweis: Das ist eine <span className="font-medium">Prep-Einschätzung</span>. Für echte Prüfungssicherheit:
              1 Exam-Run ohne Hilfe.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
