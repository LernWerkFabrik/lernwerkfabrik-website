"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getOrCreateRun, touchRun } from "@/lib/runStorage";
import { getPlanClient } from "@/lib/entitlements";
import { consumeFreeRun, getFreeLimitInfo } from "@/lib/freeLimits";

import { appendPracticeRun } from "@/lib/runStorage";

import Markdown from "@/components/content/Markdown";
import { renderShapeInlineToken } from "@/components/content/mdShapes";
import { getScrollRoot, scrollToTarget } from "@/components/content/scroll";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import LearnHeader from "@/components/learn/LearnHeader";
import PracticePanel from "@/components/learn/PracticePanel";

import { useLearnController } from "@/lib/learn/useLearnController";
import { normalizeInputSpec } from "@/lib/learn/utils";

import type { ModuleMeta } from "@/lib/learn/types";
import type { AnyQuestion } from "@/lib/questionGenerator";

import {
  AutoExampleSidebar,
  useAutoExampleSidebar,
} from "@/components/content/ExampleSidebar";

/* ------------------------------------------------------------------------------------------------
 * Local types
 * -----------------------------------------------------------------------------------------------*/

type InputSpec = {
  mode?: "decimal" | "integer";
  maxDecimals?: number;
  allowNegative?: boolean;
};

type Question = AnyQuestion & {
  input?: InputSpec;
};

type LearnTab =
  | "theory"
  | "symbols"
  | "workflow"
  | "comparison"
  | "formulas"
  | "example"
  | "practice";

/* ------------------------------------------------------------------------------------------------
 * LocalStorage: minimal, dashboard-kompatible Lern-AktivitÃ¤t
 * -----------------------------------------------------------------------------------------------*/

type LearnActivityStatus = "in_progress" | "done" | "wrong" | "help";

type LearnProgressEvent = {
  ts: number;
  moduleId: string;
  questionIndex?: number;
  status: LearnActivityStatus;
};

function writeLearnProgress(ev: Omit<LearnProgressEvent, "ts"> & { ts?: number }) {
  const ts = typeof ev.ts === "number" && Number.isFinite(ev.ts) ? ev.ts : Date.now();
  const payload: LearnProgressEvent = {
    ts,
    moduleId: ev.moduleId,
    questionIndex: typeof ev.questionIndex === "number" ? ev.questionIndex : undefined,
    status: ev.status,
  };

  const key = `lp:learn:activity:${payload.moduleId}`;

  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore (MVP/localStorage)
  }
}

/* ------------------------------------------------------------------------------------------------
 * Helpers (Formeln: Struktur + Navigation)
 * -----------------------------------------------------------------------------------------------*/

type FormulaCard = {
  title: string;
  body: string;
  shapeToken?: string;
  sectionTitle?: string;
};

type FormulaNavItem = FormulaCard & {
  id: string;
  navLabel: string;
  sectionLabel?: string;
};

function slugifyLocal(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseNumberedTitle(title: string) {
  const m = title.match(/^\s*(\d+)\)\s*(.+)$/);
  if (!m) return { num: null as string | null, text: title.trim() };
  return { num: m[1], text: m[2].trim() };
}

