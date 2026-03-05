// app/dashboard/DashboardAreasClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import SectionHeader from "@/components/SectionHeader";
import Surface from "@/components/Surface";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ArrowRight, ChevronRight, Lock, Sparkles } from "lucide-react";

import { getPlanClient, type Plan } from "@/lib/entitlements";
import { getProfileClient, type ProfessionId } from "@/lib/profile";
import { FREE_ALLOWED_LEARN_IDS } from "@/lib/freeLimits";

import {
  getAreasForProfession,
  getAllowedModuleIdsForProfession,
  getAreaIdForModule,
  type AreaId,
  type AreaDef,
} from "@/lib/curriculum";

/**
 * ✅ Free: "Empfohlen für dich" zeigt exakt diese 3 Basismodule als Mini-Modul-Karten.
 * (IDs müssen mit euren Module-IDs matchen.)
 */
const DEFAULT_RECOMMENDED_MODULE_ID = "kraefte-drehmomente";

type ModuleRaw = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  estimatedMinutes?: number;
};

type ModuleItem = {
  id: string;
  areaId: AreaId | null;
};

type LearnProgressStatus = "correct" | "wrong" | "assisted" | "inProgress" | string;

type LearnProgressMap = Record<string, LearnProgressStatus | unknown> & {
  ts?: number;
  updatedAt?: number;
  kind?: string;
};

type MiniMeta = {
  status: "Neu" | "In Arbeit" | "Abgeschlossen";
  progressPercent: number;
  lastActivityTs?: number;
};

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

function isInteractiveElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "a,button,input,select,textarea,[role='button'],[data-no-card-nav='true']"
    )
  );
}

/**
 * Findet das zuletzt berührte Modul über bereits existierende lp:* / lp.* keys.
 * (Nur zur PRO-Empfehlung; ist bewusst tolerant.)
 */
function getLastModuleIdFromLocalStorage(): string | null {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("lp.") || k.startsWith("lp:")) keys.push(k);
    }

    let best: { ts: number; moduleId: string } | null = null;

    for (const k of keys) {
      const raw = localStorage.getItem(k) ?? "";
      const obj = safeJsonParse<any>(raw);

      const ts =
        Number(obj?.ts ?? obj?.updatedAt ?? obj?.date ?? obj?.lastUpdated ?? 0) || 0;

      const fromObj =
        (typeof obj?.moduleId === "string" && obj.moduleId) ||
        (typeof obj?.module === "string" && obj.module) ||
        (typeof obj?.lessonId === "string" && obj.lessonId) ||
        "";

      let fromKey = "";

      // ✅ Doppelpunkt-Keys
      if (!fromKey && k.startsWith("lp:run:")) fromKey = k.slice("lp:run:".length);
      if (!fromKey && k.startsWith("lp:learn:progress:"))
        fromKey = k.slice("lp:learn:progress:".length);
      if (!fromKey && k.startsWith("lp:learn:activity:"))
        fromKey = k.slice("lp:learn:activity:".length);
      if (!fromKey && k.startsWith("lp:exam:history:"))
        fromKey = k.slice("lp:exam:history:".length);

      // ✅ Punkt-Keys (legacy)
      if (!fromKey && k.includes(".")) {
        const parts = k.split(".");
        const idxLearn = parts.indexOf("learn");
        if (!fromKey && idxLearn >= 0 && parts[idxLearn + 1])
          fromKey = parts[idxLearn + 1] ?? "";
        const idxProgress = parts.indexOf("progress");
        if (!fromKey && idxProgress >= 0 && parts[idxProgress + 1])
          fromKey = parts[idxProgress + 1] ?? "";
      }

      const moduleId = (fromObj || fromKey || "").trim();
      if (!moduleId) continue;

      if (!best || ts > best.ts) best = { ts, moduleId };
    }

    return best?.moduleId ?? null;
  } catch {
    return null;
  }
}

