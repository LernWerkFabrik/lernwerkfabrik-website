// lib/auth/providers/local.ts
/**
 * Local MVP auth provider
 * - Stores session in BOTH:
 *   - Cookie: lp_auth_v1 (base64url JSON)
 *   - localStorage: lp.auth.v1 (JSON)
 *
 * - Stores users in localStorage (client-only):
 *   - lp.users.v1: { [emailLower]: { id, email, name, passwordHash, createdAt } }
 *
 * IMPORTANT:
 * - This module is imported into client bundles -> NO `node:*` imports/requires.
 * - Use WebCrypto + global Buffer (server) without importing node modules.
 */

import type {
  AppUser,
  AuthProvider,
  AuthResult,
  AuthSession,
  CookieStoreLike,
  SessionContext,
  SignInInput,
  SignUpInput,
} from "../provider";
import {
  isDisplayNameAvailable,
  normalizeDisplayNameInput,
  validateDisplayName,
} from "@/lib/displayName";

const AUTH_COOKIE = "lp_auth_v1";
const LS_SESSION = "lp.auth.v1";
const LS_USERS = "lp.users.v1";
const DEFAULT_SESSION_TTL_DAYS = 14;

type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  professionId?: string | null;
  plan?: "free" | "pro";
};

type StoredUserMap = Record<string, StoredUser>;