function sanitizeFormulaHeading(title: string) {
  return title
    .replace(/\$\$([^$]+)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\\((.+?)\\\)/g, "$1")
    .replace(/\\\[([\s\S]+?)\\\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSectionTitle(title: string | undefined) {
  if (!title) return undefined;
  const cleaned = title.replace(/^\s*\d+\)\s*/, "").trim();
  return cleaned || undefined;
}

function shortSectionLabel(title: string | undefined) {
  const cleaned = cleanSectionTitle(title);
  if (!cleaned) return undefined;
  const short = cleaned.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return short || cleaned;
}

function splitByH2(md: string): {
  prelude: string;
  sections: Array<{ title: string; sectionTitle?: string; body: string }>;
} {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const h1re = /^#\s+(.+?)\s*$/;
  const h2re = /^##\s+(.+?)\s*$/;
  const numberedSectionRe = /^\d+\)\s+/;

  const preludeLines: string[] = [];
  const sections: Array<{ title: string; sectionTitle?: string; bodyLines: string[] }> = [];
  let cur: { title: string; sectionTitle?: string; bodyLines: string[] } | null = null;
  let currentSectionTitle: string | undefined = undefined;

  for (const line of lines) {
    const h1 = line.match(h1re);
    if (h1) {
      const h1Text = h1[1].trim();
      if (numberedSectionRe.test(h1Text)) {
        currentSectionTitle = h1Text;
        continue;
      }
      if (!cur) preludeLines.push(line);
      else cur.bodyLines.push(line);
      continue;
    }

    const h2 = line.match(h2re);
    if (h2) {
      if (cur) sections.push(cur);
      cur = { title: h2[1], sectionTitle: currentSectionTitle, bodyLines: [] };
      continue;
    }
    if (!cur) preludeLines.push(line);
    else cur.bodyLines.push(line);
  }
  if (cur) sections.push(cur);

  return {
    prelude: preludeLines.join("\n").trim(),
    sections: sections.map((s) => ({
      title: s.title.trim(),
      sectionTitle: s.sectionTitle?.trim(),
      body: s.bodyLines.join("\n").trim(),
    })),
  };
}

function toFormulaCards(md: string): { prelude: string; cards: FormulaCard[] } {
  const { prelude, sections } = splitByH2(md);

  const cards: FormulaCard[] = sections.map((s) => {
    const parsed = parseNumberedTitle(sanitizeFormulaHeading(s.title));
    const title = parsed.num ? `${parsed.num}) ${parsed.text}` : parsed.text;

    const lines = s.body.split("\n");
    let shapeToken: string | undefined = undefined;

    if (lines.length && lines[0].toLowerCase().startsWith("shape:")) {
      shapeToken = lines[0].slice("shape:".length).trim() || undefined;
      lines.shift();
    }

    return {
      title,
      body: lines.join("\n").trim(),
      shapeToken,
      sectionTitle: cleanSectionTitle(s.sectionTitle),
    };
  });

  return { prelude, cards };
}

function buildFormulaNav(cards: FormulaCard[]): FormulaNavItem[] {
  const titleCounts = new Map<string, number>();
  for (const c of cards) {
    const base = slugifyLocal(c.title);
    titleCounts.set(base, (titleCounts.get(base) ?? 0) + 1);
  }

  const seen = new Map<string, number>();
  return cards.map((c) => {
    const base = slugifyLocal(c.title);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = `f-${base}${n === 0 ? "" : `-${n}`}`;

    const hasDuplicates = (titleCounts.get(base) ?? 0) > 1;
    const sectionLabel = shortSectionLabel(c.sectionTitle);
    const navLabel = hasDuplicates
      ? sectionLabel
        ? `${c.title} (${sectionLabel})`
        : `${c.title} ${n + 1}`
      : c.title;

    return { ...c, id, navLabel, sectionLabel };
  });
}

function FormulaCardView({ md }: { md: string }) {
  const { prelude, cards } = useMemo(() => toFormulaCards(md), [md]);
  const nav = useMemo(() => buildFormulaNav(cards), [cards]);

  const onJump = (id: string) => {
    const el = document.getElementById(id) as HTMLElement | null;
    if (!el) return;

    const root =
      getScrollRoot?.() ??
      document.querySelector<HTMLElement>("[data-scroll-root]");
    const scroller = (root ?? window) as any;

    scrollToTarget(scroller, el, { behavior: "smooth" });
  };

  return (
    <div className="space-y-4" id="formeln-root">
      {prelude ? (
        <div className="rounded-2xl border border-border/60 bg-transparent p-4 md:p-5 lp-card-grad-subtle">
          <Markdown source={prelude} layout="bare" mode="formula" />
        </div>
      ) : null}

      {nav.length ? (
        <div className="flex flex-wrap gap-2">
          {nav.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant="outline"
              className="rounded-full h-8 px-3 text-xs"
              onClick={() => onJump(c.id)}
            >
              {c.navLabel}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        {nav.map((c) => {
          const hasShape = Boolean(c.shapeToken?.trim());
          return (
            <div
              key={c.id}
              id={c.id}
              className="rounded-2xl border border-border/60 bg-transparent p-4 md:p-5 lp-card-grad-subtle"
            >
              {c.sectionLabel ? (
                <div className="mb-1 text-[11px] font-medium text-muted-foreground/90">
                  {c.sectionLabel}
                </div>
              ) : null}
              <div className="mb-2 text-sm font-semibold text-foreground/90">
                {c.title}
              </div>

              <div
                className={[
                  "grid gap-4",
                  hasShape
                    ? "md:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] md:items-start"
                    : "",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <Markdown source={c.body || ""} layout="bare" mode="formula" />
                </div>

                {hasShape ? (
                  <div className="w-full overflow-x-auto md:pt-1">
                    {renderShapeInlineToken(c.shapeToken!, 470)}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function persistPracticeRun(
  moduleId: string,
  runStartedAt: number,
  seed: number,
  qs: { id: string }[],
  checkedById: Record<string, any>,
  statusById: Record<string, any>,
  firstCorrectQualityById: Record<string, any>
) {
  const total = qs.length;

  let correct = 0;
  let assisted = 0;
  let wrong = 0;

  for (const q of qs) {
    const id = q.id;
    const st = statusById[id];
    const checked = Boolean(checkedById[id]);

    if (st === "correct") {
      correct += 1;
      if (firstCorrectQualityById[id] === "assisted") {
        assisted += 1;
      }
    } else if (checked) {
      wrong += 1;
    }
  }

  appendPracticeRun(moduleId, {
    startedAt: runStartedAt,
    finishedAt: Date.now(),
    seed,
    total,
    correct,
    assisted,
    wrong,
  });
}


/* ------------------------------------------------------------------------------------------------
 * Beispiel: â€žStart + Mehrâ€œ-Darstellung
 * -----------------------------------------------------------------------------------------------*/

function splitExamplesByH2(md: string): {
  prelude: string;
  examples: Array<{ title: string; body: string }>;
} {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const h2re = /^##\s+(.+?)\s*$/;

  const preludeLines: string[] = [];
  const sections: Array<{ title: string; bodyLines: string[] }> = [];
  let cur: { title: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(h2re);
    if (m) {
      if (cur) sections.push(cur);
      cur = { title: m[1].trim(), bodyLines: [] };
      continue;
    }
    if (!cur) preludeLines.push(line);
    else cur.bodyLines.push(line);
  }
  if (cur) sections.push(cur);

  return {
    prelude: preludeLines.join("\n").trim(),
    examples: sections.map((s) => ({
      title: s.title,
      body: s.bodyLines.join("\n").trim(),
    })),
  };
}

function ExampleCardView({ md, visibleCount = 4 }: { md: string; visibleCount?: number }) {
  const { prelude, examples } = useMemo(() => splitExamplesByH2(md), [md]);

  const examplesWithIds = useMemo(() => {
    const seen = new Map<string, number>();
    return examples.map((ex) => {
      const base = slugifyLocal(ex.title || "beispiel");
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      const id = `ex-${base}${n === 0 ? "" : `-${n}`}`;
      return { ...ex, id };
    });
  }, [examples]);

  const first = examplesWithIds.slice(0, visibleCount);
  const rest = examplesWithIds.slice(visibleCount);

  const [openItems, setOpenItems] = useState<string[]>([]);
  const restIds = useMemo(() => rest.map((r) => r.id), [rest]);

  const allOpen = openItems.length > 0 && openItems.length === rest.length;

  function parseExampleBadge(title: string) {
    const t = (title || "").trim();
    const m = t.match(/^(\d+)\)\s*(.+)$/);
    if (!m) return { badge: "Beispiel", label: t || "Beispiel" };
    return { badge: `Beispiel ${m[1]}`, label: m[2].trim() };
  }

  return (
    <div className="space-y-4">
      {prelude ? (
        <div className="rounded-2xl border border-border/60 bg-transparent p-4 md:p-5 lp-card-grad-subtle">
          <Markdown source={prelude} layout="bare" />
        </div>
      ) : null}

      {first.map((ex) => {
        const p = parseExampleBadge(ex.title);
        return (
          <section
            key={ex.id}
            className="rounded-2xl border border-border/60 bg-transparent p-4 md:p-5 lp-card-grad-subtle"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 items-center rounded-full border border-border/60 bg-transparent px-2.5 text-xs font-semibold text-foreground/85 lp-card-grad-subtle">
                {p.badge}
              </span>

              <h2 id={ex.id} className="min-w-0 break-words text-lg font-semibold tracking-tight text-foreground">
                {p.label}
              </h2>
            </div>

            <Markdown source={ex.body} layout="bare" />
          </section>
        );
      })}

      {rest.length ? (
        <div className="rounded-2xl border border-border/60 bg-transparent p-3 md:p-4 lp-card-grad-subtle">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-foreground/85">Weitere Beispiele</div>

            <Button
              type="button"
              variant="outline"
              className="rounded-full h-8 px-3 text-xs"
              onClick={() => setOpenItems(allOpen ? [] : restIds)}
            >
              {allOpen ? "Alle schließen" : "Alle öffnen"}
            </Button>
          </div>

          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={(v) => setOpenItems(v)}
            className="w-full"
          >
            {rest.map((ex) => {
              const p = parseExampleBadge(ex.title);

              return (
                <AccordionItem
                  key={ex.id}
                  value={ex.id}
                  className="border-border/70 last:border-b-0"
                >
                  <AccordionTrigger
                    className={[
                      "no-underline hover:no-underline",
                      "rounded-xl px-3 py-2 text-left items-start gap-2",
                      "data-[state=open]:bg-transparent data-[state=open]:lp-card-grad-subtle",
                      "hover:bg-transparent hover:lp-card-grad-subtle",
                      "transition-colors",
                      "text-sm",
                      "[&>svg]:mt-0.5",
                    ].join(" ")}
                  >
                    <div className="flex flex-1 min-w-0 items-start gap-2 pr-2">
                      <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-border/60 bg-transparent px-2 text-xs font-semibold text-foreground/85 lp-card-grad-subtle">
                        {p.badge}
                      </span>
                      <span className="min-w-0 flex-1 break-words whitespace-normal leading-snug text-foreground/90 sm:truncate sm:whitespace-nowrap">
                        {p.label}
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-3 pb-3">
                    <h2 id={ex.id} className="sr-only">
                      {ex.title}
                    </h2>

                    <div className="rounded-2xl border border-border/60 bg-transparent p-4 md:p-5 lp-card-grad-subtle">
                      <Markdown source={ex.body} layout="bare" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Small helper: shallow array equality
 * -----------------------------------------------------------------------------------------------*/

function shallowEq(a: string[] | null | undefined, b: string[] | null | undefined) {
  if (a === b) return true;
  if (!a?.length && !b?.length) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const ERROR_TRAINING_KEY_PREFIX = "lwf:errorTraining:";

function getErrorTrainingKey(moduleId: string) {
  return `${ERROR_TRAINING_KEY_PREFIX}${moduleId}`;
}

function normalizeIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const id = String(raw ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function readStoredErrorTraining(moduleId: string): { ids: string[]; round: number } {
  if (typeof window === "undefined") return { ids: [], round: 0 };
  try {
    const raw = localStorage.getItem(getErrorTrainingKey(moduleId));
    if (!raw) return { ids: [], round: 0 };
    const parsed = JSON.parse(raw) as { ids?: unknown; round?: unknown } | null;
    const ids = normalizeIds(parsed?.ids);
    if (!ids.length) return { ids: [], round: 0 };
    const n = Number(parsed?.round);
    const round = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
    return { ids, round };
  } catch {
    return { ids: [], round: 0 };
  }
}

/* ------------------------------------------------------------------------------------------------
 * LearnClient
 * -----------------------------------------------------------------------------------------------*/
export default function LearnClient({
  moduleId,
  meta,
  theory,
  symbols,
  workflow,
  comparison,
  formulas,
  example,
  questions,
  filterIds,
  initialTab = "theory",
}: {
  moduleId: string;
  meta?: ModuleMeta | null;
  theory: string;
  symbols?: string;
  workflow?: string;
  comparison?: string;
  formulas?: string;
  example: string;
  questions: Question[];
  filterIds?: string[];
  initialTab?: string;
}) {
  // âœ… mounted ist OK â€“ aber wir dÃ¼rfen NICHT frÃ¼h returnen, sonst Hook-Order Bug
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  // Plan + Free-Limit
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [freeTick, setFreeTick] = useState(0);
  const [showFreeLimit, setShowFreeLimit] = useState(false);

  useEffect(() => {
    setPlan(getPlanClient());
  }, []);

  useEffect(() => {
    getOrCreateRun(moduleId);
    touchRun(moduleId);
  }, [moduleId]);

  const runRef = useRef<{
    seed: number;
    startedAt: number;
  } | null>(null);

  useEffect(() => {
    const run = getOrCreateRun(moduleId);
    runRef.current = {
      seed: run.seed,
      startedAt: run.createdAt,
    };
  }, [moduleId]);


  const allowedQuestionIds = useMemo(() => new Set(questions.slice(0, 25).map((q) => q.id)), [questions]);

  const initialErrorState = useMemo(() => {
    const fromProp = normalizeIds(filterIds).filter((id) => allowedQuestionIds.has(id));
    if (fromProp.length) return { ids: fromProp, round: 1 };

    const stored = readStoredErrorTraining(moduleId);
    const ids = stored.ids.filter((id) => allowedQuestionIds.has(id));
    return { ids, round: ids.length ? Math.max(1, stored.round) : 0 };
  }, [moduleId, filterIds, allowedQuestionIds]);

  const [activeFilterIds, setActiveFilterIds] = useState<string[]>(() => initialErrorState.ids);
  const [errorRound, setErrorRound] = useState<number>(() => initialErrorState.round);

  useEffect(() => {
    setActiveFilterIds((prev) => (shallowEq(prev, initialErrorState.ids) ? prev : initialErrorState.ids));
    setErrorRound((prev) => (prev === initialErrorState.round ? prev : initialErrorState.round));
  }, [initialErrorState.ids, initialErrorState.round]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = getErrorTrainingKey(moduleId);
    const ids = normalizeIds(activeFilterIds).filter((id) => allowedQuestionIds.has(id));

    try {
      if (!ids.length) {
        localStorage.removeItem(key);
        return;
      }

      const round = Number.isFinite(errorRound) && errorRound > 0 ? Math.floor(errorRound) : 1;
      localStorage.setItem(
        key,
        JSON.stringify({
          ids,
          round,
          createdAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  }, [moduleId, activeFilterIds, errorRound, allowedQuestionIds]);

  const canUseErrorTraining = plan === "pro";
  const effectiveFilterIds = canUseErrorTraining ? activeFilterIds : [];
  const isErrorMode = canUseErrorTraining && effectiveFilterIds.length > 0;

  const c = useLearnController({
    moduleId,
    questions,
    filterIds: effectiveFilterIds,
  });

  // âœ… robust: Schreibe Lern-Event NACHDEM der Controller checked/Status gesetzt hat
  type PendingCheck = { id: string; moduleId: string; ts: number };
  const pendingCheckRef = useRef<PendingCheck | null>(null);
  const runSavedRef = useRef(false);

  useEffect(() => {
    const pending = pendingCheckRef.current;
    if (!pending) return;

    const { id, moduleId: mid } = pending;

    if (!c.checkedById?.[id]) return;

    const questionIndex = c.qs.findIndex((q) => q.id === id);
    if (questionIndex < 0) {
      pendingCheckRef.current = null;
      return;
    }

    const st = c.statusById?.[id];
    const quality = c.firstCorrectQualityById?.[id];

    const status: LearnActivityStatus =
      st === "correct" ? (quality === "assisted" ? "help" : "done") : "wrong";

    writeLearnProgress({ moduleId: mid, questionIndex, status });

    pendingCheckRef.current = null;
  }, [c.checkedById, c.statusById, c.firstCorrectQualityById, c.qs]);


  

  const hasSymbols = Boolean(symbols?.trim().length);
  const isApModule = moduleId.startsWith("ap1-") || moduleId.startsWith("ap2-");
  const theoryTabLabel = isApModule ? "Vorgehen" : "Erklärung";
  const exampleTabLabel = isApModule ? "Musteraufgaben" : "Beispiel";
  const practiceTabLabel = isApModule ? "Training" : "Übung";
  const symbolsTabLabel = moduleId === "systeme-steuern" ? "Regelkreis" : "Symbole";
  const hasWorkflow = Boolean(workflow?.trim().length);
  const workflowTabLabel =
    moduleId === "werkzeuge-maschinen"
      ? "Einsatz"
      : moduleId === "arbeitsablaeufe-planen"
      ? "Struktur"
      : moduleId === "qualitaetsmaengel"
      ? "Maßnahmen"
      : moduleId === "elektrische-baugruppen"
      ? "Prüfschritte"
      : moduleId === "fehler-steuerungen"
      ? "Signalfluss"
      : moduleId === "mechanische-schaeden"
      ? "Ursachen"
      : moduleId === "wartung-planen"
      ? "Planung"
      : moduleId === "stoerungen-eingrenzen"
      ? "Vorgehen"
      : moduleId === "instandhaltung-dokumentieren"
      ? "Pflichtangaben"
      : "Arbeitsfolge";
  const hasComparison = Boolean(comparison?.trim().length);
  const comparisonTabLabel = (() => {
    if (moduleId === "pruefmittel-einsetzen") return "Genauigkeit";
    if (moduleId === "baugruppen-montieren") return "Ablauf";
    if (moduleId === "fertigungsverfahren") return "Auswahl";
    if (moduleId === "masse-toleranzen-pruefen") return "Bewertung";
    return "Vergleich";
  })();
  const hasFormulas = Boolean(formulas?.trim().length);
  const formulasTabLabel = (() => {
    if (moduleId === "toleranzen-fertigung") return "Grenzmaße";
    if (moduleId === "stoffwerte-bauteilauswahl") return "Stoffwerte";
    if (moduleId === "sicherheit-umwelt") return "Vorschriften";
    return "Formeln";
  })();
  const tabLabels = [
    theoryTabLabel,
    ...(hasSymbols ? [symbolsTabLabel] : []),
    ...(hasWorkflow ? [workflowTabLabel] : []),
    ...(hasComparison ? [comparisonTabLabel] : []),
    ...(hasFormulas ? [formulasTabLabel] : []),
    exampleTabLabel,
    practiceTabLabel,
  ];
  const headerTabsLine = `${tabLabels.slice(0, -1).join(", ")} und ${tabLabels[tabLabels.length - 1]}.`;
  const tabStorageKey = useMemo(() => `lp:learn:lastTab:${moduleId}`, [moduleId]);
  const fallbackTab: LearnTab =
    initialTab === "practice"
      ? "practice"
      : initialTab === "symbols" && hasSymbols
      ? "symbols"
      : initialTab === "workflow" && hasWorkflow
      ? "workflow"
      : initialTab === "comparison" && hasComparison
      ? "comparison"
      : initialTab === "formulas" && hasFormulas
      ? "formulas"
      : initialTab === "example"
      ? "example"
      : "theory";

  // Hydration-safe: Server und erster Client-Render starten identisch.
  // Den zuletzt genutzten Tab laden wir erst nach dem Mount aus localStorage.
  const [tab, setTab] = useState<LearnTab>(fallbackTab);

  const title = meta?.title ?? moduleId;
  const desc = meta?.description ?? "";

  const baseIds = useMemo(() => questions.slice(0, 25).map((q) => q.id), [questions]);
  const dashboardQuestionIdsKey = useMemo(() => `lp:learn:qids:${moduleId}`, [moduleId]);

  // Dashboard soll denselben Stand wie "Bearbeitet X von 25" sehen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!baseIds.length) {
        localStorage.removeItem(dashboardQuestionIdsKey);
        return;
      }
      localStorage.setItem(dashboardQuestionIdsKey, JSON.stringify(baseIds));
    } catch {
      // ignore
    }
  }, [dashboardQuestionIdsKey, baseIds]);

  const allChecked = useMemo(() => {
    const checked = c.checkedById ?? {};
    return baseIds.length > 0 && baseIds.every((id) => Boolean(checked[id]));
  }, [baseIds, c.checkedById]);

  const wrongIds = useMemo(() => {
    const out: string[] = [];
    const checked = c.checkedById ?? {};
    const status = c.statusById ?? {};
    for (const id of baseIds) {
      if (!checked[id]) continue;
      if (status[id] === "correct") continue;
      out.push(id);
    }
    return out;
  }, [baseIds, c.checkedById, c.statusById]);

  const errorWrongIds = useMemo(() => {
    if (!isErrorMode) return [] as string[];
    return effectiveFilterIds.filter((id) => Boolean(c.checkedById[id]) && c.statusById[id] !== "correct");
  }, [isErrorMode, effectiveFilterIds, c.checkedById, c.statusById]);

  const wrongTotalForPanel = isErrorMode ? errorWrongIds.length : wrongIds.length;

  const stats = useMemo(() => {
    const total = c.qs.length;
    let correctCount = 0;
    let cleanCorrectCount = 0;
    let assistedCorrectCount = 0;
    let inProgressCount = 0;

    for (const q of c.qs) {
      const id = q.id;
      const st = c.statusById[id];
      const checked = Boolean(c.checkedById[id]);

      if (st === "correct") {
        correctCount += 1;
        const quality = c.firstCorrectQualityById[id];
        if (quality === "assisted") assistedCorrectCount += 1;
        else cleanCorrectCount += 1;
      } else if (st === "attempted" && !checked) {
        inProgressCount += 1;
      }
    }

    const progressPercent =
      total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return {
      total,
      correctCount,
      cleanCorrectCount,
      assistedCorrectCount,
      inProgressCount,
      progressPercent,
    };
  }, [c.qs, c.statusById, c.checkedById, c.firstCorrectQualityById]);


    useEffect(() => {
    if (!mounted) return;
    if (!allChecked) return;
    if (runSavedRef.current) return;

    const run = runRef.current;
    if (!run) return;

    persistPracticeRun(
      moduleId,
      run.startedAt,
      run.seed,
      c.qs,
      c.checkedById,
      c.statusById,
      c.firstCorrectQualityById
    );

    runSavedRef.current = true;
  }, [
    mounted,
    allChecked,
    moduleId,
    c.qs,
    c.checkedById,
    c.statusById,
    c.firstCorrectQualityById,
  ]);



  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(tabStorageKey) as LearnTab | null;
      const isValid =
        raw === "theory" ||
        raw === "symbols" ||
        raw === "workflow" ||
        raw === "comparison" ||
        raw === "formulas" ||
        raw === "example" ||
        raw === "practice";
      const restored =
        isValid &&
        !(raw === "symbols" && !hasSymbols) &&
        !(raw === "workflow" && !hasWorkflow) &&
        !(raw === "comparison" && !hasComparison) &&
        !(raw === "formulas" && !hasFormulas)
          ? raw
          : null;
      const next = restored ?? fallbackTab;
      setTab((prev) => (prev === next ? prev : next));
    } catch {
      setTab((prev) => (prev === fallbackTab ? prev : fallbackTab));
    }
  }, [mounted, tabStorageKey, hasSymbols, hasWorkflow, hasComparison, hasFormulas, fallbackTab]);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(tabStorageKey, tab);
    } catch {
      // ignore
    }
  }, [mounted, tabStorageKey, tab]);

  useEffect(() => {
    if (tab === "symbols" && !hasSymbols) {
      setTab("theory");
      return;
    }
    if (tab === "workflow" && !hasWorkflow) {
      setTab("theory");
      return;
    }
    if (tab === "comparison" && !hasComparison) {
      setTab("theory");
      return;
    }
    if (tab !== "formulas") return;
    if (hasFormulas) return;
    setTab("theory");
  }, [tab, hasSymbols, hasWorkflow, hasComparison, hasFormulas]);

  const [exampleRootEl, setExampleRootEl] = useState<HTMLDivElement | null>(null);
  const auto = useAutoExampleSidebar(exampleRootEl, tab === "example");

  // âœ… FREE LIMIT HOOKS: MUSS vor jeder mÃ¶glichen return-Stelle sein (deshalb hier)
  const freeInfo = useMemo(() => {
    if (plan !== "free") return null;
    return getFreeLimitInfo(moduleId);
  }, [plan, moduleId, freeTick]);

  const freeLocked =
    plan === "free" && Boolean(freeInfo?.allowed) && (freeInfo?.remaining ?? 0) <= 0;

  const tryConsume = () => {
    if (plan !== "free") return true;

    const info = getFreeLimitInfo(moduleId);
    if (!info.allowed) return false;
    if (info.remaining <= 0) return false;

    const res = consumeFreeRun(moduleId);
    if (!res.ok) return false;

    setFreeTick((n) => n + 1);
    return true;
  };

  const enterErrorMode = () => {
    if (!canUseErrorTraining) return;
    if (!isErrorMode) {
      if (!wrongIds.length) return;
      c.goTo(0);
      c.clearDraftsForIds(wrongIds);
      setActiveFilterIds(wrongIds);
      setErrorRound(1);
      setTab("practice");
      return;
    }

    const nextIds = effectiveFilterIds.filter((id) => c.statusById[id] !== "correct");
    if (!nextIds.length) return;

    c.goTo(0);
    c.clearDraftsForIds(nextIds);
    setActiveFilterIds(nextIds);
    setErrorRound((prev) => Math.max(1, prev) + 1);
    setTab("practice");
  };

  const exitErrorMode = () => {
    setActiveFilterIds([]);
    setErrorRound(0);
    setTab("practice");
  };

  const handleRepeatRun = () => {

    // Run speichern (falls nicht bereits durch "alle geprÃ¼ft" gespeichert)
    const run = runRef.current;
    if (run && !runSavedRef.current) {
      persistPracticeRun(
        moduleId,
        run.startedAt,
        run.seed,
        c.qs,
        c.checkedById,
        c.statusById,
        c.firstCorrectQualityById
      );
      runSavedRef.current = true;
    }

    // Neuer Durchlauf startet -> Guard zurÃ¼cksetzen + neue Run-Metadaten
    c.repeatRun();
    runSavedRef.current = false;

    const currentRun = getOrCreateRun(moduleId);
    runRef.current = { seed: currentRun.seed, startedAt: Date.now() };

    touchRun(moduleId);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* âœ… Skeleton ohne early-return (Hook-Order bleibt stabil) */}
      {!mounted ? (
        <div className="p-6">
          <div className="h-24 rounded-2xl border border-border/60 bg-transparent lp-card-grad-subtle" />
          <div className="mt-6 h-12 w-64 rounded-xl border border-border/60 bg-transparent lp-card-grad-subtle" />
          <div className="mt-4 h-[60vh] rounded-2xl border border-border/60 bg-transparent lp-card-grad-subtle" />
        </div>
      ) : null}

        <LearnHeader
          moduleId={moduleId}
          title={title}
          desc={desc}
          isFiltered={c.isFiltered}
          tabsLine={headerTabsLine}
          plan={plan}
          freeRuns={freeInfo}
          checkedCount={c.checkedCount}
          total={stats.total}
          progressPercent={stats.progressPercent}
          cleanCorrectCount={stats.cleanCorrectCount}
          assistedCorrectCount={stats.assistedCorrectCount}
          redCheckedWrongCount={c.redCheckedWrongCount}
          inProgressCount={stats.inProgressCount}
          onCheckAll={c.checkAllYellow}
          onRepeat={handleRepeatRun}
          onNewTasks={() => {
            if (!tryConsume()) {
              setShowFreeLimit(true);
              return;
            }

            // Run speichern (falls nicht bereits durch "alle geprÃ¼ft" gespeichert)
            const run = runRef.current;
            if (run && !runSavedRef.current) {
              persistPracticeRun(
                moduleId,
                run.startedAt,
                run.seed,
                c.qs,
                c.checkedById,
                c.statusById,
                c.firstCorrectQualityById
              );
              runSavedRef.current = true;
            }

            // Neuer Aufgaben-Run startet -> Guard zurÃ¼cksetzen + neue Run-Metadaten
            c.newRun();
            runSavedRef.current = false;

            const next = getOrCreateRun(moduleId);
            runRef.current = { seed: next.seed, startedAt: next.createdAt };

            touchRun(moduleId);
          }}
          dimStatus={tab !== "practice"}
          onActivatePractice={() => setTab("practice")}
        />



      {showFreeLimit ? (
        <div className="rounded-2xl border border-border/60 bg-transparent p-4 md:p-5 lp-card-grad-subtle">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground/90">Free-Limit erreicht</div>
              <div className="text-sm text-muted-foreground">
                Du hast hier die maximalen{" "}
                <span className="font-semibold text-foreground/85">
                  {freeInfo?.max ?? 5}
                </span>{" "}
                Durchgänge genutzt. Für weitere Durchgänge brauchst du Pro.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setShowFreeLimit(false)}
              >
                Schließen
              </Button>
              <Button asChild className="rounded-full">
                <a href="/pricing">Pro freischalten</a>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as LearnTab;
          if (next === "symbols" && !hasSymbols) return;
          if (next === "workflow" && !hasWorkflow) return;
          if (next === "comparison" && !hasComparison) return;
          if (next === "formulas" && !hasFormulas) return;
          setTab(next);
        }}
        className="space-y-4"
      >
        <TabsList className="flex h-10 w-full flex-wrap items-center gap-2 p-1">
          <div className="flex flex-wrap items-center gap-2">
            <TabsTrigger value="theory">{theoryTabLabel}</TabsTrigger>
            {hasSymbols ? <TabsTrigger value="symbols">{symbolsTabLabel}</TabsTrigger> : null}
            {hasWorkflow ? <TabsTrigger value="workflow">{workflowTabLabel}</TabsTrigger> : null}
            {hasComparison ? <TabsTrigger value="comparison">{comparisonTabLabel}</TabsTrigger> : null}
            {hasFormulas ? <TabsTrigger value="formulas">{formulasTabLabel}</TabsTrigger> : null}
            <TabsTrigger value="example">{exampleTabLabel}</TabsTrigger>
          </div>

          <div className="ml-1 flex items-center gap-2 pl-2">
            <TabsTrigger
              value="practice"
              className="bg-primary/[0.08] text-foreground hover:bg-primary/[0.14] data-[state=active]:bg-primary/20 data-[state=active]:border-primary/35"
            >
              {practiceTabLabel}
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="theory">
          <Card className="rounded-2xl border-border/60 bg-transparent lp-card-panel-weak">
            <CardContent className="pt-2 max-md:text-sm max-md:leading-snug">
              <Markdown source={theory} withToc />
            </CardContent>
          </Card>
        </TabsContent>

        {hasSymbols ? (
          <TabsContent value="symbols">
            <Card className="rounded-2xl border-border/60 bg-transparent lp-card-panel-weak">
              <CardHeader>
                <CardTitle>{symbolsTabLabel}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 max-md:text-sm max-md:leading-snug">
                <Markdown source={symbols!} withToc />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {hasWorkflow ? (
          <TabsContent value="workflow">
            <Card className="rounded-2xl border-border/60 bg-transparent lp-card-panel-weak">
              <CardHeader>
                <CardTitle>{workflowTabLabel}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 max-md:text-sm max-md:leading-snug">
                <Markdown source={workflow!} withToc />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {hasComparison ? (
          <TabsContent value="comparison">
            <Card className="rounded-2xl border-border/60 bg-transparent lp-card-panel-weak">
              <CardHeader>
                <CardTitle>{comparisonTabLabel}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 max-md:text-sm max-md:leading-snug">
                <Markdown source={comparison!} withToc />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {hasFormulas ? (
          <TabsContent value="formulas">
            <Card className="rounded-2xl border-border/60 bg-transparent lp-card-panel-weak">
              <CardHeader>
                <CardTitle>{formulasTabLabel}</CardTitle>
              </CardHeader>
              <CardContent className="max-md:text-sm max-md:leading-snug">
                <FormulaCardView md={formulas!} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="example" className="overflow-visible">
          <Card className="rounded-2xl overflow-visible border-border/60 bg-transparent lp-card-panel-weak">
            <CardHeader>
              <CardTitle>{exampleTabLabel}</CardTitle>
            </CardHeader>

            <CardContent className="overflow-visible max-md:text-sm max-md:leading-snug">
              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start overflow-visible">
                <div ref={(el) => setExampleRootEl(el)} className="min-w-0">
                  <ExampleCardView md={example} visibleCount={4} />
                </div>

                <aside className="mt-6 hidden lg:block sticky top-6 self-start max-h-[calc(90dvh-1.5rem)] overflow-y-auto lp-scrollbar pr-1">
                  <AutoExampleSidebar s={auto} />
                </aside>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice" className="space-y-3">
          <PracticePanel
            qs={c.qs}
            index={c.index}
            current={c.current}
            activeId={c.activeId}
            goTo={c.goTo}
            value={c.value}
            unit={c.unit}
            onValueChange={(v) => {
              c.onValueChange(v);
              touchRun(moduleId);

              const id = c.activeId;
              if (!id) return;
              const questionIndex = c.qs.findIndex((q) => q.id === id);
              if (questionIndex >= 0) {
                writeLearnProgress({ moduleId, questionIndex, status: "in_progress" });
              }
            }}
            onUnitChange={(u) => {
              c.onUnitChange(u);
              touchRun(moduleId);

              const id = c.activeId;
              if (!id) return;
              const questionIndex = c.qs.findIndex((q) => q.id === id);
              if (questionIndex >= 0) {
                writeLearnProgress({ moduleId, questionIndex, status: "in_progress" });
              }
            }}
            textFields={c.textFields}
            onTextFieldsChange={c.onTextFieldsChange}
            statusById={c.statusById}
            checkedById={c.checkedById}
            dirtyById={c.dirtyById}
            firstCorrectQualityById={c.firstCorrectQualityById}
            feedback={c.feedback}
            onCheckAll={c.checkAllYellow}
            onCheckOne={() => {
              const id = c.activeId;
              if (!id) return;

              pendingCheckRef.current = { id, moduleId, ts: Date.now() };

              c.checkOne();
              touchRun(moduleId);
            }}
            showSolution={c.showSolution}
            solutionUnlocked={c.solutionUnlocked}
            onToggleSolution={c.toggleSolution}
            tipsSeenById={c.tipsSeenById}
            revealTips={c.revealTips}
            getInputSpec={(q) => normalizeInputSpec((q as any)?.input)}
            isErrorMode={isErrorMode}
            errorRound={errorRound}
            wrongTotal={wrongTotalForPanel}
            canUseErrorMode={canUseErrorTraining}
            onEnterErrorMode={enterErrorMode}
            onExitErrorMode={exitErrorMode}
            onRepeatRun={handleRepeatRun}
            canUseExplain={plan === "pro"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}



