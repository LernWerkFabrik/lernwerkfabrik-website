"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import SectionHeader from "@/components/SectionHeader";
import Surface from "@/components/Surface";
import ModuleCardsClient from "@/app/dashboard/ModuleCardsClient";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lock, ArrowRight } from "lucide-react";

import { getPlanClient, canAccessModule, type PlanId } from "@/lib/entitlements";
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

type ModuleRaw = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  estimatedMinutes?: number;
};

type CardsModulesProp = React.ComponentProps<typeof ModuleCardsClient>["modules"];
type CardsModuleItem = CardsModulesProp[number];

const FREE_START_ORDER = [
  "technische-berechnungen",
  "technische-zeichnungen",
  "kraefte-drehmomente",
] as const;

const FREE_RANK: Record<string, number> = Object.fromEntries(
  FREE_START_ORDER.map((id, idx) => [id, idx])
);

function normalizeSlug(input: unknown): string {
  const raw = typeof input === "string" ? input : "";
  try {
    return decodeURIComponent(raw || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/-+/g, "-");
  } catch {
    return (raw || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
      .replace(/-+/g, "-");
  }
}

function readAreaIdFromPathname(pathname: string | null): string {
  const p = (pathname || "").trim();
  if (!p) return "";
  const parts = p.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function apLabel(ap: ExamRelevance) {
  if (ap === "AP1") return "AP Teil 1";
  if (ap === "AP2") return "AP Teil 2";
  return "AP Teil 1 & 2";
}

function lehrjahrLabel(lehrjahre?: Array<1 | 2 | 3 | 4>) {
  if (!lehrjahre || lehrjahre.length === 0) return null;
  const sorted = [...new Set(lehrjahre)].sort((a, b) => a - b);
  if (sorted.length === 1) return `typisch ${sorted[0]}. LJ`;
  return `typisch ${sorted[0]}.–${sorted[sorted.length - 1]}. LJ`;
}

function safeParseJSON<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function getLastModuleIdForAreaFromLocalStorage(opts: {
  profession: ProfessionId;
  activeAreaId: AreaId;
  allowedIds: Set<string>;
}): string | null {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("lp.")) keys.push(k);
    }

    let best: { ts: number; moduleId: string } | null = null;

    for (const k of keys) {
      const raw = localStorage.getItem(k) ?? "";
      const obj = safeParseJSON<any>(raw);

      const ts = Number(obj?.ts ?? obj?.updatedAt ?? obj?.date ?? obj?.lastUpdated ?? 0) || 0;

      const fromObj =
        (typeof obj?.moduleId === "string" && obj.moduleId) ||
        (typeof obj?.module === "string" && obj.module) ||
        (typeof obj?.lessonId === "string" && obj.lessonId) ||
        "";

      let fromKey = "";
      const parts = k.split(".");
      const idxLearn = parts.indexOf("learn");
      if (!fromKey && idxLearn >= 0 && parts[idxLearn + 1]) fromKey = parts[idxLearn + 1] ?? "";
      const idxProgress = parts.indexOf("progress");
      if (!fromKey && idxProgress >= 0 && parts[idxProgress + 1]) fromKey = parts[idxProgress + 1] ?? "";

      const moduleId = (fromObj || fromKey || "").trim();
      if (!moduleId) continue;

      if (!opts.allowedIds.has(moduleId)) continue;

      const areaId = getAreaIdForModule(opts.profession, moduleId);
      if (!areaId || areaId !== opts.activeAreaId) continue;

      if (!best || ts > best.ts) best = { ts, moduleId };
    }

    return best?.moduleId ?? null;
  } catch {
    return null;
  }
}

