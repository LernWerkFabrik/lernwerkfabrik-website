"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ProBadge } from "@/components/pro/ProBadge";

import { getPlanClient } from "@/lib/entitlements";
import type { Plan } from "@/lib/entitlements";
import { getSession } from "@/lib/auth";

import { getProfileClient, type ProfessionId } from "@/lib/profile";
import {
  getAreasForProfession,
  getAllowedModuleIdsForProfession,
  getAreaIdForModule,
  getAreaById,
  getModuleRelevanceForModule,
  type AreaDef,
  type AreaId,
  type ExamRelevance,
} from "@/lib/curriculum";

import type { ModuleMeta as ContentModuleMeta, ModuleKind } from "@/lib/content/types";

/* ------------------------------------------------------------------ */
/* Free-Regel (verbindlich) */
/* ------------------------------------------------------------------ */

const FREE_START_ORDER = [
  "technische-berechnungen",
  "technische-zeichnungen",
  "kraefte-drehmomente",
] as const;

const FREE_START_MODULES = new Set<string>(FREE_START_ORDER);

const FREE_RANK: Record<string, number> = Object.fromEntries(
  FREE_START_ORDER.map((id, idx) => [id, idx])
);

/* ------------------------------------------------------------------ */
/* Typen */
/* ------------------------------------------------------------------ */

type UserState = "guest" | "free" | "pro";

type ModuleDifficulty = "easy" | "medium" | "hard";

type ModuleWithArea = ContentModuleMeta & {
  areaId: AreaId;
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
  createdAt: string;
  percent: number;
};

type LearnProgressInfo = {
  hasTouched: boolean;
  percent: number;
  lastTs?: number;
  total: number;
  correct: number;
};

/* ------------------------------------------------------------------ */
/* Helpers (URL + UI) */
/* ------------------------------------------------------------------ */

function buildLoginRedirect(targetPath: string) {
  return `/login?redirect=${encodeURIComponent(targetPath)}`;
}

function readAreaFromLocation(): string {
  if (typeof window === "undefined") return "";
  try {
    const u = new URL(window.location.href);
    return u.searchParams.get("area") || "";
  } catch {
    return "";
  }
}

function readViewFromLocation(): "compact" | "full" {
  if (typeof window === "undefined") return "compact";
  try {
    const u = new URL(window.location.href);
    const v = u.searchParams.get("view");
    return v === "full" ? "full" : "compact";
  } catch {
    return "compact";
  }
}

function examBadgeLabel(exam?: ExamRelevance): string | null {
  if (exam === "AP1") return "AP1";
  if (exam === "AP2") return "AP2";
  if (exam === "AP1_AP2") return "AP1 / AP2";
  return null;
}

function lehrjahrLabel(lehrjahre?: Array<1 | 2 | 3 | 4>): string | null {
  if (!lehrjahre || lehrjahre.length === 0) return null;
  const sorted = [...new Set(lehrjahre)].sort((a, b) => a - b);
  if (sorted.length === 1) return `typisch ${sorted[0]}. Lehrjahr`;
  return `typisch ${sorted[0]}.–${sorted[sorted.length - 1]}. Lehrjahr`;
}

function safeTags(tags?: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const t of cleaned) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(t);
  }
  return unique;
}

function normalizeInlineText(value?: string | null): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function truncateAtWord(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const slice = value.slice(0, maxChars);
  const splitAt = slice.lastIndexOf(" ");
  const cut = splitAt >= Math.floor(maxChars * 0.6) ? splitAt : maxChars;
  return `${slice.slice(0, cut).trim()}...`;
}

function displayTitle(raw: string): string {
  return raw
    .replace(/^AP\s*Teil\s*1\s*[–-]\s*/i, "Abschlussprüfung Teil 1 (AP1) – ")
    .replace(/^AP\s*Teil\s*2\s*[–-]\s*/i, "Abschlussprüfung Teil 2 (AP2) – ")
    .trim();
}

