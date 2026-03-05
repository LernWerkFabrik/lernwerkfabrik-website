// app/impressum/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum | LernWerkFabrik",
  description: "Impressum der LernWerkFabrik (LWF).",
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
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
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
          Angaben gemäß § 5 TMG / § 18 Abs. 2 MStV (je nach Anbieterform). Bitte trage hier deine
          korrekten Betreiberangaben ein.
        </p>
      </header>

      <div className="mt-6 grid gap-4">
        <Section title="Diensteanbieter / Verantwortlicher">
          <div className="space-y-2">
            <div>
              <div className="font-medium text-foreground">LernWerkFabrik (LWF)</div>
              <div>
                {/* TODO: Betreibername (Person oder Firma) */}
                Betreiber: <span className="text-foreground">[Name / Firma eintragen]</span>
              </div>
              <div>
                {/* TODO: vollständige Anschrift */}
                Anschrift: <span className="text-foreground">[Straße, PLZ Ort, Land]</span>
              </div>
            </div>

            <div className="pt-1">
              {/* TODO: Kontaktwege */}
              <div>
                E-Mail: <span className="text-foreground">[E-Mail eintragen]</span>
              </div>
              <div>
                Telefon: <span className="text-foreground">[optional]</span>
              </div>
            </div>

            <div className="pt-1">
              {/* TODO: Registerdaten nur falls vorhanden */}
              <div className="text-xs text-muted-foreground">
                Registerangaben (nur falls zutreffend): Handelsregister, Registernummer, Registergericht.
              </div>
              <div>
                Register: <span className="text-foreground">[optional]</span>
              </div>
              <div>
                USt-IdNr.: <span className="text-foreground">[optional]</span>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Inhaltlich Verantwortlicher">
          <div>
            Verantwortlich i.S.d. § 18 Abs. 2 MStV:{" "}
            <span className="text-foreground">[Name + Anschrift, falls abweichend]</span>
          </div>
        </Section>

        <Section title="Haftung für Inhalte">
          <p>
            Wir bemühen uns um aktuelle und korrekte Inhalte. Als Diensteanbieter sind wir nach den allgemeinen
            Gesetzen für eigene Inhalte verantwortlich. Eine Verpflichtung zur Überwachung übermittelter oder
            gespeicherter fremder Informationen besteht nicht, sobald keine konkreten Anhaltspunkte für eine
            Rechtsverletzung vorliegen.
          </p>
        </Section>

        <Section title="Haftung für Links">
          <p>
            Unser Angebot kann Links zu externen Webseiten Dritter enthalten. Auf deren Inhalte haben wir keinen
            Einfluss; für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
          </p>
        </Section>

        <Section title="Urheberrecht">
          <p>
            Inhalte und Werke auf dieser Plattform unterliegen dem Urheberrecht. Eine Vervielfältigung oder Verwendung
            außerhalb der Grenzen des Urheberrechts bedarf der vorherigen schriftlichen Zustimmung, soweit nicht
            ausdrücklich anders angegeben.
          </p>
        </Section>

        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/privacy/learn">
            Datenschutz
          </Link>
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/terms">
            Nutzungsbedingungen
          </Link>
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/cookies">
            Cookies
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Stand: {new Date().toLocaleDateString("de-DE")}
        </p>
      </div>
    </main>
  );
}
