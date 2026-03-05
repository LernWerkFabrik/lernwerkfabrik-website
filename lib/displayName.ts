const LS_USERS_KEY = "lp.users.v1";
const LS_SESSION_KEY = "lp.auth.v1";

export const DISPLAY_NAME_MIN_LENGTH = 3;
export const DISPLAY_NAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_MAX_CHANGES = 3;
export const DISPLAY_NAME_CHANGE_COOLDOWN_DAYS = 30;

const DISPLAY_NAME_ALLOWED_RE = /^[a-z0-9._]+$/;
const DISPLAY_NAME_SEPARATOR_CHAIN_RE = /[._]{2,}/;

const BLOCKED_DISPLAY_NAME_TERMS = [
  "admin",
  "administrator",
  "support",
  "official",
  "lernwerkfabrik",
  "fuck",
  "shit",
  "bitch",
  "nazi",
  "hitler",
  "hurensohn",
  "arschloch",
] as const;

type StoredUserLike = {
  email?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

export type StoredUserMapLike = Record<string, StoredUserLike>;

type SessionLike = {
  user?: {
    email?: string;
    name?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type DisplayNameChangePolicyResult =
  | {
      allowed: true;
      remainingChanges: number;
      nextAllowedAt: null;
    }
  | {
      allowed: false;
      reason: string;
      remainingChanges: number;
      nextAllowedAt: string | null;
    };

export function normalizeDisplayNameInput(raw: string): string {
  return raw.trim().toLowerCase();
}

function stripDiacritics(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

export function sanitizeDisplayNameSeed(raw: string): string {
  const lowered = stripDiacritics(raw).toLowerCase();
  const replaced = lowered.replace(/[^a-z0-9._]+/g, ".");
  const collapsed = replaced
    .replace(DISPLAY_NAME_SEPARATOR_CHAIN_RE, ".")
    .replace(/^[._]+|[._]+$/g, "");

  return collapsed.slice(0, DISPLAY_NAME_MAX_LENGTH);
}

export function validateDisplayName(input: string): string | null {
  const value = normalizeDisplayNameInput(input);

  if (!value) return "Anzeigename ist erforderlich.";
  if (value.length < DISPLAY_NAME_MIN_LENGTH || value.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Anzeigename muss zwischen ${DISPLAY_NAME_MIN_LENGTH} und ${DISPLAY_NAME_MAX_LENGTH} Zeichen haben.`;
  }
  if (!DISPLAY_NAME_ALLOWED_RE.test(value)) {
    return "Erlaubt sind nur Kleinbuchstaben, Zahlen, Punkt und Unterstrich.";
  }
  if (value.startsWith(".") || value.startsWith("_") || value.endsWith(".") || value.endsWith("_")) {
    return "Anzeigename darf nicht mit Punkt oder Unterstrich beginnen/enden.";
  }
  if (DISPLAY_NAME_SEPARATOR_CHAIN_RE.test(value)) {
    return "Bitte keine Zeichenketten wie '..' oder '__' verwenden.";
  }
  if (BLOCKED_DISPLAY_NAME_TERMS.some((term) => value.includes(term))) {
    return "Anzeigename enthält einen nicht erlaubten Begriff.";
  }

  return null;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStoredUsersClient(): StoredUserMapLike {
  if (typeof window === "undefined") return {};
  const parsed = safeJsonParse<StoredUserMapLike>(window.localStorage.getItem(LS_USERS_KEY));
  return parsed ?? {};
}

function writeStoredUsersClient(users: StoredUserMapLike) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

export function isDisplayNameAvailable(
  displayName: string,
  users: StoredUserMapLike,
  excludeEmail?: string
): boolean {
  const normalized = normalizeDisplayNameInput(displayName);
  if (validateDisplayName(normalized)) return false;

  const excluded = excludeEmail?.trim().toLowerCase() ?? "";

  for (const [emailKey, entry] of Object.entries(users)) {
    if (!entry || typeof entry !== "object") continue;

    const userEmail = (entry.email ?? emailKey ?? "").trim().toLowerCase();
    if (excluded && userEmail === excluded) continue;

    const existing = normalizeDisplayNameInput(entry.name ?? "");
    if (existing && existing === normalized) return false;
  }

  return true;
}

export function isDisplayNameAvailableClient(displayName: string, excludeEmail?: string): boolean {
  return isDisplayNameAvailable(displayName, readStoredUsersClient(), excludeEmail);
}

function trimSeedToLength(seed: string, suffix: string): string {
  const maxBaseLength = Math.max(1, DISPLAY_NAME_MAX_LENGTH - suffix.length);
  return seed.slice(0, maxBaseLength).replace(/[._]+$/g, "");
}

export function suggestAvailableDisplayName(
  email: string,
  users: StoredUserMapLike,
  excludeEmail?: string
): string {
  const localPart = email.includes("@") ? email.split("@")[0] : email;
  let base = sanitizeDisplayNameSeed(localPart);

  if (base.length < DISPLAY_NAME_MIN_LENGTH) {
    base = "azubi";
  }

  if (base.length < DISPLAY_NAME_MIN_LENGTH) {
    base = "user123";
  }

  base = base.slice(0, DISPLAY_NAME_MAX_LENGTH);

  if (isDisplayNameAvailable(base, users, excludeEmail)) return base;

  for (let i = 1; i <= 9999; i += 1) {
    const suffix = `_${i}`;
    const candidate = `${trimSeedToLength(base, suffix)}${suffix}`;
    if (candidate.length < DISPLAY_NAME_MIN_LENGTH) continue;
    if (isDisplayNameAvailable(candidate, users, excludeEmail)) return candidate;
  }

  const fallbackSuffix = `_${Date.now().toString().slice(-4)}`;
  const fallback = `${trimSeedToLength(base, fallbackSuffix)}${fallbackSuffix}`;
  if (fallback.length >= DISPLAY_NAME_MIN_LENGTH && validateDisplayName(fallback) === null) {
    return fallback;
  }

  return "user123";
}

export function suggestDisplayNameClient(email: string, excludeEmail?: string): string {
  return suggestAvailableDisplayName(email, readStoredUsersClient(), excludeEmail);
}

export function syncDisplayNameForEmailClient(email: string, displayName: string) {
  if (typeof window === "undefined") return;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDisplayName = normalizeDisplayNameInput(displayName);
  if (!normalizedEmail || !normalizedDisplayName) return;

  const users = readStoredUsersClient();

  let usersChanged = false;

  if (users[normalizedEmail] && typeof users[normalizedEmail] === "object") {
    users[normalizedEmail] = {
      ...users[normalizedEmail],
      name: normalizedDisplayName,
    };
    usersChanged = true;
  } else {
    for (const [key, entry] of Object.entries(users)) {
      if (!entry || typeof entry !== "object") continue;
      const candidateEmail = (entry.email ?? key ?? "").trim().toLowerCase();
      if (candidateEmail !== normalizedEmail) continue;
      users[key] = { ...entry, name: normalizedDisplayName };
      usersChanged = true;
      break;
    }
  }

  if (usersChanged) writeStoredUsersClient(users);

  const session = safeJsonParse<SessionLike>(window.localStorage.getItem(LS_SESSION_KEY));
  if (!session?.user || typeof session.user.email !== "string") return;

  if (session.user.email.trim().toLowerCase() !== normalizedEmail) return;

  window.localStorage.setItem(
    LS_SESSION_KEY,
    JSON.stringify({
      ...session,
      user: {
        ...session.user,
        name: normalizedDisplayName,
      },
    })
  );
}

export function evaluateDisplayNameChangePolicy(meta: {
  displayNameChangeCount?: number;
  displayNameLastChangedAt?: string;
}): DisplayNameChangePolicyResult {
  const changeCountRaw = meta.displayNameChangeCount;
  const changeCount =
    typeof changeCountRaw === "number" && Number.isFinite(changeCountRaw)
      ? Math.max(0, Math.trunc(changeCountRaw))
      : 0;

  const remainingChanges = Math.max(0, DISPLAY_NAME_MAX_CHANGES - changeCount);
  if (changeCount >= DISPLAY_NAME_MAX_CHANGES) {
    return {
      allowed: false,
      reason: `Anzeigename kann maximal ${DISPLAY_NAME_MAX_CHANGES} Mal geändert werden.`,
      remainingChanges: 0,
      nextAllowedAt: null,
    };
  }

  if (!meta.displayNameLastChangedAt) {
    return {
      allowed: true,
      remainingChanges,
      nextAllowedAt: null,
    };
  }

  const lastChangedMs = Date.parse(meta.displayNameLastChangedAt);
  if (!Number.isFinite(lastChangedMs)) {
    return {
      allowed: true,
      remainingChanges,
      nextAllowedAt: null,
    };
  }

  const cooldownMs = DISPLAY_NAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const nextAllowedMs = lastChangedMs + cooldownMs;
  if (Date.now() >= nextAllowedMs) {
    return {
      allowed: true,
      remainingChanges,
      nextAllowedAt: null,
    };
  }

  const remainingDays = Math.ceil((nextAllowedMs - Date.now()) / (24 * 60 * 60 * 1000));
  return {
    allowed: false,
    reason: `Anzeigename kann erst in ${remainingDays} Tagen erneut geändert werden.`,
    remainingChanges,
    nextAllowedAt: new Date(nextAllowedMs).toISOString(),
  };
}
