"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type ErrorTag =
  | "planning"
  | "decision"
  | "justification"
  | "measurement"
  | "tolerance"
  | "calculation"
  | "unit"
  | "documentation"
  | string;

type ErrorTagsById = Record<string, ErrorTag[]>;

const TAG_LABELS: Record<string, string> = {
  planning: "Planung / Ablauf",
  decision: "Fachentscheidung",
  justification: "Begründung",
  measurement: "Messen / Prüfen",
  tolerance: "Toleranzen",
  calculation: "Rechnen",
  unit: "Einheiten",
  documentation: "Dokumentation",
};

const TAG_ACTIONS: Record<string, string[]> = {
  unit: [
    "Einheit immer mitführen (Zwischenschritte + Ergebnis).",
    "Umrechnungen (mm↔cm↔m, g↔kg) als Checkliste abarbeiten.",
  ],
  calculation: [
    "Rechenweg in 3 Zeilen: Formel → Einsetzen → Ergebnis.",
    "Plausibilitätscheck: Größenordnung prüfen.",
  ],
  tolerance: [
    "Grenzen explizit nennen (untere/obere Toleranzgrenze).",
    "i.O./n.i.O. immer mit Toleranzbezug begründen.",
  ],
  measurement: [
    "Prüfmittel passend zur Toleranz wählen.",
    "Zwischenmessung fest im Ablauf einplanen (nicht nur Endkontrolle).",
  ],
  justification: [
    "Immer: Entscheidung → Warum → Wie abgesichert.",
    "Begründung an Anforderung/Zeichnung koppeln (nicht \"weil man das so macht\").",
  ],
  documentation: [
    "Dokumentation: Soll/Ist + Toleranz + Entscheidung + Maßnahme.",
    "Prüfmittel + Prüfzeitpunkt mit aufnehmen.",
  ],
  decision: [
    "Entscheidung immer konkret (Werkzeug/Verfahren/Prüfmittel).",
    "Alternative kurz ausschließen (1 Satz).",
  ],
  planning: [
    "Ablauf: Zeichnung → Rüsten/Spannen → Bearbeiten → Messen → Entgraten → Endkontrolle.",
    "Kontrollpunkte als feste Meilensteine nennen.",
  ],
};

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeTag(tag: string): string {
  return String(tag ?? "").trim().toLowerCase();
}

function summarize(tagsById: ErrorTagsById) {
  const counts = new Map<string, number>();
  let totalMarks = 0;

  for (const [, tags] of Object.entries(tagsById)) {
    if (!Array.isArray(tags)) continue;
    for (const t of tags) {
      const tag = normalizeTag(t);
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      totalMarks += 1;
    }
  }

  const sorted = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return { totalMarks, sorted };
}

export function ExamRiskWidgetClient({
  moduleIds,
  title = "Prüfungsrisiken",
  className,
  disabled = false,
}: {
  moduleIds: string[];
  title?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<{
    totalMarks: number;
    sorted: { tag: string; count: number }[];
  } | null>(null);

  React.useEffect(() => {
    if (disabled) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const merged: ErrorTagsById = {};

    for (const moduleId of moduleIds) {
      const key = `lp:learn:errorTags:${moduleId}`;
      const parsed = safeParseJSON<ErrorTagsById>(localStorage.getItem(key));
      if (!parsed) continue;

      // merge; questionIds könnten kollidieren → prefix
      for (const [qid, tags] of Object.entries(parsed)) {
        merged[`${moduleId}::${qid}`] = Array.isArray(tags) ? tags : [];
      }
    }

    setData(summarize(merged));
    setLoading(false);
  }, [moduleIds, disabled]);

  const top = data?.sorted.slice(0, 5) ?? [];
  const max = top.length ? top[0].count : 0;

  return (
    <Card className={className ? `lp-accent-top border bg-transparent backdrop-blur lp-card-grad ${className}` : "lp-accent-top border bg-transparent backdrop-blur lp-card-grad"}>
      <CardHeader className="space-y-2 max-md:space-y-1 max-md:pb-1 max-md:px-3">
        <CardTitle className="text-base flex items-center justify-between gap-3 max-md:gap-2">
          <span className="max-md:text-sm max-md:whitespace-nowrap">{title}</span>
          {disabled ? (
            <Badge
              variant="outline"
              className="rounded-full max-md:ml-auto max-md:px-2.5 max-md:text-center max-md:border-primary/60 max-md:text-foreground max-md:bg-transparent max-md:whitespace-nowrap"
            >
              Nur in Pro aktiv
            </Badge>
          ) : !loading ? (
            <Badge
              variant={data?.totalMarks ? "secondary" : "outline"}
              className="rounded-full max-md:ml-auto max-md:px-2.5 max-md:text-center max-md:border-primary/60 max-md:text-foreground max-md:bg-transparent max-md:whitespace-nowrap"
            >
              {data?.totalMarks ? `${data.totalMarks} Marker` : "Noch keine Daten"}
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-md:space-y-2 max-md:px-3 max-md:pt-0 max-md:-mt-4">
        {disabled ? (
          <div className="text-sm text-muted-foreground">
            In Free sichtbar, aber nicht aktiv. Mit Pro werden Pruefungsrisiken live ausgewertet.
          </div>
        ) : loading ? (
          <div className="text-sm text-muted-foreground">Lade Risikoprofil…</div>
        ) : !data?.totalMarks ? (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Sobald du im Lernen Aufgaben bearbeitest, werden typische Punktkiller gesammelt (z. B. Einheiten,
              Begründung, Dokumentation).
            </div>
            <div className="text-sm text-muted-foreground">
              Tipp: Bearbeite 10–15 Aufgaben, dann ist das Profil aussagekräftig.
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {top.map(({ tag, count }) => {
                const label = TAG_LABELS[tag] ?? tag;
                const pct = max ? Math.round((count / max) * 100) : 0;

                return (
                  <div key={tag} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{count}×</div>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Was du als Nächstes üben solltest</div>

              {top.slice(0, 2).map(({ tag }) => {
                const label = TAG_LABELS[tag] ?? tag;
                const actions = TAG_ACTIONS[tag] ?? ["Mach 5–10 gezielte Aufgaben zu diesem Thema."];

                return (
                  <div key={tag} className="rounded-2xl border border-border/60 bg-transparent p-3 space-y-2 lp-card-grad-subtle">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full">
                        {label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Prüfer-Hebel</span>
                    </div>

                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {actions.slice(0, 2).map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
