// lib/runStorage.ts

export type RunState = {
  seed: number;
  createdAt: number;
  updatedAt: number; // ✅ wichtig fürs Dashboard (letzte Aktivität)
};

export type PracticeRunSummary = {
  id: string;
  moduleId: string;

  startedAt: number;
  finishedAt: number;

  seed: number;

  total: number; // z.B. 25
  correct: number;
  assisted: number;
  wrong: number;

  // Optional (nice-to-have)
  notes?: string;
};

const KEY_PREFIX = "lp:run:";
const PRACTICE_HISTORY_PREFIX = "lp:practiceRuns:";
const PRACTICE_HISTORY_LIMIT = 50;

function safeParse(raw: string | null): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeNow() {
  return Date.now();
}

function randomId() {
  // ausreichend unique für localStorage
  return `${safeNow().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Wird beim Start eines Moduls aufgerufen.
 * ✅ Aktualisiert automatisch updatedAt, damit Dashboard "Weiterlernen" erkennt.
 * ✅ Backward-compatible: alte Runs ohne updatedAt werden migriert.
 */
export function getOrCreateRun(moduleId: string): RunState {
  const key = `${KEY_PREFIX}${moduleId}`;
  const now = safeNow();

  try {
    const raw = localStorage.getItem(key);
    const parsed = safeParse(raw);

    if (parsed && typeof parsed === "object") {
      const createdAt =
        typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt)
          ? parsed.createdAt
          : now;

      const seed =
        typeof parsed.seed === "number" && Number.isFinite(parsed.seed)
          ? parsed.seed
          : Math.floor(Math.random() * 1_000_000_000);

      // ✅ Migration + Touch
      const run: RunState = {
        seed,
        createdAt,
        updatedAt: now,
      };

      try {
        localStorage.setItem(key, JSON.stringify(run));
      } catch {}

      return run;
    }
  } catch {}

  // Neu anlegen
  const run: RunState = {
    seed: Math.floor(Math.random() * 1_000_000_000),
    createdAt: now,
    updatedAt: now,
  };

  try {
    localStorage.setItem(key, JSON.stringify(run));
  } catch {}

  return run;
}

/**
 * Optional: beim Beantworten aktiv "touch"en (für exakte Aktivität).
 */
export function touchRun(moduleId: string) {
  const key = `${KEY_PREFIX}${moduleId}`;
  const now = safeNow();

  try {
    const raw = localStorage.getItem(key);
    const parsed = safeParse(raw);

    if (parsed && typeof parsed === "object") {
      const createdAt =
        typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt)
          ? parsed.createdAt
          : now;

      const seed =
        typeof parsed.seed === "number" && Number.isFinite(parsed.seed)
          ? parsed.seed
          : Math.floor(Math.random() * 1_000_000_000);

      const run: RunState = { seed, createdAt, updatedAt: now };
      localStorage.setItem(key, JSON.stringify(run));
      return;
    }
  } catch {}

  // falls key nicht existiert
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        seed: Math.floor(Math.random() * 1_000_000_000),
        createdAt: now,
        updatedAt: now,
      })
    );
  } catch {}
}

export function resetRun(moduleId: string) {
  try {
    localStorage.removeItem(`${KEY_PREFIX}${moduleId}`);
  } catch {}
}

/* ------------------------------------------------------------------ */
/* ÜBUNGS-VERLAUF (History) */
/* ------------------------------------------------------------------ */

function historyKey(moduleId: string) {
  return `${PRACTICE_HISTORY_PREFIX}${moduleId}`;
}

export function listPracticeRuns(moduleId: string): PracticeRunSummary[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(historyKey(moduleId));
    const parsed = safeParse(raw);

    if (!Array.isArray(parsed)) return [];

    // Sanitizing
    const runs: PracticeRunSummary[] = parsed
      .filter((r) => r && typeof r === "object")
      .map((r) => ({
        id: typeof r.id === "string" ? r.id : randomId(),
        moduleId,
        startedAt: typeof r.startedAt === "number" ? r.startedAt : safeNow(),
        finishedAt: typeof r.finishedAt === "number" ? r.finishedAt : safeNow(),
        seed: typeof r.seed === "number" ? r.seed : 0,
        total: typeof r.total === "number" ? r.total : 25,
        correct: typeof r.correct === "number" ? r.correct : 0,
        assisted: typeof r.assisted === "number" ? r.assisted : 0,
        wrong: typeof r.wrong === "number" ? r.wrong : 0,
        notes: typeof r.notes === "string" ? r.notes : undefined,
      }));

    // newest first
    runs.sort((a, b) => b.finishedAt - a.finishedAt);
    return runs;
  } catch {
    return [];
  }
}

export function appendPracticeRun(
  moduleId: string,
  input: Omit<PracticeRunSummary, "id" | "moduleId">
): PracticeRunSummary | null {
  if (typeof window === "undefined") return null;

  const entry: PracticeRunSummary = {
    id: randomId(),
    moduleId,
    ...input,
  };

  try {
    const existing = listPracticeRuns(moduleId);
    const next = [entry, ...existing].slice(0, PRACTICE_HISTORY_LIMIT);
    window.localStorage.setItem(historyKey(moduleId), JSON.stringify(next));
    return entry;
  } catch {
    return null;
  }
}

export function clearPracticeRuns(moduleId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(historyKey(moduleId));
  } catch {}
}