function formatMinutes(min?: number | null) {
  if (typeof min !== "number" || !Number.isFinite(min) || min <= 0) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function AreaPageClient({ areaId, modules }: { areaId: string; modules: ModuleRaw[] }) {
  const pathname = usePathname();

  const [profession, setProfession] = React.useState<ProfessionId>("industriemechaniker");
  const [plan, setPlan] = React.useState<PlanId>("free");
  const [mounted, setMounted] = React.useState(false);

  const [lastModuleInArea, setLastModuleInArea] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    setPlan(getPlanClient());

    const profile = getProfileClient();
    if (profile?.professionId) setProfession(profile.professionId);
  }, []);

  const areas: AreaDef[] = React.useMemo(() => getAreasForProfession(profession), [profession]);

  const effectiveAreaIdRaw = React.useMemo(() => {
    const fromProp = normalizeSlug(areaId);
    if (fromProp) return fromProp;
    return normalizeSlug(readAreaIdFromPathname(pathname));
  }, [areaId, pathname]);

  const activeArea = React.useMemo(() => getAreaById(areas, effectiveAreaIdRaw), [areas, effectiveAreaIdRaw]);
  const activeAreaId = (activeArea?.id ?? null) as AreaId | null;

  const allowedIds = React.useMemo(() => new Set(getAllowedModuleIdsForProfession(profession)), [profession]);
  const allowedModules = React.useMemo(() => modules.filter((m) => allowedIds.has(m.id)), [modules, allowedIds]);

  const filteredModules: CardsModulesProp = React.useMemo(() => {
    if (!activeAreaId) return [];

    const out: CardsModuleItem[] = [];

    for (const m of allowedModules) {
      const aId = getAreaIdForModule(profession, m.id);
      if (!aId || aId !== activeAreaId) continue;

      out.push({
        id: m.id,
        title: m.title,
        estimatedMinutes: typeof m.estimatedMinutes === "number" ? m.estimatedMinutes : undefined,
        kind: "learn",
      } as unknown as CardsModuleItem);
    }

    return out;
  }, [allowedModules, activeAreaId, profession]);

  const orderedModulesForList: CardsModulesProp = React.useMemo(() => {
    if (plan !== "free") return filteredModules;

    return [...filteredModules].sort((a, b) => {
      const ra = FREE_RANK[a.id] ?? 999;
      const rb = FREE_RANK[b.id] ?? 999;
      if (ra !== rb) return ra - rb;
      return (a.title || "").localeCompare(b.title || "", "de");
    });
  }, [filteredModules, plan]);

  const areaHints = React.useMemo(() => {
    if (!activeAreaId) return { ap: null as ExamRelevance | null, lj: null as string | null };

    const rels = filteredModules
      .map((m) => getModuleRelevanceForModule(profession, m.id))
      .filter(Boolean) as Array<{ exam: ExamRelevance; lehrjahre: Array<1 | 2 | 3 | 4> }>;

    if (rels.length === 0) return { ap: null, lj: null };

    const hasAP1 = rels.some((r) => r.exam === "AP1" || r.exam === "AP1_AP2");
    const hasAP2 = rels.some((r) => r.exam === "AP2" || r.exam === "AP1_AP2");
    const ap: ExamRelevance | null = hasAP1 && hasAP2 ? "AP1_AP2" : hasAP1 ? "AP1" : hasAP2 ? "AP2" : null;

    const allYears = rels.flatMap((r) => r.lehrjahre);
    const lj = lehrjahrLabel(allYears.length ? (allYears as Array<1 | 2 | 3 | 4>) : undefined);

    return { ap, lj };
  }, [filteredModules, profession, activeAreaId]);

  React.useEffect(() => {
    if (!activeAreaId) return;

    const last = getLastModuleIdForAreaFromLocalStorage({
      profession,
      activeAreaId,
      allowedIds,
    });

    setLastModuleInArea(last);
  }, [profession, activeAreaId, allowedIds]);

  const recommendedModule: CardsModuleItem | null = React.useMemo(() => {
    if (!activeAreaId) return null;
    if (!filteredModules.length) return null;

    if (lastModuleInArea) {
      const found = filteredModules.find((m) => m.id === lastModuleInArea) ?? null;
      if (found) return found;
    }
    return filteredModules[0] ?? null;
  }, [activeAreaId, filteredModules, lastModuleInArea]);

  const isResume = React.useMemo(() => {
    return Boolean(lastModuleInArea && recommendedModule && lastModuleInArea === recommendedModule.id);
  }, [lastModuleInArea, recommendedModule]);

  if (!activeArea) {
    return (
      <Surface className="p-0">
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-6 md:p-7 space-y-3">
            <div className="lp-title">Bereich nicht gefunden</div>
            <Button asChild className="rounded-full">
              <Link href="/dashboard">Zurück zum Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </Surface>
    );
  }

  const recommendedLocked =
    mounted && recommendedModule ? !canAccessModule(plan, recommendedModule.id) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-foreground">{activeArea.title}</span>
      </div>

      <div className="space-y-2">
        <SectionHeader
          title={activeArea.title}
          description={activeArea.description}
          action={
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {areaHints.ap ? (
            <Badge variant="outline" className="rounded-full">
              {apLabel(areaHints.ap)}
            </Badge>
          ) : null}

          {areaHints.lj ? (
            <Badge variant="secondary" className="rounded-full">
              {areaHints.lj}
            </Badge>
          ) : null}
        </div>
      </div>

      {recommendedModule ? (
        <Surface className="p-0">
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="p-6 md:p-7 space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Dein nächster Schritt</div>
                <div className="lp-title">{recommendedModule.title}</div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                    {isResume ? "Weiter an deinem letzten Stand" : "Empfohlen zum Einstieg"}
                  </span>

                  {formatMinutes((recommendedModule as any).estimatedMinutes ?? null) ? (
                    <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                      {formatMinutes((recommendedModule as any).estimatedMinutes ?? null)}
                    </span>
                  ) : null}

                  {recommendedLocked ? (
                    <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Pro
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild className="rounded-full">
                  <Link
                    href={
                      recommendedLocked
                        ? "/pricing"
                        : `/learn/${encodeURIComponent(recommendedModule.id)}`
                    }
                  >
                    {recommendedLocked
                      ? "Pro freischalten"
                      : isResume
                        ? "Weiterlernen"
                        : "Jetzt starten"}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/module">Alle Module</Link>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Tipp: Mach 2 Aufgaben sauber durch – Qualität vor Tempo.
              </div>
            </CardContent>
          </Card>
        </Surface>
      ) : null}

      <div className="space-y-3">
        <SectionHeader
          title="Alle Module in diesem Bereich"
          description="Wenn du gezielt auswählen willst, findest du hier alle Module dieses Bereichs."
        />
        <ModuleCardsClient modules={orderedModulesForList} />
      </div>
    </div>
  );
}

