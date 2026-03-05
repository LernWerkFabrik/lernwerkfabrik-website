// app/DashboardClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExamRiskWidgetClient } from "@/components/dashboard/ExamRiskWidgetClient";
import { getUser } from "@/lib/auth";
import { getProfileClient, PROFESSIONS } from "@/lib/profile";
import { getPlanClient, type Plan } from "@/lib/entitlements";
import {
  getAllowedModuleIdsForProfession,
  getModuleRelevanceForModule,
  isProfessionId,
  type ExamRelevance,
} from "@/lib/curriculum";
import { ExamReadinessClient } from "@/components/dashboard/ExamReadinessClient";
import { FreeExamCheckCardClient } from "@/components/dashboard/FreeExamCheckCardClient";
import { trackExamCheckUpgradeSuccessIfEligible } from "@/lib/examCheckStorage";





function safeParseJSON<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function getRiskModuleIds(professionId: string | undefined) {
  if (!professionId) return null;

  try {
    // Wir validieren runtime-sicher, ohne das ganze Dashboard umzubauen.
    const fn = getAllowedModuleIdsForProfession as unknown as (id: string) => string[];
    const ids = fn(professionId);
    return Array.isArray(ids) && ids.length ? ids : null;
  } catch {
    return null;
  }
}


type ActivityStatus = "in_progress" | "done" | "wrong" | "help" | "unknown";

type LpDecorated = {
  key: string;
  ts: number;
  moduleId?: string;
  questionIndex?: number;
  status: ActivityStatus;
  label: string;
};

const FREE_START_MODULES: { id: string; label: string }[] = [
  { id: "technische-berechnungen", label: "Technische Berechnungen" },
  { id: "technische-zeichnungen", label: "Technische Zeichnungen" },
  { id: "kraefte-drehmomente", label: "Kräfte & Drehmomente" },
];
const FREE_START_MODULE_IDS = new Set(FREE_START_MODULES.map((m) => m.id));

const DEFAULT_START_MODULE_ID = "technische-berechnungen";

// -----------------------------
// Fortschritt/Status (Dashboard)
// -----------------------------

type LearnStatusMap = Record<string, "correct" | "attempted" | string>;
type BoolMap = Record<string, boolean>;
type QualityMap = Record<string, "clean" | "assisted" | string>;

type ModuleProgressRow = {
  moduleId: string;
  lastTs: number;
  started: boolean;
  completed: boolean;

  // Learn/Prep: aus progress/checked/quality
  total: number; // wir nutzen "Run-Größe" als Default (25) und sichern gegen kleine Maps ab
  correct: number;
  wrong: number;
  help: number;
  percent: number;
};

type DashboardProgressSummary = {
  professionId: string;
  totalModules: number;
  completedModules: number;
  startedModules: number;
  rows: ModuleProgressRow[];

  active?: ModuleProgressRow;
  others: ModuleProgressRow[]; // Top 3 weitere angefangene
  totals: { correct: number; wrong: number; help: number };
};

type ExamScope = "AP1" | "AP2";
const DASHBOARD_EXAM_SCOPE_KEY = "lp:dashboard:examScope:v1";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function isExamScope(value: unknown): value is ExamScope {
  return value === "AP1" || value === "AP2";
}

function isRelevantForScope(exam: ExamRelevance | undefined, scope: ExamScope) {
  if (!exam) return true;
  if (exam === "AP1_AP2") return true;
  return exam === scope;
}

function filterModuleIdsByExamScope(params: {
  moduleIds: string[];
  professionId?: string;
  scope: ExamScope;
}) {
  const { moduleIds, professionId, scope } = params;
  if (!professionId || !isProfessionId(professionId)) return moduleIds;
  return moduleIds.filter((moduleId) => {
    const exam = getModuleRelevanceForModule(professionId, moduleId)?.exam;
    return isRelevantForScope(exam ?? undefined, scope);
  });
}

function pickExamStartModuleId(params: {
  moduleIds: string[];
  activeModuleId?: string;
  scope: ExamScope;
}) {
  const { moduleIds, activeModuleId, scope } = params;
  if (!moduleIds.length) return activeModuleId;

  const available = new Set(moduleIds);
  if (activeModuleId && available.has(activeModuleId)) return activeModuleId;

  const preferred =
    scope === "AP1"
      ? ["ap1-rechen-fachaufgaben", "ap1-arbeitsaufgaben"]
      : ["ap2-systemaufgaben", "ap2-situationsaufgaben"];

  for (const id of preferred) {
    if (available.has(id)) return id;
  }

  return moduleIds[0];
}

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return safeParseJSON<T>(raw);
  } catch {
    return null;
  }
}

