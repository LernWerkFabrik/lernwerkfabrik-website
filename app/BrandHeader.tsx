"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import ThemeToggle from "./theme-toggle";
import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";
import { getPlanClient, type Plan } from "@/lib/entitlements";

function subscribeCanGoBack(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("popstate", handler);
  window.addEventListener("hashchange", handler);
  return () => {
    window.removeEventListener("popstate", handler);
    window.removeEventListener("hashchange", handler);
  };
}

function getCanGoBackSnapshot() {
  if (typeof window === "undefined") return false;
  return window.history.length > 1;
}

function subscribePlan(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (!event.key || event.key === "lp.plan.v1" || event.key === "DEV_FORCE_PLAN") {
      onStoreChange();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * BrandHeader (final)
 * -------------------
 * - Fokus auf Marke + Navigation
 * - Logo-Link ist "App-Home": authed -> /dashboard, sonst -> /
 * - Ruhig, professionell, produktionsreif
 */
export default function BrandHeader({ authed }: { authed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const canGoBack = useSyncExternalStore(
    subscribeCanGoBack,
    getCanGoBackSnapshot,
    () => false
  );
  useSyncExternalStore<Plan>(
    subscribePlan,
    () => (authed ? getPlanClient() : "free"),
    () => "free"
  );

  const homeHref = authed ? "/dashboard" : "/";
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const showBack = Boolean(
    pathname &&
      pathname !== "/" &&
      pathname !== "/dashboard" &&
      canGoBack
  );

  return (
    <header
      data-scroll-header
      className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/60 backdrop-blur"
    >
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 md:h-16 md:px-6">
        {/* LEFT - Back (mobile) or Brand */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Zurück"
              className="h-10 w-10"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {/* CENTER - Branding */}
        <div className="flex items-center justify-center">
          <Link
            href={homeHref}
            aria-label="Zur Uebersicht"
            className="flex items-center"
          >
            {authed ? (
              <BrandLogo variant="mark" className="scale-90" />
            ) : (
              <BrandLogo variant="word" />
            )}
          </Link>
          <span className="sr-only">{pageTitle}</span>
        </div>

        {/* RIGHT - Tools */}
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle
            className="border-transparent bg-transparent shadow-none"
            buttonClassName="h-10 w-10"
          />
        </div>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string | null) {
  if (!pathname) return "LernWerkFabrik";
  if (pathname === "/") return "Start";
  if (pathname.startsWith("/dashboard/profil")) return "Profil";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/inhalte")) return "Inhalte";
  if (pathname.startsWith("/module")) return "Module";
  if (pathname.startsWith("/learn")) return "Lernmodus";
  if (pathname.startsWith("/exam")) return "Prüfung";
  if (pathname.startsWith("/results")) return "Auswertung";
  if (pathname.startsWith("/pricing")) return "Preise";
  if (pathname.startsWith("/login")) return "Login";
  if (pathname.startsWith("/signup")) return "Registrieren";
  if (pathname.startsWith("/onboarding")) return "Profil";
  if (pathname.startsWith("/business")) return "Business";
  if (pathname.startsWith("/terms")) return "AGB";
  if (pathname.startsWith("/impressum")) return "Impressum";
  if (pathname.startsWith("/datenschutz")) return "Datenschutz";
  if (pathname.startsWith("/cookies")) return "Cookies";
  if (pathname.startsWith("/transparency")) return "Transparenz";
  return "LernWerkFabrik";
}