type StoredSession = {
  token: string;
  user: AppUser | null;
  expiresAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * base64url encode/decode without importing node modules.
 * - Browser: btoa/atob
 * - Server: global Buffer (available in Node) via globalThis.Buffer
 */
function base64UrlEncode(input: string): string {
  // Browser path
  if (typeof btoa === "function") {
    const b64 = btoa(unescape(encodeURIComponent(input)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  // Server path (Node): global Buffer
  const B = (globalThis as any).Buffer as
    | { from(data: string, enc: string): { toString(enc: string): string } }
    | undefined;

  if (B) {
    const b64 = B.from(input, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  // Very last resort
  throw new Error("Base64 encoding not supported in this environment.");
}

function base64UrlDecode(input: string): string {
  const padded =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4);

  // Browser path
  if (typeof atob === "function") {
    const str = atob(padded);
    return decodeURIComponent(escape(str));
  }

  // Server path (Node): global Buffer
  const B = (globalThis as any).Buffer as
    | { from(data: string, enc: string): { toString(enc: string): string } }
    | undefined;

  if (B) {
    return B.from(padded, "base64").toString("utf8");
  }

  // Very last resort
  throw new Error("Base64 decoding not supported in this environment.");
}

function getCookieFromDocument(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(
    new RegExp(
      "(^|;\\s*)" +
        name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "=([^;]*)"
    )
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookieClient(name: string, value: string, expiresAtIso: string) {
  if (!isBrowser()) return;
  const expires = new Date(expiresAtIso).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; Expires=${expires}; SameSite=Lax`;
}

function deleteCookieClient(name: string) {
  if (!isBrowser()) return;
  document.cookie = `${encodeURIComponent(
    name
  )}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function generateToken(): string {
  // Browser + Node (WebCrypto)
  const c: any = (globalThis as any).crypto;
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(24);
    c.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  if (typeof c?.randomUUID === "function") {
    return String(c.randomUUID()).replace(/-/g, "");
  }

  // last resort
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toAppUser(u: StoredUser): AppUser {
  const name = (u.name ?? "").trim() || "User";
  return {
    id: u.id,
    email: u.email,
    name,
    professionId: u.professionId ?? null,
    plan: u.plan ?? "free",
    createdAt: u.createdAt,
  };
}

async function sha256Hex(input: string): Promise<string> {
  // WebCrypto works in modern browsers and in Node runtimes used by Next (server)
  const c: any = (globalThis as any).crypto;
  if (!c?.subtle) {
    // last resort fallback (not cryptographically strong, but avoids hard failure)
    // Since this is MVP-local only, we prefer "works" over importing node crypto.
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
    return `fallback_${Math.abs(h)}`;
  }

  const data = new TextEncoder().encode(input);
  const hash = await c.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): StoredUserMap {
  if (!isBrowser()) return {};
  const parsed = safeJsonParse<StoredUserMap>(window.localStorage.getItem(LS_USERS));
  return parsed ?? {};
}

function writeUsers(users: StoredUserMap) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LS_USERS, JSON.stringify(users));
}

function readSessionFromLocalStorage(): StoredSession | null {
  if (!isBrowser()) return null;
  return safeJsonParse<StoredSession>(window.localStorage.getItem(LS_SESSION));
}

function writeSessionToLocalStorage(session: StoredSession) {
  if (!isBrowser()) return;
  window.localStorage.setItem(LS_SESSION, JSON.stringify(session));
}

function deleteSessionFromLocalStorage() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(LS_SESSION);
}

function encodeSessionCookie(session: StoredSession): string {
  const payload = JSON.stringify({
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt,
  });
  return base64UrlEncode(payload);
}

function decodeSessionCookie(value: string): StoredSession | null {
  try {
    const raw = base64UrlDecode(value);
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isExpired(expiresAtIso: string): boolean {
  const t = Date.parse(expiresAtIso);
  if (Number.isNaN(t)) return true;
  return t <= Date.now();
}

function readSessionFromCookiesServer(cookieStore: CookieStoreLike): StoredSession | null {
  const v = cookieStore.get(AUTH_COOKIE)?.value ?? null;
  if (!v) return null;
  const session = decodeSessionCookie(v);
  if (!session) return null;
  if (isExpired(session.expiresAt)) return null;
  return session;
}

function readSessionFromCookiesClient(): StoredSession | null {
  const v = getCookieFromDocument(AUTH_COOKIE);
  if (!v) return null;
  const session = decodeSessionCookie(v);
  if (!session) return null;
  if (isExpired(session.expiresAt)) return null;
  return session;
}

/**
 * Source-of-truth logic:
 * - Prefer cookie (works server + client)
 * - Fall back to localStorage (client)
 * - If both exist, cookie wins
 */
// --- ersetze NUR resolveSession(...) durch diese Version ---

async function resolveSession(ctx?: SessionContext): Promise<StoredSession | null> {
  // 1) Server: Cookie-only
  if (ctx && "cookies" in ctx && ctx.cookies) {
    const v = ctx.cookies.get(AUTH_COOKIE)?.value ?? null;
    if (!v) return null;

    // neues Format?
    const decoded = decodeSessionCookie(v);
    if (decoded && !isExpired(decoded.expiresAt)) return decoded;

    /**
     * Legacy-Cookie vorhanden, aber nicht unser Format:
     * => als "authed" akzeptieren (MVP-Regel), aber ohne User-Daten.
     * (User-Daten kommen beim nächsten Client-Render durch Migration.)
     */
    return {
      token: "legacy_cookie",
      user: null,
      expiresAt: addDaysIso(DEFAULT_SESSION_TTL_DAYS),
    };
  }

  // 2) Client: bevorzugt Cookie (neues Format)
  const fromCookie = readSessionFromCookiesClient();
  if (fromCookie) return fromCookie;

  // 3) Client: localStorage (neues Format)
  const fromLs = readSessionFromLocalStorage();
  if (fromLs && !isExpired(fromLs.expiresAt)) {
    // Cookie fehlt -> wiederherstellen
    setCookieClient(AUTH_COOKIE, encodeSessionCookie(fromLs), fromLs.expiresAt);
    return fromLs;
  }

  // 4) Client: Legacy-Bridge (MVP alt) -> migrieren ins neue Format
  if (!isBrowser()) return null;

  try {
    const [{ isAuthedClientByCookie }, profile] = await Promise.all([
      import("@/lib/auth.client"),
      import("@/lib/profile"),
    ]);

    // Legacy LocalStorage Auth (meist richer, weil Profil)
    const legacy = (profile as any).getAuthClient?.();
    if (legacy) {
      const user: AppUser = {
        id: legacy.id ?? legacy.userId ?? "legacy_local",
        email: legacy.email ?? "unknown@example.com",
        name: legacy.name ?? legacy.firstName ?? "User",
        professionId: legacy.professionId ?? legacy.profession ?? null,
        plan: legacy.plan ?? "free",
        createdAt: legacy.createdAt,
      };

      const migrated: StoredSession = {
        token: generateToken(),
        user,
        expiresAt: addDaysIso(DEFAULT_SESSION_TTL_DAYS),
      };

      await persistSessionClient(migrated);
      return migrated;
    }

    // Legacy Cookie Auth (ohne Profil)
    if (typeof isAuthedClientByCookie === "function" && isAuthedClientByCookie()) {
      const migrated: StoredSession = {
        token: generateToken(),
        user: null,
        expiresAt: addDaysIso(DEFAULT_SESSION_TTL_DAYS),
      };

      await persistSessionClient(migrated);
      return migrated;
    }
  } catch {
    // Falls die Legacy-Module nicht importierbar sind, einfach "not authed".
  }

  return null;
}


async function persistSessionClient(session: StoredSession) {
  writeSessionToLocalStorage(session);
  setCookieClient(AUTH_COOKIE, encodeSessionCookie(session), session.expiresAt);
}

export const localAuthProvider: AuthProvider = {
  id: "local",

  async getSession(ctx?: SessionContext): Promise<AuthResult<AuthSession | null>> {
    const stored = await resolveSession(ctx);
    if (!stored) return { ok: true, data: null };

    const session: AuthSession = {
      provider: "local",
      token: stored.token,
      user: stored.user ?? null,
      expiresAt: stored.expiresAt,
    };

    return { ok: true, data: session };
  },

  async getUser(ctx?: SessionContext): Promise<AuthResult<AppUser | null>> {
    const res = await this.getSession(ctx);
    if (!res.ok) return res;
    return { ok: true, data: res.data?.user ?? null };
  },

  async signUp(input: SignUpInput): Promise<AuthResult<AuthSession>> {
    if (!isBrowser()) {
      return { ok: false, error: "Sign up is only supported in the browser for MVP auth." };
    }

    const email = input.email.trim().toLowerCase();
    const name = normalizeDisplayNameInput(input.name);
    const password = input.password;

    if (!email || !password || !name) return { ok: false, error: "Bitte fülle alle Felder aus." };
    if (!email.includes("@")) return { ok: false, error: "Bitte gib eine gültige E-Mail an." };
    if (password.length < 6) return { ok: false, error: "Passwort muss mindestens 6 Zeichen haben." };

    const users = readUsers();
    if (users[email]) {
      return { ok: false, error: "E-Mail ist bereits registriert." };
    }
    const displayNameError = validateDisplayName(name);
    if (displayNameError) {
      return { ok: false, error: displayNameError };
    }
    if (!isDisplayNameAvailable(name, users)) {
      return { ok: false, error: "Anzeigename ist bereits vergeben." };
    }

    const id = generateToken();
    const createdAt = nowIso();
    const passwordHash = await sha256Hex(password);

    const storedUser: StoredUser = {
      id,
      email,
      name,
      passwordHash,
      createdAt,
      plan: "free",
      professionId: null,
    };

    users[email] = storedUser;
    writeUsers(users);

    // Auto sign-in after sign-up
    const user = toAppUser(storedUser);
    const sessionStored: StoredSession = {
      token: generateToken(),
      user,
      expiresAt: addDaysIso(DEFAULT_SESSION_TTL_DAYS),
    };

    await persistSessionClient(sessionStored);

    return {
      ok: true,
      data: {
        provider: "local",
        token: sessionStored.token,
        user,
        expiresAt: sessionStored.expiresAt,
      },
    };
  },

  async signIn(input: SignInInput): Promise<AuthResult<AuthSession>> {
    if (!isBrowser()) {
      return { ok: false, error: "Sign in is only supported in the browser for MVP auth." };
    }

    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!email || !password) return { ok: false, error: "Bitte fülle alle Felder aus." };

    const users = readUsers();
    const u = users[email];
    if (!u) return { ok: false, error: "E-Mail oder Passwort ist falsch." };

    const passwordHash = await sha256Hex(password);
    if (passwordHash !== u.passwordHash) {
      return { ok: false, error: "E-Mail oder Passwort ist falsch." };
    }

    const user = toAppUser(u);

    const sessionStored: StoredSession = {
      token: generateToken(),
      user,
      expiresAt: addDaysIso(DEFAULT_SESSION_TTL_DAYS),
    };

    await persistSessionClient(sessionStored);

    return {
      ok: true,
      data: {
        provider: "local",
        token: sessionStored.token,
        user,
        expiresAt: sessionStored.expiresAt,
      },
    };
  },

  async signOut(): Promise<AuthResult<true>> {
    if (isBrowser()) {
      deleteSessionFromLocalStorage();
      deleteCookieClient(AUTH_COOKIE);
      return { ok: true, data: true };
    }

    // Server can't clear browser cookies here; signOut is client-driven.
    return { ok: true, data: true };
  },
};