const LEARN_META_KEYS = new Set([
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

function getLearnAnswerKeys(progress: LearnStatusMap) {
  return Object.keys(progress).filter((k) => !LEARN_META_KEYS.has(k));
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

function getScopedLearnAnswerKeys(progress: LearnStatusMap | null, onlyQuestionIds: Set<string> | null): string[] {
  if (!progress) return [];
  const keys = getLearnAnswerKeys(progress);
  if (!onlyQuestionIds) return keys;
  return keys.filter((k) => onlyQuestionIds.has(k));
}

function countCorrect(progress: LearnStatusMap | null, onlyQuestionIds: Set<string> | null) {
  if (!progress) return 0;
  let n = 0;
  for (const k of getScopedLearnAnswerKeys(progress, onlyQuestionIds)) if (progress[k] === "correct") n += 1;
  return n;
}

function countWrong(progress: LearnStatusMap | null, checked: BoolMap | null, onlyQuestionIds: Set<string> | null) {
  if (!checked) return 0;
  let n = 0;
  for (const qid of Object.keys(checked)) {
    if (onlyQuestionIds && !onlyQuestionIds.has(qid)) continue;
    if (!checked[qid]) continue;
    if (progress?.[qid] === "correct") continue;
    n += 1;
  }
  return n;
}

function countHelp(progress: LearnStatusMap | null, quality: QualityMap | null, onlyQuestionIds: Set<string> | null) {
  if (!quality) return 0;
  let n = 0;
  for (const qid of Object.keys(quality)) {
    if (onlyQuestionIds && !onlyQuestionIds.has(qid)) continue;
    if (quality[qid] !== "assisted") continue;
    if (progress?.[qid] === "correct") n += 1;
  }
  return n;
}

function computeModuleRow(moduleId: string, lastTs: number): ModuleProgressRow {
  // Unterstützt sowohl neue ":"-Keys als auch alte "."-Keys (Fallback)
  const progress =
    readLS<LearnStatusMap>(`lp:learn:progress:${moduleId}`) ??
    readLS<LearnStatusMap>(`lp.learn.progress.${moduleId}`);

  const checked =
    readLS<BoolMap>(`lp:learn:checked:${moduleId}`) ??
    readLS<BoolMap>(`lp.learn.checked.${moduleId}`);

  const quality =
    readLS<QualityMap>(`lp:learn:firstCorrectQuality:${moduleId}`) ??
    readLS<QualityMap>(`lp.learn.firstCorrectQuality.${moduleId}`);

  // Aktuelle 25 Aufgaben-IDs aus dem Lernmodus (sorgt für Konsistenz mit "Bearbeitet X von 25")
  const rawQuestionIds =
    readLS<unknown>(`lp:learn:qids:${moduleId}`) ??
    readLS<unknown>(`lp.learn.qids.${moduleId}`);
  const questionIds = normalizeStoredQuestionIds(rawQuestionIds);
  const onlyQuestionIds = questionIds.length ? new Set(questionIds) : null;

  // Default "Run-Größe" (25 Aufgaben)
  const mapSize = getScopedLearnAnswerKeys(progress, onlyQuestionIds).length;
  const total = onlyQuestionIds?.size ? onlyQuestionIds.size : Math.max(25, mapSize);

  const correct = countCorrect(progress, onlyQuestionIds);
  const wrong = countWrong(progress, checked, onlyQuestionIds);
  const help = countHelp(progress, quality, onlyQuestionIds);

  const percent = Math.round(clamp01(total > 0 ? correct / total : 0) * 100);

  // "started": sobald irgendeine Learn-Map existiert oder ein Run existiert
  const hasRun = (() => {
    try {
      return Boolean(localStorage.getItem(`lp:run:${moduleId}`) ?? localStorage.getItem(`lp.run.${moduleId}`));
    } catch {
      return false;
    }
  })();

  const started = hasRun || mapSize > 0 || correct > 0 || wrong > 0 || help > 0;

  // "completed": alle Aufgaben korrekt
  const completed = total > 0 && correct >= total;

  return { moduleId, lastTs, started, completed, total, correct, wrong, help, percent };
}

function buildProgressSummary(args: {
  professionId: string;
  moduleIds: string[];
  moduleLastTs: Record<string, number>;
}): DashboardProgressSummary {
  const { professionId, moduleIds, moduleLastTs } = args;

  const rows: ModuleProgressRow[] = moduleIds.map((id) => computeModuleRow(id, moduleLastTs[id] || 0));

  // Aktiv = neueste Aktivität (lastTs)
  const sortedByLast = [...rows].sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
  const active = sortedByLast.find((r) => r.started) || sortedByLast[0];

  const totalModules = moduleIds.length;
  const completedModules = rows.filter((r) => r.completed).length;
  const startedModules = rows.filter((r) => r.started && !r.completed).length;

  // Weitere angefangene (Top 3), ohne aktives Modul
  const others = sortedByLast
    .filter((r) => r.started && !r.completed && r.moduleId !== active?.moduleId)
    .slice(0, 3);

  const totals = rows.reduce(
    (acc, r) => {
      // "Richtig" ohne Hilfe: assisted-Correct wird separat als "help" geführt.
      acc.correct += Math.max(0, r.correct - r.help);
      acc.wrong += r.wrong;
      acc.help += r.help;
      return acc;
    },
    { correct: 0, wrong: 0, help: 0 }
  );

  return { professionId, totalModules, completedModules, startedModules, rows, active, others, totals };
}

const MODULE_TOKEN_LABELS: Record<string, string> = {
  ap1: "AP1",
  ap2: "AP2",
  arbeitsablaeufe: "Arbeitsabläufe",
  kraefte: "Kräfte",
  masse: "Maße",
  pruefen: "Prüfen",
  pruefmittel: "Prüfmittel",
  qualitaetsmaengel: "Qualitätsmängel",
  schaltplaene: "Schaltpläne",
  stoerungen: "Störungen",
  schaeden: "Schäden",
};

function titleWordFromSlugToken(token: string): string {
  const lower = String(token ?? "").toLowerCase();
  const mapped = MODULE_TOKEN_LABELS[lower];
  if (mapped) return mapped;
  if (!lower) return "";
  return lower[0].toUpperCase() + lower.slice(1);
}


function prettyModule(moduleId?: string) {
  if (!moduleId) return "Letzte Aktivität";
  const out = moduleId
    .split(/[\/._-]+/g)
    .filter(Boolean)
    .map((p) => titleWordFromSlugToken(p))
    .join(" ");
  return out || "Letzte Aktivität";
}

function inferFromKey(key: string): { moduleId?: string; questionIndex?: number } {
    // NEU: Doppelpunkt-Keys unterstützen
  if (key.startsWith("lp:run:")) {
    return { moduleId: key.slice("lp:run:".length) };
  }
  if (key.startsWith("lp:learn:progress:")) {
    return { moduleId: key.slice("lp:learn:progress:".length) };
  }
  if (key.startsWith("lp:learn:activity:")) {
    return { moduleId: key.slice("lp:learn:activity:".length) };
  }
  if (key.startsWith("lp:exam:history:")) {
    return { moduleId: key.slice("lp:exam:history:".length) };
  }
  
  const parts = key.split(".");
  const idxLearn = parts.indexOf("learn");
  if (idxLearn >= 0 && parts[idxLearn + 1]) return { moduleId: parts[idxLearn + 1] };

  const idxProgress = parts.indexOf("progress");
  if (idxProgress >= 0 && parts[idxProgress + 1]) return { moduleId: parts[idxProgress + 1] };

  const qMatch = key.match(/(?:q|question|aufgabe)[^\d]{0,3}(\d{1,3})/i);
  const q = qMatch ? Number(qMatch[1]) : undefined;

  const modMatch = key.match(/lp\.(?:module|learn|progress)\.([a-z0-9_-]+)/i);
  const mod = modMatch ? modMatch[1] : undefined;

  return { moduleId: mod, questionIndex: Number.isFinite(q as number) ? q : undefined };
}

function inferFromObj(obj: any): { ts: number; moduleId?: string; questionIndex?: number; status: ActivityStatus } {
  const ts = Number(obj?.ts ?? obj?.updatedAt ?? obj?.date ?? obj?.lastUpdated ?? 0) || 0;

  const moduleId =
    (typeof obj?.moduleId === "string" && obj.moduleId) ||
    (typeof obj?.module === "string" && obj.module) ||
    (typeof obj?.lessonId === "string" && obj.lessonId) ||
    undefined;

  const questionIndexRaw =
    obj?.questionIndex ??
    obj?.qIndex ??
    obj?.currentQuestionIndex ??
    obj?.activeQuestionIndex ??
    obj?.question ??
    obj?.activeQuestion ??
    undefined;

  const questionIndex =
    typeof questionIndexRaw === "number"
      ? questionIndexRaw
      : typeof questionIndexRaw === "string" && /^\d+$/.test(questionIndexRaw)
        ? Number(questionIndexRaw)
        : undefined;

  const statusRaw = obj?.status ?? obj?.result ?? obj?.state ?? obj?.practiceStatus ?? obj?.evaluation ?? obj?.outcome;
  const s = typeof statusRaw === "string" ? statusRaw.toLowerCase() : "";

  let status: ActivityStatus = "unknown";
  if (s.includes("help") || s.includes("mit") || s.includes("hint") || s.includes("solution")) status = "help";
  else if (s.includes("wrong") || s.includes("false") || s.includes("incorrect") || s.includes("falsch")) status = "wrong";
  else if (s.includes("done") || s.includes("correct") || s.includes("right") || s.includes("richtig") || s.includes("ok"))
    status = "done";
  else if (s.includes("progress") || s.includes("arbeit") || s.includes("in_progress") || s.includes("started"))
    status = "in_progress";

  const usedHelp =
    Boolean(obj?.usedHelp) ||
    Boolean(obj?.usedHint) ||
    Boolean(obj?.openedHint) ||
    Boolean(obj?.openedSolution) ||
    Boolean(obj?.openedExplain) ||
    Boolean(obj?.withHelp);

  const isCorrect = Boolean(obj?.correct) || Boolean(obj?.isCorrect);
  const isWrong = Boolean(obj?.wrong) || Boolean(obj?.isWrong);

  if (usedHelp) status = "help";
  else if (isCorrect) status = "done";
  else if (isWrong) status = "wrong";

  return { ts, moduleId, questionIndex, status };
}

function statusBadge(status: ActivityStatus) {
  switch (status) {
    case "done":
      return <Badge className="rounded-full">erledigt</Badge>;
    case "help":
      return (
        <Badge variant="secondary" className="rounded-full">
          mit Hilfe
        </Badge>
      );
    case "wrong":
      return (
        <Badge variant="destructive" className="rounded-full">
          falsch
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="rounded-full">
          in Arbeit
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="rounded-full">
          aktiv
        </Badge>
      );
  }
}

function formatRelative(ts: number, now: number) {
  if (!ts || !now) return "";
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "gestern";
  return `vor ${diffD} Tagen`;
}

function dayKey(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function computeStreak(daysSet: Set<string>, nowTs: number) {
  if (!nowTs || daysSet.size === 0) return 0;

  const today = new Date(nowTs);
  const todayKey = dayKey(today.getTime());

  const start = (() => {
    if (daysSet.has(todayKey)) return new Date(today);
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (daysSet.has(dayKey(y.getTime()))) return y;
    return null;
  })();

  if (!start) return 0;

  let streak = 0;
  const cursor = new Date(start);
  while (true) {
    const k = dayKey(cursor.getTime());
    if (!daysSet.has(k)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function planBadge(plan: Plan) {
  if (plan === "pro") return <Badge className="rounded-full">Pro</Badge>;
  return (
    <Badge variant="secondary" className="rounded-full">
      Free
    </Badge>
  );
}

function suggestedNextStep(opts: { hasActivity: boolean }) {
  if (!opts.hasActivity) return "Starte ein Modul. Dein Weiter-Punkt erscheint automatisch.";
  return "Mach dort weiter, wo du zuletzt aufgehört hast.";
}

function readActiveQuestionIndex(moduleId: string | undefined): number | undefined {
  if (!moduleId) return undefined;
  if (typeof window === "undefined") return undefined;

  const readNumber = (key: string): number | undefined => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
    } catch {
      return undefined;
    }
  };

  // Primär: normaler Übungsmodus ("all")
  const all = readNumber(`lp:learn:active:${moduleId}:all`);
  if (typeof all === "number") return all;

  // Fallback: evtl. ältere Punkt-Key-Variante
  const legacy = readNumber(`lp.learn.active.${moduleId}`);
  if (typeof legacy === "number") return legacy;

  // Fallback: Fehlertraining-Scopes (f:...)
  try {
    const prefix = `lp:learn:active:${moduleId}:f:`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const n = readNumber(k);
      if (typeof n === "number") return n;
    }
  } catch {
    // ignore
  }

  return undefined;
}


export default function DashboardClient() {
  const [mounted, setMounted] = React.useState(false);
  const [now, setNow] = React.useState(0);

  const [plan, setPlan] = React.useState<Plan>("free");
  const [displayName, setDisplayName] = React.useState("User");
  const [professionTitle, setProfessionTitle] = React.useState<string | null>(null);

  const [activities, setActivities] = React.useState<LpDecorated[]>([]);
  const [streak, setStreak] = React.useState(0);
  const [progressSummary, setProgressSummary] = React.useState<DashboardProgressSummary | null>(null);
  const [examScope, setExamScope] = React.useState<ExamScope>("AP1");

  const allRiskModuleIds =
    progressSummary?.professionId && isProfessionId(progressSummary.professionId)
      ? getAllowedModuleIdsForProfession(progressSummary.professionId)
      : FREE_START_MODULES.map((m) => m.id);

  const riskModuleIds = React.useMemo(() => {
    return filterModuleIdsByExamScope({
      moduleIds: allRiskModuleIds,
      professionId: progressSummary?.professionId,
      scope: examScope,
    });
  }, [allRiskModuleIds, progressSummary?.professionId, examScope]);

  const scopedTotals = React.useMemo(() => {
    if (!progressSummary?.rows?.length) return null;
    const includedIds = new Set(riskModuleIds);
    const totals = { correct: 0, wrong: 0, help: 0 };
    for (const row of progressSummary.rows) {
      if (!includedIds.has(row.moduleId)) continue;
      totals.correct += Math.max(0, row.correct - row.help);
      totals.wrong += row.wrong;
      totals.help += row.help;
    }
    return totals;
  }, [progressSummary?.rows, riskModuleIds]);

  const examStartModuleId = React.useMemo(() => {
    return pickExamStartModuleId({
      moduleIds: riskModuleIds,
      activeModuleId: progressSummary?.active?.moduleId,
      scope: examScope,
    });
  }, [riskModuleIds, progressSummary?.active?.moduleId, examScope]);

  const topActivity = activities[0];
  const topQuestionIndex = React.useMemo(() => {
    if (!topActivity?.moduleId) return undefined;
    if (typeof topActivity.questionIndex === "number" && topActivity.questionIndex >= 0) {
      return topActivity.questionIndex;
    }
    return readActiveQuestionIndex(topActivity.moduleId);
  }, [topActivity?.moduleId, topActivity?.questionIndex]);

  React.useEffect(() => {
    setMounted(true);

    let currentPlan: Plan = "free";
    try {
      currentPlan = getPlanClient();
      setPlan(currentPlan);
    } catch {
      setPlan("free");
    }

    const nowTs = Date.now();
    setNow(nowTs);

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("lp.") || k.startsWith("lp:")) keys.push(k);
      }

      const decoratedAll: LpDecorated[] = keys
        .map((k) => {
          const rawStr = localStorage.getItem(k) ?? "";
          const obj = safeParseJSON<any>(rawStr);

          const keyHints = inferFromKey(k);
          const objHints = obj
            ? inferFromObj(obj)
            : { ts: 0, moduleId: undefined, questionIndex: undefined, status: "unknown" as ActivityStatus };

          const ts = objHints.ts || 0;
          const moduleId = objHints.moduleId ?? keyHints.moduleId;
          const questionIndex = objHints.questionIndex ?? keyHints.questionIndex;
          const status = objHints.status;

          const showQuestion = Boolean(moduleId) && typeof questionIndex === "number" && questionIndex >= 0;
          const qLabel = showQuestion ? ` - Aufgabe ${questionIndex + 1}` : "";

          const action =
            status === "done"
              ? "abgeschlossen"
              : status === "help"
                ? "mit Hilfe bearbeitet"
                : status === "wrong"
                  ? "falsch beantwortet"
                  : status === "in_progress"
                    ? "in Arbeit"
                    : "aktualisiert";

          return {
            key: k,
            ts,
            moduleId,
            questionIndex: showQuestion ? questionIndex : undefined,
            status,
            label: `${prettyModule(moduleId)}${qLabel}: ${action}`,
          };
        })
        .sort((a, b) => (b.ts || 0) - (a.ts || 0));

      // Filter: nur sinnvoll (sonst wirkt es wie kaputte Logs)
      const decorated = decoratedAll.filter((x) => x.ts > 0 && Boolean(x.moduleId));

      setActivities(decorated.slice(0, 3));

          // ---- Dashboard Progress Summary (Module-Status/Prozent/Counts) ----
    try {
      const profile = getProfileClient();
      const professionId = (profile?.professionId || "industriemechaniker") as any;

      // Relevante Module für den Beruf, im Free-Plan auf die 3 Startmodule begrenzt.
      const allModuleIds = getAllowedModuleIdsForProfession(professionId);
      const moduleIds =
        currentPlan === "free"
          ? allModuleIds.filter((id) => FREE_START_MODULE_IDS.has(id))
          : allModuleIds;

      // lastTs pro Modul aus den bereits gelesenen lp.* Aktivitäten
      const moduleLastTs: Record<string, number> = {};
      for (const a of decoratedAll) {
        const mid = a.moduleId;
        if (!mid) continue;
        const ts = a.ts || 0;
        if (!moduleLastTs[mid] || ts > moduleLastTs[mid]) moduleLastTs[mid] = ts;
      }

      const summary = buildProgressSummary({ professionId: String(professionId), moduleIds, moduleLastTs });
      setProgressSummary(summary);
    } catch {
      setProgressSummary(null);
    }


      const daysSet = new Set(decorated.map((x) => dayKey(x.ts)));
      setStreak(computeStreak(daysSet, nowTs));
    } catch {
      setActivities([]);
      setStreak(0);
    }
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_EXAM_SCOPE_KEY);
      if (isExamScope(raw)) setExamScope(raw);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(DASHBOARD_EXAM_SCOPE_KEY, examScope);
    } catch {
      // ignore
    }
  }, [mounted, examScope]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadName() {
      const profile = getProfileClient();
      const fromProfile = (profile?.name || "").trim();

      const userRes = await getUser();
      const fromAuth = (userRes.ok ? (userRes.data?.name || "").trim() : "") || "";

      const finalName = fromProfile || fromAuth || "User";
      if (!cancelled) setDisplayName(finalName);
    }

    loadName();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const profile = getProfileClient();
    const pid = profile?.professionId;
    if (!pid) {
      setProfessionTitle(null);
      return;
    }
    const p = PROFESSIONS.find((x) => x.id === pid);
    setProfessionTitle(p?.title ?? null);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    trackExamCheckUpgradeSuccessIfEligible(plan);
  }, [mounted, plan]);

  const greeting = React.useMemo(() => {
    if (!now) return "Willkommen";
    const h = new Date(now).getHours();
    if (h < 5) return "Noch wach";
    if (h < 12) return "Guten Morgen";
    if (h < 18) return "Guten Tag";
    return "Guten Abend";
  }, [now]);

  const hasActivity = activities.length > 0;

  const primary = React.useMemo(() => {
    const mod = topActivity?.moduleId;

    // Wenn es eine Aktivität gibt -> Weiterlernen
    if (mod) {
      return { href: `/learn/${encodeURIComponent(mod)}`, text: "Weiterlernen", kind: "learn" as const };
    }

    // Empty-State: direkt starten (nicht erst Modulübersicht)
    return { href: `/learn/${encodeURIComponent(DEFAULT_START_MODULE_ID)}`, text: "Jetzt starten", kind: "start" as const };
  }, [plan, topActivity?.moduleId]);

  const secondary = React.useMemo(() => {
    const mod = topActivity?.moduleId;
    if (plan === "pro" && mod) return { href: `/exam/${encodeURIComponent(mod)}`, text: "Exam starten" };
    return null;
  }, [plan, topActivity?.moduleId]);

  function onResetLocal() {
    const ok = window.confirm(
      "Lokale Lern-Daten wirklich zurücksetzen?\n\nDas löscht deinen Fortschritt auf diesem Gerät (MVP/localStorage)."
    );
    if (!ok) return;

    try {
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        // sowohl alte lp. als auch neue lp: Keys löschen
        if (k.startsWith("lp.") || k.startsWith("lp:")) toDelete.push(k);
      }
      toDelete.forEach((k) => localStorage.removeItem(k));
    } finally {
      window.location.reload();
    }
  }

  if (!mounted) return null;

    const showQualityTip =
      Boolean(progressSummary?.active) &&
      ((progressSummary?.active?.help ?? 0) > 0 ||
        (progressSummary?.active?.wrong ?? 0) > 0);

  const streakLabel = streak === 1 ? "1 Tag" : `${streak} Tage`;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* LINKS: Hauptführung */}
      <Card className="lp-accent-top border bg-transparent backdrop-blur md:col-span-2 lp-card-grad shadow-[0_2px_4px_rgba(0,0,0,0.06),0_10px_28px_rgba(15,23,42,0.08)] dark:border-white/10 dark:shadow-[0_6px_18px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.05)] max-md:-mt-3 max-md:mx-0 max-md:p-4 md:mx-0 md:w-auto md:max-w-none">
        <CardHeader className="space-y-2 max-md:pb-3 max-md:px-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base max-md:text-[15px] max-md:leading-snug">
                  {greeting}
                  {displayName ? `, ${displayName}` : ""}
                  {" "}
                  <span aria-hidden="true">&#128075;</span>
                </CardTitle>
                <span className="hidden md:inline-flex">{planBadge(plan)}</span>
              </div>

              {/* nur 1 Aussage - keine Doppeltexte */}
              <div className="text-sm text-muted-foreground max-md:text-xs max-md:leading-snug">
                {topActivity?.moduleId ? (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 leading-snug">
                      <span className="text-muted-foreground">Zuletzt:</span>
                      <span className="font-medium text-foreground">{prettyModule(topActivity.moduleId)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                      {typeof topQuestionIndex === "number" ? (
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-2 py-0.5 lp-card-grad-subtle">
                          Aufgabe {topQuestionIndex + 1}
                        </span>
                      ) : null}
                      {typeof topQuestionIndex === "number" ? <span aria-hidden>•</span> : null}
                      <span>{formatRelative(topActivity.ts, now)}</span>
                    </div>
                  </div>
                ) : (
                  <>Starte mit einem Modul - dein Weiter-Punkt erscheint automatisch.</>
                )}
              </div>

              
            </div>

            <Badge variant="outline" className="rounded-full hidden md:inline-flex">
              {streak > 0 ? streakLabel : "Heute zählt"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-md:pt-0 max-md:space-y-3 max-md:px-3">
          <div className="rounded-2xl border border-border/60 bg-transparent p-5 lp-card-grad max-md:px-4 max-md:py-3 max-md:-mt-6 max-md:-mx-4 dark:border-white/20 dark:shadow-[0_10px_24px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] dark:bg-gradient-to-b dark:from-white/10 dark:to-transparent">
            <div className="text-sm font-medium max-md:text-[15px] max-md:leading-snug">Dein nächster Schritt</div>
            <div className="mt-1.5 text-sm text-muted-foreground max-md:text-sm max-md:leading-snug">
              {suggestedNextStep({ hasActivity })}
            </div>

            <div className="flex flex-wrap gap-2 pt-3 max-md:mt-2 max-md:gap-2 max-md:pt-2 max-md:flex-nowrap">
              <Button asChild className="rounded-full ring-1 ring-primary/20 max-md:h-9 max-md:px-3 max-md:text-sm max-md:whitespace-nowrap">
                <Link href={primary.href}>{primary.text}</Link>
              </Button>

              {plan === "free" ? (
                <Button
                  variant="outline"
                  asChild
                  className="rounded-full max-md:h-9 max-md:px-3 max-md:text-sm max-md:whitespace-nowrap md:hidden"
                >
                  <Link href="/pricing">Pro freischalten</Link>
                </Button>
              ) : null}

              {secondary ? (
                <Button
                  variant="outline"
                  asChild
                  className="rounded-full max-md:h-9 max-md:px-3 max-md:text-sm max-md:whitespace-nowrap max-md:bg-transparent max-md:shadow-none max-md:border max-md:text-muted-foreground"
                >
                  <Link href={secondary.href}>{secondary.text}</Link>
                </Button>
              ) : null}
            </div>

            {/* Empty-State: sofortige Start-Auswahl (free modules) */}
            {!hasActivity ? (
              <div className="pt-3 max-md:mt-2 max-md:pt-2">
                <div className="text-xs text-muted-foreground max-md:leading-snug">Schnellstart</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FREE_START_MODULES.map((m) => (
                    <Button key={m.id} variant="outline" asChild className="rounded-full max-md:h-9 max-md:px-4 max-md:text-sm">
                      <Link href={`/learn/${encodeURIComponent(m.id)}`}>{m.label}</Link>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* sekundär als Links */}
            <div className="pt-3 text-xs text-muted-foreground max-md:mt-2 max-md:pt-2 max-md:text-xs max-md:leading-tight max-md:flex max-md:items-center max-md:justify-between max-md:gap-2">
              <Link className="hover:underline" href="/module">
                Module
              </Link>
              <span className="mx-2 max-md:hidden">·</span>
              <Link className="hover:underline max-md:text-center" href="/results">
                Ergebnisse
              </Link>
              {plan === "free" ? (
                <>
                  <span className="mx-2 max-md:hidden">·</span>
                  <Link className="hover:underline max-md:hidden" href="/pricing">
                    Pro freischalten
                  </Link>
                </>
              ) : null}
              <span className="mx-2 max-md:hidden">·</span>
              <button type="button" onClick={onResetLocal} className="hover:underline max-md:text-right">
                Neu starten
              </button>
            </div>
          </div>

          {/* PRO-Block: Prüfungsfokus (nur Pro) */}
          {plan === "pro" ? (
            <div className="rounded-2xl border border-border/40 bg-transparent p-5 lp-card-grad max-md:p-2 max-md:px-4 max-md:-mx-4 dark:border-white/20 dark:shadow-[0_10px_24px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] dark:bg-gradient-to-b dark:from-white/10 dark:to-transparent">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="lp-title max-md:text-[15px] max-md:leading-snug">{`Prüfungsfokus (${examScope})`}</div>
                  <p className="lp-muted mt-1 max-md:text-sm max-md:leading-snug max-md:hidden">
                    Trainiere jetzt realistisch - ohne Hilfe, wie in der Prüfung.
                  </p>
                </div>

                <div className="inline-flex rounded-full border border-border/40 bg-transparent p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setExamScope("AP1")}
                    className={`rounded-full px-2.5 py-1 transition-colors ${
                      examScope === "AP1" ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                    aria-pressed={examScope === "AP1"}
                  >
                    AP1
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamScope("AP2")}
                    className={`rounded-full px-2.5 py-1 transition-colors ${
                      examScope === "AP2" ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                    aria-pressed={examScope === "AP2"}
                  >
                    AP2
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 max-md:hidden">
                <div className="rounded-xl border border-border/40 bg-transparent p-4 lp-card-grad-subtle">
                  <div className="text-sm font-medium max-md:hidden">Dein nächster Schritt</div>
                  <p className="mt-1 text-sm text-muted-foreground max-md:text-sm max-md:leading-snug">
                    Starte 1 Prüfungsrun ohne Hilfe. Ziel: sauberer Ablauf, nicht Tempo.
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-transparent p-4 lp-card-grad-subtle">
                  <div className="text-sm font-medium max-md:text-[15px] max-md:leading-snug">Tipp</div>
                  <p className="mt-1 text-sm text-muted-foreground max-md:text-sm max-md:leading-snug">
                    Wenn du hängen bleibst: erst markieren, weiterrechnen - am Ende prüfen.
                  </p>
                </div>
              </div>

                <div className="mt-4 flex flex-wrap gap-2 max-md:mt-3 max-md:gap-2">
                  {examStartModuleId ? (
                    <>
                      <Button asChild className="rounded-full max-md:h-9 max-md:px-4 max-md:text-sm">
                        <Link href={`/exam/${examStartModuleId}`}>
                          Neue Prüfung starten
                        </Link>
                      </Button>

                      <Button asChild variant="outline" className="rounded-full max-md:h-9 max-md:px-4 max-md:text-sm max-md:hidden">
                        <Link href={`/results/${examStartModuleId}`}>
                          Prüfungshistorie
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Kein aktives Modul vorhanden.
                    </span>
                  )}
                </div>

            </div>
          ) : null}



          {/* Free -> Upsell ruhig, konkret */}
          {plan === "free" ? (
            <div className="rounded-2xl border border-border/60 bg-transparent p-4 lp-card-grad-subtle max-md:px-4 max-md:py-3 max-md:-mx-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium max-md:text-[15px] max-md:leading-snug">Mit Pro trainierst du prüfungsnah</div>
                  <div className="mt-1 text-sm text-muted-foreground max-md:text-sm max-md:leading-snug">
                    Exam-Modus (ohne Hilfe, realistische Bewertung) + KI-Erklärungen, wenn du festhängst.
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full">
                  Pro
                </Badge>
              </div>
              <div className="pt-3">
                <Button asChild variant="outline" className="rounded-full max-md:h-9 max-md:px-4 max-md:text-sm">
                  <Link href="/pricing">Pro ansehen</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* RECHTS: Status - sinnvoll auch im leeren Zustand */}
      <Card className="lp-accent-top border bg-transparent backdrop-blur lp-card-grad-subtle shadow-[0_8px_18px_-18px_rgba(15,23,42,0.08)] dark:border-white/10 dark:shadow-[0_6px_18px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)] max-md:mx-0 max-md:py-4 max-md:gap-4">
        <CardHeader className="space-y-2 max-md:space-y-1 max-md:pb-2 max-md:px-4">
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 max-md:space-y-2 max-md:px-4">
          {progressSummary?.active ? (
          <div className="rounded-2xl border border-border/60 bg-transparent p-3 lp-card-grad-subtle max-md:p-2 max-md:-mt-5">
            <div className="text-sm font-medium">Aktives Modul</div>

            <div className="mt-1 flex items-start justify-between gap-3 max-md:mt-0.5">
              <div className="min-w-0">
                <div className="truncate text-sm">
                  {prettyModule(progressSummary.active.moduleId)}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {progressSummary.active.percent > 0
                    ? `${progressSummary.active.percent}% abgeschlossen`
                    : "begonnen"}{" "}
                  · zuletzt {formatRelative(progressSummary.active.lastTs, now)}
                </div>
              </div>

              <Badge variant="outline" className="rounded-full text-foreground/65 bg-transparent">
                {progressSummary.active.percent}%
              </Badge>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-xs max-md:mt-1 max-md:gap-1">
              <div className="rounded-xl border border-border/60 bg-transparent p-2 lp-card-grad-subtle max-md:p-1.5">
                <div className="text-muted-foreground">Richtig</div>
                <div className="mt-0.5 font-semibold">{Math.max(0, progressSummary.active.correct - progressSummary.active.help)}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-transparent p-2 lp-card-grad-subtle max-md:p-1.5">
                <div className="text-muted-foreground">Mit Hilfe</div>
                <div className="mt-0.5 font-semibold">{progressSummary.active.help}</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-transparent p-2 lp-card-grad-subtle max-md:p-1.5">
                <div className="text-muted-foreground">Falsch</div>
                <div className="mt-0.5 font-semibold">{progressSummary.active.wrong}</div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-border/60 bg-transparent p-2 text-xs lp-card-grad-subtle max-md:mt-2 max-md:p-1.5">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-muted-foreground whitespace-nowrap"
                  title="Ein Modul gilt als abgeschlossen, wenn alle Aufgaben korrekt gelöst wurden (100%)."
                >
                  Abgeschlossen (100%)
                </span>

                <span className="font-semibold whitespace-nowrap">
                  {progressSummary.completedModules} von {progressSummary.totalModules}
                </span>
              </div>
            </div>



            {progressSummary.others.length ? (
              <div className="mt-3 max-md:mt-2">
                <div className="text-xs font-semibold text-muted-foreground">Weitere angefangene</div>
                <ul className="mt-2 space-y-2 max-md:mt-1 max-md:space-y-1">
                  {progressSummary.others.map((m) => (
                    <li key={m.moduleId} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs">{prettyModule(m.moduleId)}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {m.percent > 0 ? `${m.percent}%` : "begonnen"} · zuletzt {formatRelative(m.lastTs, now)}
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full text-[11px]">
                        {m.percent}%
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {!progressSummary?.active ? (
          activities.length === 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Noch nichts gespeichert. Starte eine Aufgabe - dann erscheinen hier automatisch deine letzten Schritte.
              </div>

              <div className="rounded-xl border border-border/60 bg-transparent p-3 text-xs text-muted-foreground lp-card-grad-subtle">
                Tipp: Starte heute mit <span className="text-foreground/90">2 Aufgaben</span>. Qualität vor Tempo.
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li key={a.key} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-foreground/90">{a.label}</div>
                    <div className="text-xs text-muted-foreground">{formatRelative(a.ts, now)}</div>
                  </div>
                  <div className="shrink-0">{statusBadge(a.status)}</div>
                </li>
              ))}
              </ul>
            )
          ) : null}

          {showQualityTip && (
            <div className="pt-2 text-xs text-muted-foreground">
              {plan === "free" ? (
                <>Hinweis: Ohne Hilfe üben stärkt deine Prüfungssicherheit.</>
              ) : (
                <>Pro-Hinweis: Ein wöchentlicher Exam-Run ohne Hilfe erhöht die Prüfungsroutine.</>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {plan === "free" ? <FreeExamCheckCardClient className="max-md:mx-0" /> : null}

      <ExamReadinessClient
        moduleIds={riskModuleIds}
        totals={plan === "pro" ? scopedTotals : null}
        disabled={plan !== "pro"}
        title={plan === "pro" ? `Prüfungsreife (${examScope})` : "Prüfungsreife"}
        className="max-md:mx-0"
      />

      {/* Pruefungsrisiken - Analyse (rein lesend) */}
      <ExamRiskWidgetClient
        moduleIds={riskModuleIds}
        disabled={plan !== "pro"}
        title={plan === "pro" ? `Prüfungsrisiken (${examScope})` : "Prüfungsrisiken"}
        className="max-md:mx-0"
      />

    </div>
  );
}
