// app/DashboardGate.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * DashboardGate
 * -------------
 * - schützt Dashboard & Unterseiten
 * - nutzt ausschließlich den Auth-Adapter
 * - KEINE Cookie- oder localStorage-Zugriffe
 * - deterministisch: kein Flicker, kein Redirect-Loop
 */

function safeRedirectTarget(pathname: string | null): string {
  const p = (pathname || "").trim();
  if (!p.startsWith("/")) return "/dashboard";
  if (p.startsWith("/login") || p.startsWith("/signup")) return "/dashboard";
  if (p.startsWith("/logout")) return "/dashboard";
  return p || "/dashboard";
}

export default function DashboardGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * status:
   * - "checking" → initial
   * - "authed"   → render children
   * - "redirect" → redirect läuft (kein weiteres Rendern)
   */
  const [status, setStatus] = React.useState<
    "checking" | "authed" | "redirect"
  >("checking");

  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      const res = await getSession();

      if (!res.ok || !res.data) {
        if (cancelled) return;

        setStatus("redirect");

        const target = safeRedirectTarget(pathname);
        router.replace(`/login?redirect=${encodeURIComponent(target)}`);
        return;
      }

      if (!cancelled) {
        setStatus("authed");
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  // Kein Flicker, kein falsches Rendern
  if (status !== "authed") return null;

  return <>{children}</>;
}
