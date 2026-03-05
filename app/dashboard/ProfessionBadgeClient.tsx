"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

import { getProfileClient, PROFESSIONS } from "@/lib/profile";
import { getPlanClient, type Plan } from "@/lib/entitlements";

/**
 * ProfessionBadgeClient
 * ---------------------
 * - zeigt gewählte Profession aus Domain-Profil (MVP localStorage)
 * - optional: Mobile-Meta (Plan + Streak) neben dem Chip
 */

type Props = {
  showMeta?: boolean;
};

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function computeStreak(daysSet: Set<string>, nowTs: number) {
  if (!daysSet.size) return 0;
  const today = new Date(nowTs);
  const todayKey = dayKey(today.getTime());
  const start = (() => {
    if (daysSet.has(todayKey)) return new Date(today);
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    if (daysSet.has(dayKey(y.getTime()))) return y;
    return null;
  })();
  if (!start) return 0;
  let streak = 0;
  const cursor = new Date(start);
  while (true) {
    const k = dayKey(cursor.getTime());
    if (!daysSet.has(k)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function ProfessionBadgeClient({ showMeta = false }: Props) {
  const [professionTitle, setProfessionTitle] = React.useState<string | null>(
    null
  );
  const [plan, setPlan] = React.useState<Plan>("free");
  const [streak, setStreak] = React.useState(0);

  React.useEffect(() => {
    const profile = getProfileClient();
    const pid = profile?.professionId;

    if (!pid) {
      setProfessionTitle(null);
      return;
    }

    const p = PROFESSIONS.find((x) => x.id === pid);
    setProfessionTitle(p?.title ?? null);
  }, []);

  React.useEffect(() => {
    if (!showMeta) return;
    setPlan(getPlanClient());

    try {
      const daysSet = new Set<string>();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith("lp:") && !k.startsWith("lp.")) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const obj = JSON.parse(raw) as any;
          const ts = Number(obj?.ts ?? obj?.updatedAt ?? obj?.date ?? obj?.lastUpdated ?? 0) || 0;
          if (ts > 0) daysSet.add(dayKey(ts));
        } catch {
          // ignore
        }
      }
      setStreak(computeStreak(daysSet, Date.now()));
    } catch {
      setStreak(0);
    }
  }, [showMeta]);

  if (!professionTitle) return null;

  const streakLabel = streak === 1 ? "1 Tag" : `${streak} Tage`;
  const moduleCardBadgeClass =
    "rounded-full max-md:text-sm max-md:px-3 max-md:py-1 border border-border/60 lp-card-panel-weak lp-surface-grad lp-module-chip-grad dark:bg-card/30 shadow-none";

  if (!showMeta) {
    return (
      <Badge
        variant="outline"
        className={moduleCardBadgeClass}
      >
        {professionTitle}
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 max-md:mt-1 max-md:mb-2">
      <Badge
        variant="outline"
        className={moduleCardBadgeClass}
      >
        {professionTitle}
      </Badge>
      <Badge
        variant="outline"
        className={`${moduleCardBadgeClass} text-xs px-2.5 py-0.5 md:hidden`}
      >
        {plan === "pro" ? "Pro" : "Free"}
      </Badge>
      <div className="md:hidden flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap max-md:ml-auto">
        <span className="whitespace-nowrap">{streak > 0 ? streakLabel : "Heute zählt"}</span>
      </div>
    </div>
  );
}