function getLearnAnswerKeys(obj: Record<string, any>) {
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

/**
 * Liest den Übungs-Fortschritt aus lp:learn:progress:<moduleId>
 * - percent basiert auf "correct" Einträgen (wie bei eurem Übungsfortschritt)
 * - lastTs aus updatedAt/ts
 */
function readLearnProgressInfo(moduleId: string): {
  hasTouched: boolean;
  percent: number;
  lastTs?: number;
} {
  const key = `lp:learn:progress:${moduleId}`;
  const obj = safeJsonParse<LearnProgressMap>(localStorage.getItem(key));

  if (!obj || typeof obj !== "object") {
    // Fallback: Run-Storage (nur Zeit)
    const runRaw =
      localStorage.getItem(`lp:run:${moduleId}`) ??
      localStorage.getItem(`lp.run.${moduleId}`);
    const runObj = safeJsonParse<any>(runRaw);
    const runTs =
      Number(runObj?.updatedAt ?? runObj?.ts ?? runObj?.createdAt ?? 0) || 0;
    return { hasTouched: runTs > 0, percent: 0, lastTs: runTs || undefined };
  }

  const qidsRaw =
    safeJsonParse<unknown>(localStorage.getItem(`lp:learn:qids:${moduleId}`)) ??
    safeJsonParse<unknown>(localStorage.getItem(`lp.learn.qids.${moduleId}`));
  const questionIds = normalizeStoredQuestionIds(qidsRaw);
  const onlyQuestionIds = questionIds.length ? new Set(questionIds) : null;

  const qKeys = getScopedLearnAnswerKeys(obj as Record<string, any>, onlyQuestionIds);

  // Wir nehmen mindestens 25 als Basis (euer Übungsmodus hat 25 Aufgaben).
  const total = onlyQuestionIds?.size ? onlyQuestionIds.size : Math.max(25, qKeys.length || 0);

  const correct = qKeys.reduce((acc, k) => {
    const v = (obj as any)[k] as LearnProgressStatus | undefined;
    return acc + (v === "correct" ? 1 : 0);
  }, 0);

  const percent = total > 0 ? clamp(Math.round((correct / total) * 100)) : 0;

  let lastTs =
    typeof obj.updatedAt === "number"
      ? obj.updatedAt
      : typeof obj.ts === "number"
      ? obj.ts
      : undefined;

  // Fallback: Run-Storage (falls learn-progress keine Zeit hat)
  if (typeof lastTs !== "number") {
    const runRaw =
      localStorage.getItem(`lp:run:${moduleId}`) ??
      localStorage.getItem(`lp.run.${moduleId}`);
    const runObj = safeJsonParse<any>(runRaw);
    const runTs =
      Number(runObj?.updatedAt ?? runObj?.ts ?? runObj?.createdAt ?? 0) || 0;
    if (runTs > 0) lastTs = runTs;
  }

  const hasTouched = qKeys.length > 0 || typeof lastTs === "number";
  return { hasTouched, percent, lastTs };
}

function computeMiniMeta(moduleId: string): MiniMeta {
  const info = readLearnProgressInfo(moduleId);

  let status: MiniMeta["status"] = "Neu";
  if (info.percent >= 100) status = "Abgeschlossen";
  else if (info.hasTouched) status = "In Arbeit";

  return {
    status,
    progressPercent: info.percent,
    lastActivityTs: info.lastTs,
  };
}

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

function AreaCard({
  href,
  title,
  description,
  count,
  locked,
  showProBadge,
  recommended,
}: {
  href: string;
  title: string;
  description: string;
  count: number;
  locked: boolean;
  showProBadge: boolean;
  recommended?: boolean;
}) {
  return (
    <Link
      href={locked ? "#" : href}
      onClick={(e) => {
        if (locked) e.preventDefault();
      }}
      className={[
        "group relative block rounded-2xl border bg-transparent shadow-sm backdrop-blur lp-card-grad-subtle lp-accent-top",
        "transition-all duration-200 ease-out",
        locked
          ? "opacity-90 cursor-not-allowed"
          : "hover:-translate-y-[1px] hover:shadow-[0_22px_52px_-36px_rgba(20,24,32,0.30)]",
        !locked ? "hover:ring-1 hover:ring-primary/12 dark:hover:ring-primary/10" : "",
      ].join(" ")}
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="lp-title">{title}</div>

              {recommended ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-transparent px-2 py-0.5 text-[11px] text-foreground/80 lp-card-grad-subtle">
                  <Sparkles className="h-3 w-3" />
                  Empfohlen
                </span>
              ) : null}

              {showProBadge ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-transparent px-2 py-0.5 text-[11px] text-foreground/80 lp-card-grad-subtle">
                  <Lock className="h-3 w-3" />
                  Pro
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          </div>

          <div className="shrink-0 rounded-full border border-border/60 bg-transparent px-2.5 py-1 text-xs text-foreground/85 lp-card-grad-subtle shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_10px_22px_-18px_rgba(20,24,32,0.35)]">
            {count}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * ✅ Mini-Modul-Karte im selben Aufbau wie eure großen Modul-Karten:
 * - Surface als Grundlage (Farben/Glas/Border)
 * - CardHeader/CardContent
 * - Fortschritt + Hinweis
 * - Footer ist immer unten -> Button sitzt sauber
 */
function MiniModuleCard({
  href,
  moduleHref,
  title,
  minutes,
  description,
  meta,
}: {
  href: string;
  moduleHref: string;
  title: string;
  minutes?: number;
  description: string;
  meta: MiniMeta;
}) {
  const router = useRouter();
  const last = formatRelative(meta.lastActivityTs);
  const cta = meta.status === "Neu" ? "Starten" : "Fortsetzen";

  const badgeVariant =
    meta.status === "Neu" ? "outline" : meta.status === "In Arbeit" ? "default" : "secondary";

  return (
    <Surface
      className="relative cursor-pointer p-0 lp-surface-1"
      role="link"
      tabIndex={0}
      aria-label={`${title} öffnen`}
      onClick={(event) => {
        if (isInteractiveElement(event.target)) return;
        router.push(moduleHref);
      }}
      onKeyDown={(event) => {
        if (isInteractiveElement(event.target)) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        router.push(moduleHref);
      }}
    >
      <Card className="flex h-[390px] flex-col gap-0 border-0 !bg-transparent shadow-none max-md:h-auto max-md:min-h-[350px]">
        <CardHeader className="flex flex-col gap-2 pb-4 max-md:pb-3">
          <div className="relative min-h-8">
            <CardTitle className="min-w-0 pr-36 lp-title leading-snug line-clamp-2">
              {title}
            </CardTitle>

            <Badge className="absolute right-0 top-0 shrink-0 rounded-full text-center whitespace-nowrap" variant={badgeVariant as any}>
              {meta.status}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 max-md:gap-1.5">
            <Badge variant="outline" className="rounded-full bg-transparent lp-card-grad-subtle">
              Lernen
            </Badge>

            {typeof minutes === "number" ? (
              <Badge variant="secondary" className="rounded-full bg-transparent lp-card-grad-subtle">
                {minutes} min
              </Badge>
            ) : null}
          </div>

          {/* feste Höhe für "Zuletzt…" */}
          <div className="min-h-[1rem] text-xs leading-snug text-muted-foreground">
            {last ? `Zuletzt ${last}` : "Noch keine Aktivität gespeichert."}
          </div>

          {/* feste Höhe für Beschreibung (2 Zeilen) */}
          <div className="min-h-[2.7rem] overflow-hidden pr-1 text-sm leading-[1.35] text-muted-foreground line-clamp-2 break-words max-md:min-h-[2.35rem]">
            {description}
          </div>
        </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-2.5 pt-1 max-md:gap-2">
            {/* Fortschritt – startet überall auf gleicher Höhe */}
            <div className="space-y-2.5 border-t border-border/60 pt-2.5 max-md:space-y-2 max-md:pt-2">
              <div className="flex shrink-0 items-center justify-between text-xs">
                <span className="text-muted-foreground">Fortschritt</span>
                <span className="tabular-nums text-foreground/80">
                  {meta.progressPercent}%
                </span>
              </div>

              <ProgressBar value={meta.progressPercent} />

              <div className="text-xs text-muted-foreground max-md:leading-snug">
                Fortschritt basiert auf korrekt gelösten Aufgaben (Übungsmodus).
              </div>
            </div>

            {/* Spacer – zwingt Footer nach unten */}
            <div className="flex-1" />

            {/* Footer: feste Höhe + Button immer unten */}
            <div className="flex min-h-[78px] flex-col border-t border-border/40 pb-1 pt-2 max-md:min-h-[56px] max-md:pt-1">
              <div className="mt-auto">
                <Button size="sm" asChild className="rounded-full">
                  <Link href={href}>
                    {cta} <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Tipp immer exakt 2 Zeilen Platz */}
              <div className="mt-1 min-h-[28px] text-[11px] text-muted-foreground leading-snug max-md:min-h-[24px] max-md:mt-2">
                Tipp: 2 Aufgaben sauber – dann kurze Pause.
              </div>
            </div>
          </CardContent>

      </Card>
    </Surface>
  );
}

export default function DashboardAreasClient({ modules }: { modules: ModuleRaw[] }) {
  const [profession, setProfession] = React.useState<ProfessionId>("industriemechaniker");
  const [plan, setPlan] = React.useState<Plan>("free");

  const [mounted, setMounted] = React.useState(false);
  const [lastModuleId, setLastModuleId] = React.useState<string | null>(null);

  // Mini-Meta für die 3 Free-Basis-Module (hydration-safe nach mount)
  const [miniMeta, setMiniMeta] = React.useState<Record<string, MiniMeta>>({});

  React.useEffect(() => {
    setPlan(getPlanClient());

    const profile = getProfileClient();
    if (profile?.professionId) setProfession(profile.professionId);

    setMounted(true);

    // ✅ localStorage erst nach mount
    setLastModuleId(getLastModuleIdFromLocalStorage());
  }, []);

  const areas: AreaDef[] = React.useMemo(() => getAreasForProfession(profession), [profession]);

  const allowedIds = React.useMemo(() => {
    const ids = getAllowedModuleIdsForProfession(profession);
    return new Set<string>(ids as string[]);
  }, [profession]);

  const allowedModules = React.useMemo(() => {
    return modules.filter((m) => allowedIds.has(m.id));
  }, [modules, allowedIds]);

  const modulesWithArea: ModuleItem[] = React.useMemo(() => {
    return allowedModules.map((m) => {
      const areaId = getAreaIdForModule(profession, m.id) ?? null;
      return { id: m.id, areaId };
    });
  }, [allowedModules, profession]);

  const countsByArea = React.useMemo(() => {
    const acc: Record<string, number> = {};
    for (const a of areas) acc[a.id] = 0;
    for (const m of modulesWithArea) {
      if (!m.areaId) continue;
      acc[m.areaId] = (acc[m.areaId] ?? 0) + 1;
    }
    return acc;
  }, [areas, modulesWithArea]);

  

  const recommendedModuleIds = React.useMemo(() => {
    const ordered = allowedModules.map((m) => m.id);
    if (!ordered.length) return [];

    if (plan === "free") {
      const allIds = new Set(modules.map((m) => m.id));
      const freeIds = FREE_ALLOWED_LEARN_IDS.filter((id) => allIds.has(id));
      return freeIds.slice(0, 3);
    }

    if (!mounted) {
      return ordered.slice(0, 3);
    }

    const lastId = lastModuleId && allowedIds.has(lastModuleId) ? lastModuleId : null;
    const lastInfo = lastId ? readLearnProgressInfo(lastId) : null;
    const lastPercent = lastInfo?.percent ?? 0;

    const startId = lastId ?? (allowedIds.has(DEFAULT_RECOMMENDED_MODULE_ID) ? DEFAULT_RECOMMENDED_MODULE_ID : ordered[0]);
    let startIdx = ordered.indexOf(startId);
    if (startIdx < 0) startIdx = 0;

    if (lastId && lastPercent >= 100 && startIdx + 1 < ordered.length) {
      startIdx += 1;
    }

    const ids: string[] = [];
    for (let i = 0; i < ordered.length && ids.length < 3; i++) {
      const idx = (startIdx + i) % ordered.length;
      const id = ordered[idx];
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  }, [plan, mounted, lastModuleId, modules, allowedModules, allowedIds]);

  const recommendedModules: ModuleRaw[] = React.useMemo(() => {
    const source = plan === "free" ? modules : allowedModules;
    const map = new Map<string, ModuleRaw>(source.map((m) => [m.id, m]));
    return recommendedModuleIds.map((id) => map.get(id)).filter(Boolean) as ModuleRaw[];
  }, [plan, modules, allowedModules, recommendedModuleIds]);

  React.useEffect(() => {
    if (!mounted) return;

    const compute = () => {
      const next: Record<string, MiniMeta> = {};
      for (const id of recommendedModuleIds) {
        next[id] = computeMiniMeta(id);
      }
      if (!next[DEFAULT_RECOMMENDED_MODULE_ID]) {
        next[DEFAULT_RECOMMENDED_MODULE_ID] = computeMiniMeta(DEFAULT_RECOMMENDED_MODULE_ID);
      }
      setMiniMeta(next);
    };

    compute();
    // Wenn in einem anderen Tab gelernt wird, aktualisiert sich der Dashboard-Status
    window.addEventListener("storage", compute);
    return () => window.removeEventListener("storage", compute);
  }, [mounted, lastModuleId, recommendedModuleIds]);

  const hasLocked = React.useMemo(() => {
    return areas.some((a) => !!a.requiresPlan && a.requiresPlan !== plan);
  }, [areas, plan]);

  const recommendedTitle = "Empfohlen für dich";
  const recommendedDescription =
    plan === "pro"
      ? "Basierend auf deinem letzten Lernstand – mach hier als Nächstes weiter."
      : "Diese 3 Module sind im Free-Plan freigeschaltet.";

  return (
    <section className="space-y-6 md:space-y-7" id="bereiche">
      {/* EMPFOHLEN */}
      <section className="space-y-4 md:space-y-5">
        <SectionHeader
          title={recommendedTitle}
          description={recommendedDescription}
          action={
            hasLocked && plan === "free" ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/pricing">Pro ansehen</Link>
              </Button>
            ) : null
          }
        />

        {/* Mobile: 1 Karte */}
        <div className="grid gap-4 md:hidden">
          {recommendedModules[0] ? (
            (() => {
              const m = recommendedModules[0];
              const desc = (m.description ?? "").trim();
              const safeDesc =
                desc.length > 0
                  ? desc
                  : "Prüfungsnah üben – kompakt, strukturiert, ohne Ablenkung.";

              const meta: MiniMeta = mounted
                ? miniMeta[m.id] ?? { status: "Neu", progressPercent: 0 }
                : { status: "Neu", progressPercent: 0 };

              return (
                <MiniModuleCard
                  href={`/learn/${m.id}`}
                  moduleHref={`/module/${m.id}`}
                  title={m.title}
                  description={safeDesc}
                  minutes={m.estimatedMinutes}
                  meta={meta}
                />
              );
            })()
          ) : (
            <Surface className="p-6 md:p-7 lp-surface-1">
              <div className="space-y-2">
                <div className="lp-title">Empfohlenes Modul nicht gefunden</div>
                <p className="lp-muted">
                  Bitte prüfe, ob die Module-ID korrekt ist:
                  <span className="font-mono"> kraefte-drehmomente</span>.
                </p>
              </div>
            </Surface>
          )}
        </div>

        {/* Desktop: 3 Karten */}
        <div className="hidden md:grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendedModules.length ? (
            recommendedModules.map((m) => {
              const desc = (m.description ?? "").trim();
              const safeDesc =
                desc.length > 0
                  ? desc
                  : "Prüfungsnah üben – kompakt, strukturiert, ohne Ablenkung.";

              const meta: MiniMeta = mounted
                ? miniMeta[m.id] ?? { status: "Neu", progressPercent: 0 }
                : { status: "Neu", progressPercent: 0 };

              return (
                <MiniModuleCard
                  key={m.id}
                  href={`/learn/${m.id}`}
                  moduleHref={`/module/${m.id}`}
                  title={m.title}
                  description={safeDesc}
                  minutes={m.estimatedMinutes}
                  meta={meta}
                />
              );
            })
          ) : (
            <Surface className="p-6 md:p-7 lp-surface-1">
              <div className="space-y-2">
                <div className="lp-title">Empfohlenes Modul nicht gefunden</div>
                <p className="lp-muted">
                  Bitte prüfe, ob die Module-ID korrekt ist:
                  <span className="font-mono"> kraefte-drehmomente</span>.
                </p>
              </div>
            </Surface>
          )}
        </div>
      </section>

      {/* ALLE BEREICHE */}
      <section className="space-y-4 md:space-y-5">
        <SectionHeader
          title="Alle Bereiche"
          description="Wähle gezielt einen Bereich. Du siehst nur Inhalte, die für deinen Beruf definiert sind."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((a) => {
            const locked = !!a.requiresPlan && a.requiresPlan !== plan;
            const showProBadge = plan === "free" && a.id !== "grundlagen-metalltechnik";
            return (
              <AreaCard
                key={a.id}
                href={`/dashboard/area/${a.id}`}
                title={a.title}
                description={a.description}
                count={countsByArea[a.id] ?? 0}
                locked={locked}
                showProBadge={showProBadge}
              />
            );
          })}
        </div>
      </section>

      {/* MODULE CTA */}
      <Surface className="p-6 md:p-7 lp-surface-1">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="lp-title">Module auswählen</div>
            <p className="lp-muted max-w-2xl">
              Wenn du gezielt suchen willst, findest du alle Module gesammelt in der Übersicht.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-full">
              <Link href="/module">
                Zur Modulübersicht <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Surface>
    </section>
  );
}
