// app/BrandFooter.tsx
"use client";

import ScrollResetLink from "@/app/ScrollResetLink";

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
    <ScrollResetLink
      href={href}
      className="block text-sm text-foreground/90 transition-colors duration-150 ease-out hover:text-foreground"
    >
      {label}
    </ScrollResetLink>
  );
}

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground opacity-70 transition-opacity duration-150 ease-out hover:opacity-100"
    >
      {children}
    </a>
  );
}

export default function BrandFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-[14px] border-t bg-background/60 backdrop-blur md:mt-16">
      <AccentLine />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
          <div className="space-y-4">
            <div className="text-sm font-semibold text-foreground">Recht &amp; Transparenz</div>
            <div className="space-y-2.5">
              <FooterLink href="/impressum" label="Impressum" />
              <FooterLink href="/datenschutz" label="Datenschutz" />
            </div>
          </div>

          <div className="md:mr-8">
            <div className="text-xs font-medium text-foreground/70">Einblicke &amp; Updates</div>
            <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-muted-foreground/70">
              Einblicke in Aufgaben, Lösungen und Lernstrategien.
            </p>
            <div className="mt-3 flex items-center gap-4">
              <SocialIconLink href="/out/c1" label="Einblicke Kanal 1">
                <img
                  src="/social/c1.svg?v=5"
                  alt=""
                  aria-hidden="true"
                  className="block h-[22px] w-[22px] object-contain md:h-5 md:w-5"
                />
              </SocialIconLink>
              <SocialIconLink href="/out/c2" label="Einblicke Kanal 2">
                <img
                  src="/social/c2.svg"
                  alt=""
                  aria-hidden="true"
                  className="block h-[22px] w-[22px] object-contain md:h-5 md:w-5"
                />
              </SocialIconLink>
              <SocialIconLink href="/out/c3" label="Einblicke Kanal 3">
                <img
                  src="/social/c3.svg"
                  alt=""
                  aria-hidden="true"
                  className="block h-[22px] w-[22px] object-contain md:h-5 md:w-5"
                />
              </SocialIconLink>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <div className="text-[11px] text-muted-foreground/50">© {year} LernWerkFabrik</div>
        </div>
      </div>
    </footer>
  );
}
