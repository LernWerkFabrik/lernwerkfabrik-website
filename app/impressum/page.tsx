import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum | LernWerkFabrik",
  description: "Impressum der LernWerkFabrik.",
  robots: { index: true, follow: true },
};

const ERECHT24_IMPRESSUM_ENDPOINT = "https://api.e-recht24.dev/v2/imprint";

type ERecht24ImpressumResponse = {
  html_de?: string;
  html_en?: string;
  modified?: string;
  warnings?: string;
};

type ERecht24LoadResult = {
  html: string;
  modified: string;
  warnings: string;
  error: string;
};

async function loadImpressumFromERecht24(): Promise<ERecht24LoadResult> {
  const apiKey = process.env.ERECHT24_API_KEY?.trim();

  if (!apiKey) {
    return {
      html: "",
      modified: "",
      warnings: "",
      error: "missing_api_key",
    };
  }

  try {
    const response = await fetch(ERECHT24_IMPRESSUM_ENDPOINT, {
      method: "GET",
      headers: {
        "eRecht24-api-key": apiKey,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return {
        html: "",
        modified: "",
        warnings: "",
        error: `e_recht24_${response.status}`,
      };
    }

    const data = (await response.json()) as ERecht24ImpressumResponse;

    return {
      html: (data.html_de ?? data.html_en ?? "").trim(),
      modified: data.modified ?? "",
      warnings: data.warnings ?? "",
      error: "",
    };
  } catch {
    return {
      html: "",
      modified: "",
      warnings: "",
      error: "e_recht24_unreachable",
    };
  }
}

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
      <Section title="Diensteanbieter">
        <div className="space-y-1.5">
          <div className="font-medium text-foreground">LernWerkFabrik</div>
          <div>
            Betreiber: <span className="text-foreground">[Name/Firma eintragen]</span>
          </div>
          <div>
            Anschrift: <span className="text-foreground">[Strasse, Hausnummer, PLZ, Ort, Land]</span>
          </div>
        </div>
      </Section>

      <Section title="Kontakt">
        <div className="space-y-1.5">
          <div>
            E-Mail: <span className="text-foreground">[E-Mail eintragen]</span>
          </div>
          <div>
            Telefon: <span className="text-foreground">[optional]</span>
          </div>
        </div>
      </Section>

      <Section title="Vertretungsberechtigte Person">
        <div>
          Vertreten durch: <span className="text-foreground">[Name eintragen]</span>
        </div>
      </Section>

      <Section title="Registereintrag (falls vorhanden)">
        <div className="space-y-1.5">
          <div>
            Registergericht: <span className="text-foreground">[optional]</span>
          </div>
          <div>
            Registernummer: <span className="text-foreground">[optional]</span>
          </div>
          <div>
            Umsatzsteuer-ID: <span className="text-foreground">[optional]</span>
          </div>
        </div>
      </Section>

      <Section title="Inhaltlich verantwortlich">
        <div>
          Verantwortlich fuer redaktionelle Inhalte: <span className="text-foreground">[Name und Anschrift eintragen]</span>
        </div>
      </Section>

      <Section title="Hinweise zur Haftung">
        <p>
          Trotz sorgfaeltiger inhaltlicher Kontrolle uebernehmen wir keine Haftung fuer die Inhalte externer Links.
          Fuer den Inhalt verlinkter Seiten sind ausschliesslich deren Betreiber verantwortlich.
        </p>
      </Section>
    </>
  );
}

export default async function ImpressumPage() {
  const impressum = await loadImpressumFromERecht24();
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
          Pflichtangaben nach deutschem Recht (u. a. TMG/MStV). Bitte ersetze die Platzhalter vor Livegang mit
          deinen echten Daten.
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
              Die statischen Platzhalter werden als Fallback angezeigt.
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
