"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  getExamCheckInfo,
  getExamCheckStatusBadge,
  markExamCheckUpgradeIntent,
  trackExamCheckEvent,
  type ExamCheckInfo,
} from "@/lib/examCheckStorage";

export function FreeExamCheckCardClient({ className }: { className?: string }) {
  const [info, setInfo] = React.useState<ExamCheckInfo | null>(null);

  React.useEffect(() => {
    const refresh = () => setInfo(getExamCheckInfo());
    refresh();
    trackExamCheckEvent("exam_check_card_viewed");

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!info) return null;

  const exhausted = !info.hasActiveSession && info.attemptsRemaining <= 0;
  const isNew = info.attemptsUsed === 0 && info.lastScore === null && !info.hasActiveSession;
  const badgeLabel = isNew ? "Neu" : getExamCheckStatusBadge(info);
  const badgeVariant = isNew
    ? "default"
    : badgeLabel === "Aufgebraucht"
      ? "destructive"
      : badgeLabel === "1 Versuch übrig"
        ? "secondary"
        : "outline";

  const ctaHref = exhausted ? "/pricing" : info.hasActiveSession ? "/exam-check" : "/exam-check?autostart=1";
  const ctaLabel = exhausted
    ? "Prüfungs-Simulator freischalten"
    : info.hasActiveSession
      ? "Prüfungs-Check fortsetzen"
      : "Prüfungs-Check starten";

  return (
    <Card
      className={
        className
          ? `lp-accent-top border bg-transparent backdrop-blur lp-card-grad ${className}`
          : "lp-accent-top border bg-transparent backdrop-blur lp-card-grad"
      }
    >
      <CardHeader className="space-y-2 max-md:space-y-1 max-md:pb-1 max-md:px-3">
        <CardTitle className="text-base flex items-center justify-between gap-3">
          <span className="max-md:text-sm">Kostenloser Prüfungs-Check</span>
          <Badge variant={badgeVariant} className="rounded-full">
            {badgeLabel}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 max-md:space-y-2 max-md:px-3 max-md:pt-0 max-md:-mt-4">
        <div className="text-sm text-muted-foreground">
          Kurztest mit echten Prüfungsaufgaben - zeigt dir eine erste Einschätzung deines aktuellen Stands.
        </div>
        <div className="text-xs font-medium text-muted-foreground">Basierend auf echten IHK-Aufgabentypen</div>
        <div className="text-xs text-muted-foreground">Keine vollständige Prüfungssimulation.</div>

        {typeof info.lastScore === "number" ? (
          <div className="text-xs text-muted-foreground">
            Letztes Ergebnis: <span className="font-medium text-foreground">{info.lastScore}%</span>
          </div>
        ) : null}

        {info.hasActiveSession ? (
          <div className="text-xs text-muted-foreground">
            Offener Versuch erkannt. Du kannst an derselben Stelle fortsetzen.
          </div>
        ) : null}

        <div className="pt-1">
          <Button asChild variant={exhausted ? "outline" : "default"} className="rounded-full">
            <Link
              href={ctaHref}
              onClick={() => {
                if (exhausted) {
                  markExamCheckUpgradeIntent("dashboard_card");
                }
              }}
            >
              {ctaLabel}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
