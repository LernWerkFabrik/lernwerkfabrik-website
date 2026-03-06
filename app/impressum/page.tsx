import type { Metadata } from "next";
import Link from "next/link";

import { loadERecht24Document } from "@/lib/erecht24";

export const metadata: Metadata = {
  title: "Impressum | LernWerkFabrik",
  description: "Impressum der LernWerkFabrik.",
  robots: { index: true, follow: true },
};
export const dynamic = "force-dynamic";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-2xl border bg-background/70 p-5 shadow-sm backdrop-blur">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PlaceholderImpressum() {
  return (
    <>
      <Section title="Impressum">
        <div className="space-y-1.5">
          <div className="font-medium text-foreground">Aleksej Schulschenko</div>
          <div className="text-foreground">LernWerkFabrik</div>
          <div>Kolonnenstr. 8</div>
          <div>10827 Berlin</div>
        </div>
      </Section>

      <Section title="Kontakt">
        <div className="space-y-1.5">
          <div>
            Telefon: <span className="text-foreground">[Telefonnummer]</span>
          </div>
          <div>
            E-Mail: <span className="text-foreground">info@lernwerkfabrik.de</span>
          </div>
        </div>
      </Section>

      <Section title="Verbraucherstreitbeilegung/Universalschlichtungsstelle">
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </Section>
    </>
  );
}

export default async function ImpressumPage() {
  const impressum = await loadERecht24Document("imprint");
  const hasApiImpressum = impressum.html.length > 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Rechtliches
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Impressum</h1>
        <p className="text-sm text-muted-foreground">
          Pflichtangaben nach deutschem Recht (u. a. TMG/MStV).
        </p>
      </header>

      <div className="mt-6 grid gap-4">
        {hasApiImpressum ? (
          <Section title="Impressum (eRecht24)">
            <div
              className="[&_a]:underline [&_a]:underline-offset-4 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-medium [&_p]:my-2 [&_p]:text-sm [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: impressum.html }}
            />
            {impressum.warnings ? (
              <div
                className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200"
                dangerouslySetInnerHTML={{ __html: impressum.warnings }}
              />
            ) : null}
            {impressum.modified ? (
              <p className="mt-3 text-xs text-muted-foreground">Zuletzt aktualisiert (eRecht24): {impressum.modified}</p>
            ) : null}
          </Section>
        ) : (
          <PlaceholderImpressum />
        )}

        {!hasApiImpressum && impressum.error ? (
          <Section title="Hinweis">
            <div>
              Das automatische eRecht24-Impressum konnte nicht geladen werden ({impressum.error}).
              Das statische Impressum wird als Fallback angezeigt.
            </div>
          </Section>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/">
            Zur Startseite
          </Link>
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/datenschutz">
            Datenschutz
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">Stand: 06.03.2026</p>
      </div>
    </main>
  );
}
