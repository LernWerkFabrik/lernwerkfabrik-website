// app/BrandFooter.tsx
"use client";

import Link from "next/link";

function AccentLine() {
  return (
    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
  );
}

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="block text-sm text-foreground/90 transition-colors duration-150 ease-out hover:text-foreground"
    >
      {label}
    </Link>
  );
}

export default function BrandFooter() {
  const year = new Date().getFullYear();
  const stand = new Date().toLocaleDateString("de-DE");

  return (
    <footer className="mt-16 border-t bg-background/60 backdrop-blur">
      <AccentLine />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-10 md:items-start">
          <div className="space-y-4">
            <div className="text-sm font-semibold text-foreground">Recht &amp; Transparenz</div>
            <div className="space-y-2.5">
              <FooterLink href="/impressum" label="Impressum" />
              <FooterLink href="/datenschutz" label="Datenschutz" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <div className="text-[11px] text-muted-foreground/50">© {year} LernWerkFabrik</div>
          <div className="mt-1 text-[11px] text-muted-foreground/45">Stand: {stand}</div>
        </div>
      </div>
    </footer>
  );
}
