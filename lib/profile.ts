// lib/profile.ts
/**
 * User Profile (Domain Layer)
 * ---------------------------
 * - KEINE Auth-Logik
 * - KEINE Cookies
 * - KEIN Login-State
 *
 * Verantwortlich nur für:
 * - Profil-Daten (Beruf, Name, Präferenzen)
 * - lokal im MVP (später DB / Supabase)
 */

export type ProfessionId =
  | "industriemechaniker"
  | "mechatroniker"
  | "elektroniker"
  | "zerspanungsmechaniker"
  | "maschinenanlagenfuehrer";

export type UserProfile = {
  name?: string;
  email?: string;
  professionId?: ProfessionId;
  createdAt?: string;
  displayNameLastChangedAt?: string;
  displayNameChangeCount?: number;
  firstName?: string;
  lastName?: string;
  trainingYear?: "1" | "2" | "3" | "4";
  company?: string;
  organizationName?: string;
  teamName?: string;
  emailVerified?: boolean;
  membershipKind?: "subscription" | "one_time";
  membershipPriceLabel?: string;
  membershipStartedAt?: string;
  nextBillingAt?: string;
  accessEndsAt?: string;
};

export const PROFESSIONS: Array<{
  id: ProfessionId;
  title: string;
  subtitle?: string;
}> = [
  {
    id: "industriemechaniker",
    title: "Industriemechaniker/in",
    subtitle: "IHK – Rahmenplan 2018 (Start-Beruf)",
  },
  {
    id: "mechatroniker",
    title: "Mechatroniker/in",
  },
  {
    id: "elektroniker",
    title: "Elektroniker/in",
  },
  {
    id: "zerspanungsmechaniker",
    title: "Zerspanungsmechaniker/in",
  },
  {
    id: "maschinenanlagenfuehrer",
    title: "Maschinen- & Anlagenführer/in",
  },
];

const LS_PROFILE_KEY = "lp.profile.v1";

/**
 * Read profile from localStorage (MVP only).
 * Safe to call in browser components.
 */
export function getProfileClient(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LS_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Persist profile to localStorage (MVP only).
 * Later replaced by DB persistence.
 */
export function setProfileClient(profile: UserProfile) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore write errors in MVP
  }
}

/**
 * Clear profile (e.g. on logout).
 * Auth logout itself is handled by Auth Adapter.
 */
export function clearProfileClient() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_PROFILE_KEY);
}
