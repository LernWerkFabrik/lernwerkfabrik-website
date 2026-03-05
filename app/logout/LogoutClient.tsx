// app/logout/LogoutClient.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { signOut } from "@/lib/auth";
import { clearProfileClient } from "@/lib/profile";
import { clearAuthClientArtifacts } from "@/lib/auth.client";

/**
 * /logout (GET Page)
 * ------------------
 * - triggert echten Logout
 * - optional: ?reset=1 => Erstbesuch simulieren (Profil + Session weg)
 * - optional: ?redirect=/irgendwo
 */
export default function LogoutClient() {
  const router = useRouter();
  const sp = useSearchParams();

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      const reset = sp.get("reset") === "1";
      const redirect = sp.get("redirect") || "/";

      // 1) Server-Cookie löschen (API Route)
      try {
        await fetch("/api/logout", { method: "POST" });
      } catch {
        // ignore
      }

      // 2) Provider logout (local: LS + ggf. Cookie)
      await signOut();

      // 3) Extra/Legacy Cleanup
      clearAuthClientArtifacts();

      // 4) Optional: Erstbesuch simulieren (Profil löschen)
      if (reset) {
        clearProfileClient();
      }

      if (cancelled) return;

      router.replace(redirect);
      router.refresh();
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  return null;
}
