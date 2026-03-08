import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum | LernWerkFabrik",
  description: "Impressum der LernWerkFabrik.",
  robots: { index: true, follow: true },
};

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
            E-Mail: <span className="text-foreground">info@lernwerkfabrik.de</span>
          </div>
        </div>
      </Section>

      <Section title="Verbraucherstreitbeilegung / Universalschlichtungsstelle">
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </Section>
    </>
  );
}

export default function ImpressumPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Rechtliches
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Impressum</h1>
        <p className="text-sm text-muted-foreground">
          Angaben gemäß § 5 DDG und § 18 MStV
        </p>
      </header>

      <div className="mt-6 grid gap-4">
        <PlaceholderImpressum />

        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/">
            Zur Startseite
          </Link>
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/datenschutz">
            Datenschutz
          </Link>
        </div>
      </div>
    </main>
  );
}
