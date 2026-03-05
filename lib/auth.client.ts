// lib/auth.client.ts

export type Plan = "free" | "pro";
export type AccessTier = "guest" | "free" | "pro";

export const AUTH_COOKIE = "lp_auth_v1";

/**
 * Cookie-basierter Presence-Check (Client).
 * - akzeptiert:
 *   - legacy: lp_auth_v1=1
 *   - neu:    lp_auth_v1=<base64url-json>
 */
export function isAuthedClientByCookie(): boolean {
  if (typeof document === "undefined") return false;

  return document.cookie
    .split(";")
    .map((s) => s.trim())
    .some((p) => p.startsWith(`${AUTH_COOKIE}=`));
}

/**
 * Best-effort: "bin ich im Browser eingeloggt?"
 * (Für UI-Gates / Teaser. Harte Gates bitte weiterhin serverseitig via getSession/DashboardGate.)
 */
export function isAuthedClient(): boolean {
  if (typeof window === "undefined") return false;

  // 1) Cookie presence (neuer Adapter)
  if (isAuthedClientByCookie()) return true;

  // 2) legacy localStorage (alte MVP-Variante)
  try {
    if (window.localStorage.getItem("lp.auth.v1")) return true;
    if (window.localStorage.getItem("lp_auth_user")) return true;
  } catch {
    // ignore
  }

  return false;
}

/**
 * Plan aus localStorage (MVP) + DEV override.
 * Quelle: lib/entitlements.ts (getPlanClient) — aber wir bilden hier bewusst ein robustes Fallback,
 * damit auth.client.ts eigenständig kompatibel bleibt.
 */
export function getPlanClient(): Plan {
  if (typeof window === "undefined") return "free";

  // DEV override (dein Switcher setzt DEV_FORCE_PLAN)
  if (process.env.NODE_ENV === "development") {
    try {
      const forced = window.localStorage.getItem("DEV_FORCE_PLAN");
      if (forced === "free" || forced === "pro") return forced;
    } catch {
      // ignore
    }
  }

  // Normaler Plan (MVP)
  try {
    const raw = window.localStorage.getItem("lp.plan.v1");
    return raw === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

/**
 * Convenience: Pro?
 */
export function isProClient(): boolean {
  return getPlanClient() === "pro";
}

/**
 * Optional: Tier aus Authed + Plan ableiten (für Stellen, die guest/free/pro brauchen).
 * - guest: nicht authed
 * - free : authed + plan free
 * - pro  : authed + plan pro
 */
export function getAccessTierClient(): AccessTier {
  if (!isAuthedClient()) return "guest";
  return isProClient() ? "pro" : "free";
}

/**
 * Hard-reset der Session-Artefakte im Browser (für Dev/Logout).
 */
export function clearAuthClientArtifacts() {
  if (typeof window === "undefined") return;

  try {
    // Provider/local session
    window.localStorage.removeItem("lp.auth.v1");
    // legacy (falls vorhanden)
    window.localStorage.removeItem("lp_auth_user");
  } catch {
    // ignore
  }

  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}