function clampPercent(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
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

function getScopedLearnAnswerKeys(obj: Record<string, unknown>, onlyQuestionIds: Set<string> | null) {
  const keys = getLearnAnswerKeys(obj);
  if (!onlyQuestionIds) return keys;
  return keys.filter((k) => onlyQuestionIds.has(k));
}

function readLearnProgressForList(moduleId: string): LearnProgressInfo {
  if (typeof window === "undefined") {
    return { hasTouched: false, percent: 0, total: 25, correct: 0 };
  }

  const key = `lp:learn:progress:${moduleId}`;
  const obj = safeJsonParse<LearnProgressMap>(localStorage.getItem(key));

  if (!obj || typeof obj !== "object") {
    return { hasTouched: false, percent: 0, total: 25, correct: 0 };
  }

  const qidsRaw =
    safeJsonParse<unknown>(localStorage.getItem(`lp:learn:qids:${moduleId}`)) ??
    safeJsonParse<unknown>(localStorage.getItem(`lp.learn.qids.${moduleId}`));
  const questionIds = normalizeStoredQuestionIds(qidsRaw);
  const onlyQuestionIds = questionIds.length ? new Set(questionIds) : null;

  const qKeys = getScopedLearnAnswerKeys(obj as Record<string, unknown>, onlyQuestionIds);
  const total = onlyQuestionIds?.size ? onlyQuestionIds.size : Math.max(25, qKeys.length || 0);

  const correct = qKeys.reduce((acc, k) => {
    const value = (obj as Record<string, unknown>)[k];
    return acc + (value === "correct" ? 1 : 0);
  }, 0);

  const percent = total > 0 ? clampPercent(Math.round((correct / total) * 100)) : 0;

  const lastTs =
    typeof obj.updatedAt === "number"
      ? obj.updatedAt
      : typeof obj.ts === "number"
      ? obj.ts
      : undefined;

  const hasTouched = qKeys.length > 0 || typeof lastTs === "number";
  return { hasTouched, percent, lastTs, total, correct };
}

function readExamHistoryForList(moduleId: string): ExamAttempt[] {
  if (typeof window === "undefined") return [];
  const key = `lp:exam:history:${moduleId}`;
  const data = safeJsonParse<ExamAttempt[]>(localStorage.getItem(key));
  return Array.isArray(data) ? data : [];
}

function formatRelativeTs(ts?: number) {
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

function sortFreeFirst(a: ContentModuleMeta, b: ContentModuleMeta) {
  const ra = FREE_RANK[a.id] ?? 999;
  const rb = FREE_RANK[b.id] ?? 999;
  if (ra !== rb) return ra - rb;
  return (a.title || "").localeCompare(b.title || "");
}

function DifficultyBadge({ d }: { d?: ModuleDifficulty }) {
  if (!d) return <Badge variant="secondary">—</Badge>;
  if (d === "easy") return <Badge>Easy</Badge>;
  if (d === "medium") return <Badge variant="secondary">Medium</Badge>;
  return <Badge variant="destructive">Hard</Badge>;
}

function AccentLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
  );
}

function RecommendedBadge() {
  return (
    <Badge className="rounded-full border border-amber-400/35 bg-amber-400/10 text-foreground">
      Empfohlen
    </Badge>
  );
}

function SpotlightBadge() {
  return (
    <Badge className="rounded-full border border-amber-400/40 bg-amber-400/15 text-foreground">
      Start hier
    </Badge>
  );
}

function AreaPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        "hover:-translate-y-[1px] hover:shadow-[0_16px_34px_-26px_rgba(0,0,0,0.65)]",
        "hover:ring-1 hover:ring-primary/12 dark:hover:ring-primary/10",
        active
          ? "bg-primary/10 border-primary/25 text-foreground"
          : "bg-background/60 border-border/60 text-foreground/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export default function ModuleListClient({
  modules,
}: {
  modules: ContentModuleMeta[];
}) {
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);

  const [plan, setPlan] = React.useState<Plan>("free");
  const [, setAuthed] = React.useState(false);
  const [userState, setUserState] = React.useState<UserState>("guest");

  const [profession, setProfession] =
    React.useState<ProfessionId>("industriemechaniker");

  const [currentArea, setCurrentArea] = React.useState<string>("");
  const [view, setView] = React.useState<"compact" | "full">("compact");
  const [progressVersion, setProgressVersion] = React.useState(0);

  // --------- Bootstrap (client) ----------
  React.useEffect(() => {
    setMounted(true);

    const syncUrlState = () => {
      setCurrentArea(readAreaFromLocation());
      setView(readViewFromLocation());
    };

    const syncProfile = () => {
      const profile: any = getProfileClient();
      if (profile?.professionId) setProfession(profile.professionId);
    };

    const syncAuthPlan = async () => {
      // Plan: local (inkl DEV override)
      const p = getPlanClient();
      setPlan(p);

      // Auth: NUR über Session (zentral)
      const res = await getSession();
      const isAuthed = !!(res.ok && res.data);
      setAuthed(isAuthed);

      const st: UserState = !isAuthed ? "guest" : p === "pro" ? "pro" : "free";
      setUserState(st);
    };

    syncUrlState();
    syncProfile();
    void syncAuthPlan();

    const onPop = () => syncUrlState();
    const onFocus = () => {
      syncProfile();
      void syncAuthPlan();
    };
    const onStorage = (e: StorageEvent) => {
      // wenn Plan/Dev override wechselt -> neu ziehen
      if (!e.key) return;
      if (e.key === "lp.plan.v1" || e.key === "DEV_FORCE_PLAN") {
        void syncAuthPlan();
      }
      // wenn login/logout irgendwo etwas setzt -> wir ziehen Session neu
      if (e.key === "lp.auth.v1" || e.key === "lp_auth_user") {
        void syncAuthPlan();
      }
    };

    window.addEventListener("popstate", onPop);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [router]);

  React.useEffect(() => {
    const bump = () => setProgressVersion((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (!e.key) {
        bump();
        return;
      }
      if (e.key.startsWith("lp:learn:progress:") || e.key.startsWith("lp:exam:history:")) {
        bump();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") bump();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // --------- Data derived ----------
  const areas: AreaDef[] = React.useMemo(
    () => getAreasForProfession(profession),
    [profession]
  );

  const allowedIds = React.useMemo(() => {
    const ids = getAllowedModuleIdsForProfession(profession);
    return new Set<string>(ids as string[]);
  }, [profession]);

  const allowedModules = React.useMemo(
    () => modules.filter((m) => allowedIds.has(m.id)),
    [modules, allowedIds]
  );

  const modulesWithArea: ModuleWithArea[] = React.useMemo(() => {
    return allowedModules.map((m) => ({
      ...m,
      tags: safeTags(m.tags),
      areaId: (getAreaIdForModule(profession, m.id) ??
        "grundlagen-metalltechnik") as AreaId,
    }));
  }, [allowedModules, profession]);

  const countsByArea = React.useMemo(() => {
    const acc: Record<string, number> = {};
    for (const a of areas) acc[a.id] = 0;
    for (const m of modulesWithArea) acc[m.areaId] = (acc[m.areaId] ?? 0) + 1;
    return acc;
  }, [modulesWithArea, areas]);

  const activeArea = React.useMemo(
    () => getAreaById(areas, currentArea),
    [areas, currentArea]
  );

  const isAreaLocked = React.useMemo(() => {
    if (!activeArea) return false;
    return !!activeArea.requiresPlan && activeArea.requiresPlan !== plan;
  }, [activeArea, plan]);

  const compact = view === "compact";

  function setArea(next: string) {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (!next) u.searchParams.delete("area");
    else u.searchParams.set("area", next);
    window.history.pushState({}, "", u.toString());
    setCurrentArea(next);
    router.replace(u.pathname + u.search, { scroll: false });
  }

  function setViewMode(next: "compact" | "full") {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    if (next === "compact") u.searchParams.delete("view");
    else u.searchParams.set("view", "full");
    window.history.pushState({}, "", u.toString());
    setView(next);
    router.replace(u.pathname + u.search, { scroll: false });
  }

  function isAllowedInFree(moduleId: string) {
    return FREE_START_MODULES.has(moduleId);
  }

  function freeLocked(moduleId: string): boolean {
    return userState === "free" && !isAllowedInFree(moduleId);
  }

  // Spotlight (3 Module)
  const spotlight = React.useMemo(() => {
    const map = new Map(modulesWithArea.map((m) => [m.id, m]));
    const arr: ModuleWithArea[] = [];
    for (const id of FREE_START_ORDER) {
      const hit = map.get(id);
      if (hit) arr.push(hit);
    }
    return arr;
  }, [modulesWithArea]);

  const baseFiltered = React.useMemo(() => {
    const base = !currentArea
      ? modulesWithArea
      : modulesWithArea.filter((m) => m.areaId === (currentArea as AreaId));

    if (userState === "guest" || userState === "free") {
      return [...base].sort(sortFreeFirst);
    }
    return [...base].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [modulesWithArea, currentArea, userState]);

  const filtered = React.useMemo(() => {
    if ((userState === "guest" || userState === "free") && spotlight.length > 0) {
      const ids = new Set(spotlight.map((m) => m.id));
      return baseFiltered.filter((m) => !ids.has(m.id));
    }
    return baseFiltered;
  }, [baseFiltered, spotlight, userState]);

  const showSpotlight =
    (userState === "guest" || userState === "free") && spotlight.length > 0;

  if (!mounted) return <div className="space-y-6" />;

  return (
    <div className="space-y-6">
      {/* Head */}
      <div className="space-y-1">


        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Module
        </h1>

        {userState === "guest" ? (
          <p className="text-sm text-muted-foreground">
            Du kannst Inhalte ansehen. Zum Starten bitte anmelden.
          </p>
        ) : userState === "free" ? (
          <p className="text-sm text-muted-foreground">
            Free ist limitiert: Du kannst nur 3 Basismodule starten. Prüfung ist
            in Free gesperrt.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Pro: alle Module und Prüfungen freigeschaltet.
          </p>
        )}
      </div>

      {/* Spotlight */}
      {showSpotlight ? (
        <Card className="relative overflow-hidden rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader className="space-y-2">
            <CardTitle>Empfohlener Start</CardTitle>
            <p className="text-sm text-muted-foreground">
              Starte hier — diese 3 Module sind in Free verfügbar und bauen die Basis auf.
            </p>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {spotlight.map((m) => {
              const rel = getModuleRelevanceForModule(profession, m.id as any);
              const ap = examBadgeLabel(rel?.exam);
              const lj = lehrjahrLabel(rel?.lehrjahre);
              const areaTitle = areas.find((a) => a.id === m.areaId)?.title;

              const kind: ModuleKind = m.kind;

              return (
                <Card
                  key={`spot-${m.id}`}
                  className={[
                    "relative overflow-hidden rounded-2xl lp-surface-1 lp-card-panel-weak !bg-transparent backdrop-blur",
                    "hover:-translate-y-[1px] hover:shadow-[0_20px_50px_-35px_rgba(245,158,11,0.55)]",
                    "transition",
                  ].join(" ")}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/18 via-transparent to-amber-400/14 dark:from-cyan-300/22 dark:to-amber-300/18" />
                  <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px circle at 0% 0%, rgba(34,211,238,0.14), transparent 55%)" }} />
                  <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px circle at 100% 0%, rgba(251,191,36,0.12), transparent 60%)" }} />
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
                  <AccentLine />

                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {displayTitle(m.title)}
                      </CardTitle>

                      <DifficultyBadge d={m.difficulty as ModuleDifficulty | undefined} />
                    </div>

                    {m.description ? (
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    ) : null}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <SpotlightBadge />
                      <RecommendedBadge />
                      {areaTitle ? <Badge variant="secondary">{areaTitle}</Badge> : null}
                      {ap ? <Badge variant="outline">{ap}</Badge> : null}
                      {lj ? <Badge variant="secondary">{lj}</Badge> : null}
                      {typeof m.estimatedMinutes === "number" ? (
                        <Badge variant="secondary">{m.estimatedMinutes} min</Badge>
                      ) : null}
                      <Badge variant="outline">{kind}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" asChild className="rounded-full">
                        <Link href={`/module/${m.id}`}>Öffnen</Link>
                      </Button>

                      {userState === "guest" ? (
                        <Button size="sm" asChild className="rounded-full">
                          <Link href={buildLoginRedirect(`/module/${m.id}`)}>
                            Jetzt anmelden
                          </Link>
                        </Button>
                      ) : userState === "free" ? (
                        <>
                          <Button size="sm" variant="secondary" asChild className="rounded-full">
                            <Link href={`/learn/${m.id}`}>Lernen</Link>
                          </Button>

                          <Button size="sm" variant="outline" asChild className="rounded-full">
                            <Link href="/pricing">Pro freischalten</Link>
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="secondary" asChild className="rounded-full">
                          <Link href={`/learn/${m.id}`}>Lernen</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <div id="modul-katalog" className="scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Modul-Katalog</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <AreaPill active={!currentArea} onClick={() => setArea("")}>
          Alle ({modulesWithArea.length})
        </AreaPill>

        {areas.map((a) => (
          <AreaPill key={a.id} active={currentArea === a.id} onClick={() => setArea(a.id)}>
            {a.title} ({countsByArea[a.id] ?? 0})
          </AreaPill>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">
          {compact
            ? "Kurzüberblick – das Wichtigste zuerst"
            : "Detailansicht – alle Infos, Inhalte & Aktionen"}
        </div>



        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setViewMode(compact ? "full" : "compact")}
        >
          {compact ? "Alle Infos anzeigen" : "Zur Übersicht"}
        </Button>
      </div>

      {/* Locked area */}
      {activeArea && isAreaLocked ? (
        <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader>
            <CardTitle>Bereich ist Pro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            Pro schaltet die Module in <span className="font-medium">{activeArea.title}</span> frei.
            <div>
              {userState === "guest" ? (
                <Button asChild className="rounded-full">
                  <Link href={buildLoginRedirect("/module")}>Jetzt anmelden</Link>
                </Button>
              ) : userState === "free" ? (
                <Button asChild className="rounded-full">
                  <Link href="/pricing">Pro freischalten</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader>
            <CardTitle>Keine Module gefunden</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Dieser Bereich ist definiert, aber es sind noch keine Module zugeordnet.
          </CardContent>
        </Card>
      ) : userState === "guest" ? (
        /* GAST: Rest als LISTE + CTA "Jetzt anmelden" */
        <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader>
            <CardTitle>Weitere Inhalte</CardTitle>
            <p className="text-sm text-muted-foreground">
              Diese Module kannst du ansehen — zum Starten bitte anmelden.
            </p>
          </CardHeader>

          <CardContent className="space-y-2">
            <ul className="divide-y divide-border/50 rounded-xl border bg-background/40">
              {filtered.map((m) => {
                const areaTitle = areas.find((a) => a.id === m.areaId)?.title;
                const rel = getModuleRelevanceForModule(profession, m.id as any);
                const ap = examBadgeLabel(rel?.exam);
                const lj = lehrjahrLabel(rel?.lehrjahre);
                const kind: ModuleKind = m.kind;
                const tags = safeTags(m.tags);
                const showGuestDetails = !compact;
                const desc = normalizeInlineText(m.description);
                const introWhy = normalizeInlineText(m.intro?.why);
                const detailWhy = showGuestDetails && introWhy ? truncateAtWord(introWhy, 180) : "";
                const showDetailMeta =
                  showGuestDetails &&
                  (!!ap ||
                    !!lj ||
                    typeof m.estimatedMinutes === "number" ||
                    tags.length > 0 ||
                    !!detailWhy);

                return (
                  <li
                    key={`guest-row-${m.id}`}
                    className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{displayTitle(m.title)}</span>
                        <Badge variant="outline" className="rounded-full">
                          {kind}
                        </Badge>
                        {areaTitle ? (
                          <Badge variant="secondary" className="rounded-full">
                            {areaTitle}
                          </Badge>
                        ) : null}
                        {showGuestDetails && ap ? (
                          <Badge variant="outline" className="rounded-full">
                            {ap}
                          </Badge>
                        ) : null}
                        {showGuestDetails && lj ? (
                          <Badge variant="secondary" className="rounded-full">
                            {lj}
                          </Badge>
                        ) : null}
                        {showGuestDetails && typeof m.estimatedMinutes === "number" ? (
                          <Badge variant="secondary" className="rounded-full">
                            {m.estimatedMinutes} min
                          </Badge>
                        ) : null}
                      </div>

                      {desc ? (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {showGuestDetails ? desc : truncateAtWord(desc, 110)}
                        </div>
                      ) : null}

                      {showDetailMeta ? (
                        <div className="mt-2 space-y-2">
                          {detailWhy ? (
                            <div className="text-xs text-muted-foreground">{detailWhy}</div>
                          ) : null}
                          {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {tags.slice(0, 4).map((t) => (
                                <Badge key={`${m.id}-guest-tag-${t}`} variant="outline" className="rounded-full">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button size="sm" variant="outline" asChild className="rounded-full">
                        <Link href={`/module/${m.id}`}>Ansehen</Link>
                      </Button>

                      <Button size="sm" asChild className="rounded-full">
                        <Link href={buildLoginRedirect(`/module/${m.id}`)}>Jetzt anmelden</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : (
        /* Free/Pro: Grid */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const lockedByFree = freeLocked(m.id);

            const rel = getModuleRelevanceForModule(profession, m.id as any);
            const ap = examBadgeLabel(rel?.exam);
            const lj = lehrjahrLabel(rel?.lehrjahre);

            const areaTitle = areas.find((a) => a.id === m.areaId)?.title;
            const kind: ModuleKind = m.kind;
            const isExam = kind === "exam";
            const isPrep = kind === "prep";
            const tags = safeTags(m.tags);
            const showDetails = !compact && progressVersion >= 0;
            const desc = normalizeInlineText(m.description);
            const introWhy = normalizeInlineText(m.intro?.why);
            const detailWhy = showDetails && introWhy ? truncateAtWord(introWhy, 260) : "";

            const isRecommended = userState === "free" && FREE_START_MODULES.has(m.id);
            const learnInfo = showDetails && !isExam ? readLearnProgressForList(m.id) : null;
            const examHistory = showDetails && isExam ? readExamHistoryForList(m.id) : [];
            const sortedExams =
              showDetails && isExam
                ? [...examHistory].sort((a, b) => {
                    const ta = parseIsoToMs(a.createdAt) ?? 0;
                    const tb = parseIsoToMs(b.createdAt) ?? 0;
                    return tb - ta;
                  })
                : [];
            const attempts = sortedExams.length;
            const bestExam =
              showDetails && isExam && attempts > 0
                ? clampPercent(Math.max(...sortedExams.map((e) => Number(e.percent) || 0)))
                : undefined;
            const lastExam =
              showDetails && isExam && attempts > 0
                ? clampPercent(Number(sortedExams[0]?.percent) || 0)
                : undefined;
            const progress = showDetails
              ? isExam
                ? bestExam ?? 0
                : learnInfo?.percent ?? 0
              : 0;
            const lastTs = showDetails
              ? isExam
                ? parseIsoToMs(sortedExams[0]?.createdAt)
                : learnInfo?.lastTs
              : undefined;
            const last = showDetails ? formatRelativeTs(lastTs) : null;

            return (
              <Card
                key={m.id}
                className="relative overflow-hidden rounded-2xl lp-surface-1 lp-card-panel-weak !bg-transparent backdrop-blur"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/18 via-transparent to-amber-400/14 dark:from-cyan-300/22 dark:to-amber-300/18" />
                <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px circle at 0% 0%, rgba(34,211,238,0.14), transparent 55%)" }} />
                <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px circle at 100% 0%, rgba(251,191,36,0.12), transparent 60%)" }} />
                <AccentLine />

                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{displayTitle(m.title)}</CardTitle>

                    <div className="flex items-center gap-2">
                      {/* ProBadge nur als Marker bei Pro-Content; in Free zeigen wir "Pro nötig" */}
                      {lockedByFree || (userState === "free" && isExam) ? <ProBadge /> : null}
                      <DifficultyBadge d={m.difficulty as ModuleDifficulty | undefined} />
                    </div>
                  </div>

                  {desc ? <p className="text-sm text-muted-foreground">{desc}</p> : null}
                  {showDetails && detailWhy ? (
                    <p className="text-xs leading-relaxed text-muted-foreground/90">
                      {detailWhy}
                    </p>
                  ) : null}
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {isRecommended ? <RecommendedBadge /> : null}
                    {areaTitle ? <Badge variant="secondary">{areaTitle}</Badge> : null}
                    {ap ? <Badge variant="outline">{ap}</Badge> : null}
                    {showDetails && lj ? <Badge variant="secondary">{lj}</Badge> : null}

                    {showDetails
                      ? tags.slice(0, 4).map((t) => (
                          <Badge key={t} variant="outline" className="rounded-full">
                            {t}
                          </Badge>
                        ))
                      : null}

                    {typeof m.estimatedMinutes === "number" ? (
                      <Badge variant="secondary">{m.estimatedMinutes} min</Badge>
                    ) : null}

                    <Badge variant="outline">{kind}</Badge>

                    {showDetails && isExam && attempts > 0 ? (
                      <Badge variant="secondary" className="rounded-full">
                        {attempts} Pruefung{attempts === 1 ? "" : "en"}
                      </Badge>
                    ) : null}

                    {showDetails && isExam && typeof bestExam === "number" ? (
                      <Badge variant="secondary" className="rounded-full">
                        Bestwert {bestExam}%
                      </Badge>
                    ) : null}

                    {showDetails && isExam && typeof lastExam === "number" ? (
                      <Badge variant="secondary" className="rounded-full">
                        Letzte {lastExam}%
                      </Badge>
                    ) : null}

                    {userState === "free" && (lockedByFree || isExam) ? (
                      <Badge variant="outline" className="rounded-full whitespace-nowrap">
                        Pro nötig
                      </Badge>
                    ) : null}
                  </div>

                  {showDetails ? (
                    <div className="text-xs text-muted-foreground">
                      {last ? `Zuletzt ${last}` : "Noch keine Aktivitaet gespeichert."}
                    </div>
                  ) : null}

                  {showDetails ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Fortschritt</span>
                        <span className="tabular-nums text-foreground/80">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} />
                      <div className="text-xs text-muted-foreground">
                        {isExam
                          ? "Fortschritt basiert auf deinem besten Simulationsergebnis."
                          : "Fortschritt basiert auf korrekt geloesten Aufgaben (Uebungsmodus)."}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild className="rounded-full">
                      <Link href={`/module/${m.id}`}>Öffnen</Link>
                    </Button>

                    {userState === "free" && (lockedByFree || isExam) ? (
                      <Button size="sm" variant="outline" asChild className="rounded-full">
                        <Link href="/pricing">Pro freischalten</Link>
                      </Button>
                    ) : isExam ? (
                      <Button size="sm" asChild className="rounded-full">
                        <Link href={`/exam/${m.id}`}>Prüfung starten</Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" asChild className="rounded-full">
                        <Link href={`/learn/${m.id}`}>{isPrep ? "Vorbereitung" : "Lernen"}</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

