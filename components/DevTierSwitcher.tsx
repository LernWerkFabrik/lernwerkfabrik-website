"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@/lib/entitlements";
import { getPlanClient, setDevForcedPlan } from "@/lib/entitlements";

type Mode = "off" | Plan;
type AuthMode = "guest" | "authed";

const AUTH_KEYS = ["lp.auth.v1", "lp_auth_user"];
const PLAN_KEYS = ["lp.plan.v1", "DEV_FORCE_PLAN"];
const PANEL_COLLAPSE_KEY = "DEV_PANEL_COLLAPSED";
const DEV_PLAN_COOKIE = "lp_dev_plan";

function isAuthedClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (const k of AUTH_KEYS) {
      const v = window.localStorage.getItem(k);
      if (v) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function clearLocalStorageKeys(keys: string[]) {
  if (typeof window === "undefined") return;
  try {
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

function setDevPlanCookie(mode: Mode) {
  if (typeof document === "undefined") return;

  if (mode === "pro" || mode === "free") {
    document.cookie = `${DEV_PLAN_COOKIE}=${mode}; Path=/; Max-Age=2592000; SameSite=Lax`;
    return;
  }

  document.cookie = `${DEV_PLAN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function DevTierSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("off");
  const [currentPlan, setCurrentPlan] = useState<Plan>("free"); // placeholder bis mounted
  const [authMode, setAuthMode] = useState<AuthMode>("guest");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);

    // nach mount: currentPlan sicher lesen
    setCurrentPlan(getPlanClient());
    setAuthMode(isAuthedClient() ? "authed" : "guest");

    // Anzeigezustand (override oder off)
    try {
      const forced = window.localStorage.getItem("DEV_FORCE_PLAN");
      if (forced === "free" || forced === "pro") setMode(forced);
      else setMode("off");
    } catch {
      setMode("off");
    }

    try {
      setCollapsed(window.localStorage.getItem(PANEL_COLLAPSE_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  // Nur im dev rendern (im prod gar nicht)
  if (process.env.NODE_ENV !== "development") return null;

  function apply(next: Mode) {
    setMode(next);

    if (next === "off") setDevForcedPlan(null);
    else setDevForcedPlan(next);
    setDevPlanCookie(next);

    location.reload();
  }

  function applyGuest() {
    // Wichtig: Plan-Override aus + Auth/Plan-Spuren entfernen
    setMode("off");
    setDevForcedPlan(null);
    setDevPlanCookie("off");

    clearLocalStorageKeys([...AUTH_KEYS, ...PLAN_KEYS]);

    location.reload();
  }

  function toggleCollapsed(next: boolean) {
    setCollapsed(next);
    try {
      window.localStorage.setItem(PANEL_COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  const showPlan = mounted ? currentPlan : "…";
  const showAuth = mounted ? authMode : "…";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => toggleCollapsed(false)}
        className="fixed bottom-4 right-4 z-[1000] rounded-full border bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow-lg hover:bg-muted"
        title="Dev Panel aufklappen"
      >
        Dev Plan
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[1000] rounded-xl border bg-background/90 backdrop-blur p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
          Dev Plan
        </div>
        <button
          type="button"
          onClick={() => toggleCollapsed(true)}
          className="rounded border px-1.5 py-0.5 text-[11px] leading-none opacity-80 hover:bg-muted"
          title="Dev Panel einklappen"
        >
          _
        </button>
      </div>

      <div className="mb-2 text-xs opacity-70">
        plan: <span className="font-semibold">{showPlan}</span>
        {mounted && mode !== "off" ? (
          <span className="ml-2 opacity-70">(override)</span>
        ) : null}
      </div>

      <div className="mb-3 text-xs opacity-70">
        auth: <span className="font-semibold">{showAuth}</span>
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => apply("free")}
          className={`px-2 py-1 text-xs rounded border ${
            mode === "free"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          free
        </button>

        <button
          onClick={() => apply("pro")}
          className={`px-2 py-1 text-xs rounded border ${
            mode === "pro"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          pro
        </button>

        <button
          onClick={() => apply("off")}
          className={`px-2 py-1 text-xs rounded border ${
            mode === "off"
              ? "bg-secondary text-secondary-foreground"
              : "hover:bg-muted"
          }`}
        >
          off
        </button>

        <button
          onClick={applyGuest}
          className="px-2 py-1 text-xs rounded border hover:bg-muted"
          title="Auth + Plan-Keys löschen (Gastmodus)"
        >
          guest
        </button>
      </div>
    </div>
  );
}
