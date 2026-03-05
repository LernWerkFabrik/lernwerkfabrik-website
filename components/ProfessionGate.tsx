"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { getSession } from "@/lib/auth";
import { getProfileClient } from "@/lib/profile";

/**
 * ProfessionGate
 * --------------
 * - Auth = Session (Adapter)
 * - Profession = Profile (Domain, MVP localStorage)
 */
export default function ProfessionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      const sessionRes = await getSession();

      // Nicht eingeloggt → DashboardGate/Login-Flow kümmert sich
      if (!sessionRes.ok || !sessionRes.data) {
        if (!cancelled) setReady(true);
        return;
      }

      const profile = getProfileClient();
      const hasProfession = !!profile?.professionId;

      if (!hasProfession) {
        const target =
          pathname && pathname.startsWith("/") ? pathname : "/dashboard";
        router.replace(
          `/onboarding/profession?redirect=${encodeURIComponent(target)}`
        );
        router.refresh();
        return;
      }

      if (!cancelled) setReady(true);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
