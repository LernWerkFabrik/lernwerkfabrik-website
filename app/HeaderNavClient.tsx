// app/HeaderNavClient.tsx
"use client";

import Link from "next/link";
import clsx from "clsx";
import HeaderUserMenuClient from "./HeaderUserMenuClient";

/**
 * HeaderNavClient (final)
 * -----------------------
 * - Rechte Header-Seite: Navigation + User Menü
 * - Erstbesuch: "Inhalte" + "Preise" + CTA (Anmelden) -> DE wird NICHT gezeigt
 * - Eingeloggt: Navigation + User Dropdown (inkl. Sprache)
 * - serverAuthed kommt vom Server (Source of Truth)
 */

export default function HeaderNavClient({
  serverAuthed,
}: {
  serverAuthed: boolean;
}) {
  const showPricing = !serverAuthed;

  return (
    <nav className="flex items-center gap-2">
      {/* Primary Nav (Desktop) */}
      <div
        className={clsx(
          "hidden items-center gap-1 md:flex",
          "rounded-full border border-border/60 bg-muted/30 px-1 py-1"
        )}
        aria-label="Hauptnavigation"
      >
        <NavItem href="/inhalte">Inhalte</NavItem>
        {showPricing ? <NavItem href="/pricing">Preise</NavItem> : null}
      </div>

      {/* User menu (handles Erstbesuch vs Authed UI) */}
      <HeaderUserMenuClient authed={serverAuthed} />
    </nav>
  );
}

function NavItem({
  href,
  children,
  compact,
}: {
  href: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        // Wichtig: exakt gleiche Typo für alle Items -> kein "Preise sieht anders aus"
        "rounded-full text-sm font-medium tracking-tight text-muted-foreground transition-colors",
        "hover:text-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        compact ? "px-3 py-2" : "px-3 py-1.5 hover:bg-background/40"
      )}
    >
      {children}
    </Link>
  );
}
