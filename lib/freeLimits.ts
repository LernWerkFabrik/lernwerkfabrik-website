// lib/freeLimits.ts

export const FREE_ALLOWED_LEARN_IDS = [
  "technische-berechnungen",
  "technische-zeichnungen",
  "kraefte-drehmomente",
] as const;

export type FreeAllowedLearnId = (typeof FREE_ALLOWED_LEARN_IDS)[number];

export const FREE_MAX_RUNS_PER_MODULE = 5;

const STORAGE_KEY = "lwf.freeRuns.v1";

type RunsMap = Record<string, number>;

function safeRead(): RunsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as RunsMap;
  } catch {
    return {};
  }
}

function safeWrite(map: RunsMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota / privacy mode
  }
}

export function isFreeAllowedLearnModule(moduleId: string): moduleId is FreeAllowedLearnId {
  return (FREE_ALLOWED_LEARN_IDS as readonly string[]).includes(moduleId);
}

export function getFreeRunsUsed(moduleId: string): number {
  const map = safeRead();
  const v = map[moduleId];
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

export function getFreeRunsRemaining(moduleId: string): number {
  const used = getFreeRunsUsed(moduleId);
  return Math.max(0, FREE_MAX_RUNS_PER_MODULE - used);
}

export function canStartFreeRun(moduleId: string): boolean {
  if (!isFreeAllowedLearnModule(moduleId)) return false;
  return getFreeRunsRemaining(moduleId) > 0;
}

export function getFreeLimitInfo(moduleId: string): {
  allowed: boolean;
  used: number;
  remaining: number;
  max: number;
} {
  const allowed = isFreeAllowedLearnModule(moduleId);
  const used = getFreeRunsUsed(moduleId);
  const remaining = allowed ? getFreeRunsRemaining(moduleId) : 0;
  return { allowed, used, remaining, max: FREE_MAX_RUNS_PER_MODULE };
}

/**
 * Verbraucht 1 Run (nur Free).
 * Call genau dann, wenn ein neuer Learn-Run gestartet wird:
 * - beim allerersten Start eines Moduls (Run existiert noch nicht)
 * - bei "Neue Aufgaben" (neuer Seed)
 */
export function consumeFreeRun(moduleId: string): { ok: boolean; remaining: number; used: number } {
  if (!isFreeAllowedLearnModule(moduleId)) {
    return { ok: false, remaining: 0, used: getFreeRunsUsed(moduleId) };
  }

  const map = safeRead();
  const used = getFreeRunsUsed(moduleId);

  if (used >= FREE_MAX_RUNS_PER_MODULE) {
    return { ok: false, remaining: 0, used };
  }

  const nextUsed = used + 1;
  map[moduleId] = nextUsed;
  safeWrite(map);

  return {
    ok: true,
    remaining: Math.max(0, FREE_MAX_RUNS_PER_MODULE - nextUsed),
    used: nextUsed,
  };
}

/**
 * Optional: Reset nur für Entwicklung/Support
 */
export function resetFreeRuns(moduleId?: string) {
  const map = safeRead();
  if (!moduleId) {
    safeWrite({});
    return;
  }
  delete map[moduleId];
  safeWrite(map);
}
