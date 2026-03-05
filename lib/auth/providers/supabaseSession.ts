import type { Session, User } from "@supabase/supabase-js";

import type { AppUser, AuthSession } from "../provider";

export const SUPABASE_SESSION_COOKIE = "lp_sb_session";

export type StoredSupabaseSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AppUser | null;
};

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function base64UrlEncode(input: string): string {
  if (typeof btoa === "function") {
    const b64 = btoa(unescape(encodeURIComponent(input)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  const B = (globalThis as { Buffer?: { from(data: string, enc: string): { toString(enc: string): string } } })
    .Buffer;
  if (!B) throw new Error("Base64 encoding is unavailable in this runtime.");

  const b64 = B.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
  const padded =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((input.length + 3) % 4);

  if (typeof atob === "function") {
    const str = atob(padded);
    return decodeURIComponent(escape(str));
  }

  const B = (globalThis as { Buffer?: { from(data: string, enc: string): { toString(enc: string): string } } })
    .Buffer;
  if (!B) throw new Error("Base64 decoding is unavailable in this runtime.");

  return B.from(padded, "base64").toString("utf8");
}

function expiresAtIsoFromSession(session: Session): string {
  if (typeof session.expires_at === "number" && Number.isFinite(session.expires_at)) {
    return new Date(session.expires_at * 1000).toISOString();
  }
  if (typeof session.expires_in === "number" && Number.isFinite(session.expires_in)) {
    return new Date(Date.now() + session.expires_in * 1000).toISOString();
  }
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

function fallbackNameFromEmail(email: string): string {
  if (!email.includes("@")) return "user";
  return email.split("@")[0] || "user";
}

export function toAppUserFromSupabaseUser(
  user: User,
  overrideDisplayName?: string | null
): AppUser {
  const email = user.email ?? "";
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metadataDisplayName =
    typeof metadata.display_name === "string" ? metadata.display_name : null;

  const displayName =
    (overrideDisplayName ?? "").trim() ||
    (metadataDisplayName ?? "").trim() ||
    fallbackNameFromEmail(email);

  return {
    id: user.id,
    email,
    name: displayName,
    createdAt: user.created_at,
    plan: "free",
  };
}

export function toStoredSupabaseSession(
  session: Session,
  overrideDisplayName?: string | null
): StoredSupabaseSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: expiresAtIsoFromSession(session),
    user: session.user ? toAppUserFromSupabaseUser(session.user, overrideDisplayName) : null,
  };
}

export function encodeStoredSupabaseSession(session: StoredSupabaseSession): string {
  return base64UrlEncode(JSON.stringify(session));
}

export function decodeStoredSupabaseSession(value: string): StoredSupabaseSession | null {
  try {
    const parsed = safeParseJson<StoredSupabaseSession>(base64UrlDecode(value));
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isSupabaseSessionExpired(expiresAt: string): boolean {
  const ms = Date.parse(expiresAt);
  if (!Number.isFinite(ms)) return true;
  return ms <= Date.now();
}

export function toAuthSession(session: StoredSupabaseSession): AuthSession {
  return {
    provider: "supabase",
    token: session.accessToken,
    user: session.user,
    expiresAt: session.expiresAt,
  };
}
