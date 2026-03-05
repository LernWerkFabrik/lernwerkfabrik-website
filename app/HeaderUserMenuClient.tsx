"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getProfileClient, type UserProfile } from "@/lib/profile";

type Props = {
  authed: boolean;
};

function getDisplayName(): string {
  try {
    const profile: UserProfile | null = getProfileClient();

    // ✅ In eurem Typ gibt es offenbar KEIN nickname -> wir nutzen name als Anzeige
    if (profile?.name && typeof profile.name === "string" && profile.name.trim()) {
      return profile.name.trim();
    }

    if (profile?.email && typeof profile.email === "string") {
      return profile.email.split("@")[0];
    }
  } catch {
    // ignore
  }

  return "Profil";
}

export default function HeaderUserMenuClient({ authed }: Props) {
  const [displayName, setDisplayName] = React.useState<string>("Profil");

  React.useEffect(() => {
    if (!authed) return;
    setDisplayName(getDisplayName());
  }, [authed]);

  if (!authed) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild className="rounded-full">
          <Link href="/login">Anmelden</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full border-border/60 bg-muted/40 px-3">
          <span className="text-sm font-medium">{displayName}</span>
          <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/dashboard/profil">Profil</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/logout">Abmelden</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
