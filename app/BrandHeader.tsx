"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import ThemeToggle from "./theme-toggle";
import BrandLogo from "./BrandLogo";
import { navigateHome } from "./home-navigation";
import { Button } from "@/components/ui/button";

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

export default function BrandHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const canGoBack = useSyncExternalStore(
    subscribeCanGoBack,
    getCanGoBackSnapshot,
    () => false
  );

  const homeHref = "/";
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);
  const showBack = Boolean(pathname && pathname !== "/" && pathname !== "/dashboard" && canGoBack);

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    const currentKey =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search + window.location.hash
        : homeHref;

    navigateHome(router, pathname, currentKey, homeHref);
  };

  return (
    <header
      data-scroll-header
      className="fixed inset-x-0 top-0 z-50 w-full border-b border-border/60 bg-background shadow-[0_10px_28px_-24px_rgba(0,0,0,0.9)] backdrop-blur-none md:shadow-none"
    >
      <div className="mx-auto grid h-[calc(3.5rem+env(safe-area-inset-top))] max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 pt-[env(safe-area-inset-top)] md:h-16 md:px-6 md:pt-0">
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

        <div className="flex items-center justify-center">
          <Link
            href={homeHref}
            aria-label="Zur Uebersicht"
            className="flex items-center"
            onClick={handleHomeClick}
          >
            <BrandLogo variant="word" />
          </Link>
          <span className="sr-only">{pageTitle}</span>
        </div>

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