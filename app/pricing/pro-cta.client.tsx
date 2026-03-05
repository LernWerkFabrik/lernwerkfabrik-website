"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getPlanClient } from "@/lib/entitlements";
import type { Plan } from "@/lib/entitlements";

export default function ProCtaClient() {
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState<Plan>("free"); // stabiler Default fürs erste Rendern

  useEffect(() => {
    setMounted(true);
    setPlan(getPlanClient());
  }, []);

  // Erst nach Mount entscheiden -> kein SSR/Client mismatch
  const isPro = mounted && plan === "pro";

  if (isPro) {
    return (
      <div className="space-y-2.5">
        <div className="rounded-xl border border-border/60 bg-background/40 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Dein aktueller Plan
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            Pro – 9,90 € / Monat
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Nächste Abrechnung: im Abo-Portal
          </div>
          <div className="text-xs text-muted-foreground">
            Abo · monatlich kündbar
          </div>
        </div>

        <Button variant="outline" asChild className="w-full rounded-full">
          <Link href="/pricing">Abo verwalten</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-center text-xs text-muted-foreground/90">
        Nach der Freischaltung kannst du sofort trainieren.
      </p>
      <Button asChild className="w-full rounded-full">
        <Link href="/pricing">Pro freischalten & trainieren</Link>
      </Button>
    </div>
  );
}

