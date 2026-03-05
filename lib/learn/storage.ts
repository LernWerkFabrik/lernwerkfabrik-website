// lib/learn/storage.ts

export function learnKeys(moduleId: string) {
  return {
    progress: `lp:learn:progress:${moduleId}`,
    drafts: `lp:learn:drafts:${moduleId}`,
    checked: `lp:learn:checked:${moduleId}`,
    dirty: `lp:learn:dirty:${moduleId}`,
    attempts: `lp:learn:attempts:${moduleId}`,
    solutionSeen: `lp:learn:solutionSeen:${moduleId}`,
    firstCorrectQuality: `lp:learn:firstCorrectQuality:${moduleId}`,
  } as const;
}

/**
 * Diese Helper sind optional (nicht-breaking).
 * Vorteil: überall gleiches Handling von JSON + Timestamp,
 * wodurch Dashboard "Letzte Aktivität" & Streak zuverlässiger werden.
 */

export function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    return safeParseJSON<T>(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function writeJSON<T extends Record<string, any>>(
  key: string,
  value: T,
  opts?: { touch?: boolean }
): void {
  if (typeof window === "undefined") return;

  const touch = opts?.touch !== false;

  const payload = touch
    ? {
        ...value,
        // beide Felder, damit verschiedene Reader (Dashboard/Legacy) es finden
        ts: typeof value.ts === "number" ? value.ts : Date.now(),
        updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : Date.now(),
      }
    : value;

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota / privacy mode
  }
}

/**
 * Minimaler "Ping" für Aktivität:
 * - liest vorhandenes Objekt (falls JSON)
 * - schreibt es zurück mit frischem ts/updatedAt
 */
export function touchKey(key: string): void {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(key);
    const obj = safeParseJSON<Record<string, any>>(raw);

    if (obj && typeof obj === "object") {
      writeJSON(key, obj, { touch: true });
      return;
    }

    // Falls kein JSON: setze ein kleines Activity-Objekt
    writeJSON(
      key,
      {
        kind: "touch",
      },
      { touch: true }
    );
  } catch {
    // ignore
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}
