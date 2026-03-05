"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProBadge() {
  return (
    <Badge className="rounded-full" variant="outline">
      PRO
    </Badge>
  );
}

export function LockedOverlay({
  title = "Pro-Funktion",
  description = "In der Pro-Version verfügbar.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="absolute inset-0 rounded-2xl bg-background/70 backdrop-blur-sm">
      <div className="absolute inset-0 rounded-2xl border" />
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
        <Button size="sm" className="rounded-full" asChild>
          <Link href="/pricing">Upgrade</Link>
        </Button>
      </div>
    </div>
  );
}

