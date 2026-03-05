"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type LearnHeaderProps = {
  moduleId: string;
  title: string;
  desc?: string;
  isFiltered: boolean;
  tabsLine?: string;

  // âœ… Free Counter
  plan?: "free" | "pro";
  freeRuns?: { allowed: boolean; used: number; remaining: number; max: number } | null;

  checkedCount: number;
  total: number;
  progressPercent: number;

  cleanCorrectCount: number;
  assistedCorrectCount: number;
  redCheckedWrongCount: number;
  inProgressCount: number;

  // bleibt im Props-Contract, wird aber NICHT mehr im Header gerendert
  onCheckAll: () => void;

  onRepeat: () => void;
  onNewTasks: () => void;

  /** true, wenn NICHT im Ãœbungs-Tab */
  dimStatus?: boolean;

  /** wechselt in den Ãœbungs-Tab */
  onActivatePractice?: () => void;
};

export default function LearnHeader({
  moduleId,
  title,
  desc,
  isFiltered,
  tabsLine,

  plan = "free",
  freeRuns = null,

  checkedCount,
  total,
  progressPercent,

  cleanCorrectCount,
  assistedCorrectCount,
  redCheckedWrongCount,
  inProgressCount,

  onCheckAll, // bewusst ungenutzt im Header (wird unten platziert)
  onRepeat,
  onNewTasks,

  dimStatus = false,
  onActivatePractice,
}: LearnHeaderProps) {
  // âœ… Hydration-safe: SSR + erster Client-Render zeigen stabile Werte (0 / leer),
  // danach (mounted) werden echte Werte aus localStorage/state gezeigt.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const safeCheckedCount = mounted ? checkedCount : 0;
  const safeProgressPercent = mounted ? progressPercent : 0;
  const safeCleanCorrectCount = mounted ? cleanCorrectCount : 0;
  const safeAssistedCorrectCount = mounted ? assistedCorrectCount : 0;
  const safeRedCheckedWrongCount = mounted ? redCheckedWrongCount : 0;
  const safeInProgressCount = mounted ? inProgressCount : 0;

  const progressTitle = useMemo(() => {
    return mounted ? `${progressPercent}% erledigt` : undefined;
  }, [mounted, progressPercent]);

  const showFreeCounter = mounted && plan === "free" && Boolean(freeRuns?.allowed);
  const freeLocked = showFreeCounter && (freeRuns?.remaining ?? 0) <= 0;

  const freeLabel = useMemo(() => {
    if (!showFreeCounter) return "";
    return `Free ${freeRuns!.remaining}/${freeRuns!.max}`;
  }, [showFreeCounter, freeRuns]);

  return (
    <div className="space-y-6">
      {/* Kopfbereich â€“ NIE gedimmt */}
      <div className="flex items-start justify-between gap-4 max-md:flex-col max-md:items-start">
        <div className="space-y-1 max-md:space-y-0.5">
          <h1 className="text-3xl font-bold max-md:text-2xl max-md:leading-snug">
            <span className="max-md:block">Lernmodus:</span> {title}
          </h1>
          {desc ? (
            <p
              lang="de"
              className="text-sm text-muted-foreground max-md:text-xs max-md:leading-snug text-justify hyphens-auto"
            >
              {desc}
            </p>
          ) : null}
          <p
            lang="de"
            className="text-sm text-muted-foreground max-md:text-xs max-md:leading-snug text-justify hyphens-auto"
          >
            {(tabsLine ?? "Erklärung, Beispiel und Übung.")} {isFiltered ? "Fehlertraining aktiv." : "Hier darfst du Hilfe nutzen."}
          </p>
        </div>

        <div className="flex gap-2 max-md:w-full max-md:flex-wrap">
          <Button asChild variant="outline" className="rounded-full max-md:h-9 max-md:px-3 max-md:text-xs">
            <Link href={`/module/${moduleId}`}>Modul-Übersicht</Link>
          </Button>

          {isFiltered ? (
            <Button asChild variant="secondary" className="rounded-full max-md:h-9 max-md:px-3 max-md:text-xs">
              <Link href={`/learn/${moduleId}`}>Alle Übungen</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Statusbereich â€“ gedimmt + klickbar */}
      <div
        role={dimStatus ? "button" : undefined}
        tabIndex={dimStatus ? 0 : -1}
        title={dimStatus ? "Zu Übung wechseln, um Aktionen auszuführen" : undefined}
        onClick={() => {
          if (dimStatus) onActivatePractice?.();
        }}
        onKeyDown={(e) => {
          if (!dimStatus) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivatePractice?.();
          }
        }}
        className={["transition-all", dimStatus ? "opacity-75 saturate-75 cursor-pointer" : ""].join(" ")}
      >
        <Card className="rounded-2xl border-border/60 bg-transparent lp-card-grad shadow-[0_22px_56px_-42px_rgba(20,24,32,0.28)]">
          <CardContent className="pt-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 tabular-nums">
              {/* LEFT: Bearbeitet zuerst */}
              <div className="flex items-center gap-2 max-md:min-w-0 max-md:flex-1">
                <span className="text-sm text-muted-foreground">{isFiltered ? "Modus:" : "Bearbeitet:"}</span>

                <span
                  className="text-sm font-semibold text-foreground/90"
                  title={progressTitle}
                  suppressHydrationWarning
                >
                  {isFiltered ? "Fehlertraining" : `${safeCheckedCount} von ${total}`}
                </span>

                {showFreeCounter && !isFiltered ? (
                  <Badge
                    variant="outline"
                    className={[
                      "rounded-full whitespace-nowrap text-xs max-md:text-[11.5px] max-md:px-[7px] max-md:py-0.5",
                      freeLocked
                        ? "border-red-500/40 text-red-600"
                        : "border-border/60 text-foreground/75 bg-transparent lp-card-grad-subtle",
                    ].join(" ")}
                    title="Verbleibende Free-Durchgänge (Neue Aufgaben)"
                    suppressHydrationWarning
                  >
                    {freeLabel}
                  </Badge>
                ) : null}

              </div>

              <div className="ml-auto flex items-center max-md:w-[calc((100%-1rem)/3)]">
                <Badge
                  variant="secondary"
                  className="w-full justify-center rounded-full whitespace-nowrap text-center max-md:text-[11.5px] max-md:px-[7px] max-md:py-0.5 md:w-auto"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-yellow-300 mr-2 align-middle" />
                  In Arbeit: <span className="ml-1" suppressHydrationWarning>{safeInProgressCount}</span>
                </Badge>
              </div>

              {/* Divider (dezent) */}
              <div className="hidden md:block h-4 w-px bg-border/70 mx-1" />

              {/* Stats in derselben Zeile */}
              <div className="flex w-full items-center justify-between gap-2.5 md:flex-wrap md:justify-start md:items-center">
                <Badge
                  variant="secondary"
                  className="shrink-0 rounded-full whitespace-nowrap max-md:text-[11.5px] max-md:px-2.5 max-md:py-0.5"
                >
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500 mr-1.5 align-middle" />
                  Eigenständig: <span className="ml-1" suppressHydrationWarning>{safeCleanCorrectCount}</span>
                </Badge>

                <Badge
                  variant="secondary"
                  className="shrink-0 rounded-full whitespace-nowrap max-md:text-[11.5px] max-md:px-2.5 max-md:py-0.5"
                >
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-yellow-500 mr-1.5 align-middle" />
                  Mit Hilfe: <span className="ml-1" suppressHydrationWarning>{safeAssistedCorrectCount}</span>
                </Badge>

                <Badge
                  variant="secondary"
                  className="shrink-0 rounded-full whitespace-nowrap max-md:text-[11.5px] max-md:px-2.5 max-md:py-0.5"
                >
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500 mr-1.5 align-middle" />
                  Falsch: <span className="ml-1" suppressHydrationWarning>{safeRedCheckedWrongCount}</span>
                </Badge>

              </div>

              {/* RIGHT: Counter + Actions */}
              <div className="ml-auto grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:items-center md:justify-end">
                {!isFiltered ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center rounded-full md:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRepeat();
                      }}
                      disabled={dimStatus}
                      title="Gleiche Aufgabenvariante nochmal (Fortschritt zurücksetzen)"
                    >
                      Wiederholen
                    </Button>

                    <Button
                      type="button"
                      className="w-full justify-center rounded-full md:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewTasks();
                      }}
                      disabled={dimStatus || safeInProgressCount > 0 || freeLocked}
                      title={
                        freeLocked
                          ? "Free-Limit erreicht – für weitere Durchgänge brauchst du Pro."
                          : safeInProgressCount > 0
                            ? "Schließe zuerst Aufgaben in Arbeit ab (oder prüfe sie), bevor du neue Aufgaben erzeugst."
                            : "Neue Aufgabenvariante erzeugen"
                      }
                    >
                      Neue Aufgaben
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <Progress value={safeProgressPercent} suppressHydrationWarning />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

