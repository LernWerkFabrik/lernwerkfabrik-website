// lib/entitlements.ts

export type Plan = "free" | "pro";
// Backward compat (falls irgendwo PlanId genutzt wird)
export type PlanId = Plan;

// Storage keys (MVP)
const LS_PLAN_KEY = "lp.plan.v1";
const LS_DEV_FORCE_PLAN_KEY = "DEV_FORCE_PLAN";

// Free-Module (MVP fix)
export const FREE_MODULE_IDS = new Set<string>([
  "technische-berechnungen",
  "technische-zeichnungen",
  "kraefte-drehmomente",
]);

function getDevForcedPlan(): Plan | null {
  if (typeof window === "undefined") return null;
  if (process.env.NODE_ENV !== "development") return null;

  try {
    const forced = localStorage.getItem(LS_DEV_FORCE_PLAN_KEY);
    if (forced === "free" || forced === "pro") return forced;
  } catch {}
  return null;
}

/**
 * ✅ DEV ONLY: Plan override setzen (oder entfernen)
 */
export function setDevForcedPlan(plan: Plan | null) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "development") return;

  try {
    if (!plan) localStorage.removeItem(LS_DEV_FORCE_PLAN_KEY);
    else localStorage.setItem(LS_DEV_FORCE_PLAN_KEY, plan);
  } catch {}
}

/**
 * Client: Plan bestimmen (MVP via localStorage)
 * Default: "free"
 */
export function getPlanClient(): Plan {
  const forced = getDevForcedPlan();
  if (forced) return forced;

  if (typeof window === "undefined") return "free";

  try {
    const raw = localStorage.getItem(LS_PLAN_KEY);
    if (raw === "free" || raw === "pro") return raw;
  } catch {}

  return "free";
}

export function setPlanClient(plan: Plan) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PLAN_KEY, plan);
  } catch {}
}

/**
 * Zentrale Entscheidung: darf dieses Modul gestartet werden?
 */
export function canAccessModule(plan: Plan, moduleId: string): boolean {
  if (plan === "pro") return true;
  return FREE_MODULE_IDS.has(moduleId);
}

/**
 * Exam ist immer Pro
 */
export function canAccessExam(plan: Plan): boolean {
  return plan === "pro";
}
