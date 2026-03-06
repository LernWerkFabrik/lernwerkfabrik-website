import type { Metadata } from "next";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Datenschutz | LernWerkFabrik",
  description: "Datenschutzhinweise der LernWerkFabrik.",
  robots: { index: true, follow: true },
};

const ERECHT24_PRIVACY_ENDPOINT = "https://api.e-recht24.dev/v2/privacyPolicy";

type ERecht24PrivacyResponse = {
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

async function resolveERecht24ApiKey(): Promise<string> {
  const fromProcess = process.env.ERECHT24_API_KEY?.trim();
  if (fromProcess) return fromProcess;

  try {
    const { env } = await getCloudflareContext({ async: true });
    const fromBinding = (env as Record<string, unknown>).ERECHT24_API_KEY;
    if (typeof fromBinding === "string") {
      return fromBinding.trim();
    }
  } catch {
    // Context is not always available outside Cloudflare runtime.
  }

  return "";
}

async function loadPrivacyFromERecht24(): Promise<ERecht24LoadResult> {
  const apiKey = await resolveERecht24ApiKey();

  if (!apiKey) {
    return {
      html: "",
      modified: "",
      warnings: "",
      error: "missing_api_key",
    };
  }

  try {
    const response = await fetch(ERECHT24_PRIVACY_ENDPOINT, {
      method: "GET",
      headers: {
        "eRecht24-api-key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        html: "",
        modified: "",
        warnings: "",
        error: `e_recht24_${response.status}`,
      };
    }

    const data = (await response.json()) as ERecht24PrivacyResponse;

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

function PlaceholderPrivacy() {
  return (
    <>
      <Section title="Verantwortlicher">
        <p>
          Verantwortlich fuer die Datenverarbeitung ist der Betreiber der Plattform LernWerkFabrik.
          Die konkreten Kontaktdaten bitte im Impressum ergaenzen.
        </p>
      </Section>

      <Section title="Welche Daten wir verarbeiten">
        <div className="space-y-1.5">
          <p>Bei der Wartelisten-Anmeldung koennen folgende Daten verarbeitet werden:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>E-Mail-Adresse</li>
            <li>created_at (Zeitpunkt der Eintragung)</li>
            <li>source (z. B. utm_source oder direct)</li>
            <li>referrer</li>
            <li>device_type (mobile/tablet/desktop)</li>
            <li>country (2-stelliger Laendercode, sofern verfuegbar)</li>
            <li>waitlist_position</li>
          </ul>
        </div>
      </Section>

      <Section title="Zweck und Rechtsgrundlage">
        <p>
          Die Verarbeitung erfolgt zur Verwaltung der Warteliste, zur Information ueber den Plattform-Launch und
          zur technischen Absicherung gegen Missbrauch. Rechtsgrundlage ist in der Regel Art. 6 Abs. 1 lit. b
          DSGVO (vorvertragliche Massnahmen) und/oder Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
          sicherem Betrieb und Messung von Kampagnenkanaelen).
        </p>
      </Section>

      <Section title="Empfaenger und Auftragsverarbeitung">
        <div className="space-y-1.5">
          <p>
            Zur Bereitstellung der Website und Speicherung der Wartelisten-Daten werden technische Dienstleister
            eingesetzt (z. B. Hosting/Edge, Datenbank, Bot-Schutz).
          </p>
          <p>
            Falls Daten ausserhalb der EU verarbeitet werden, erfolgen geeignete Garantien nach DSGVO
            (z. B. Standardvertragsklauseln), soweit erforderlich.
          </p>
        </div>
      </Section>

      <Section title="Speicherdauer">
        <p>
          Wartelisten-Daten werden nur so lange gespeichert, wie sie fuer den genannten Zweck erforderlich sind
          oder gesetzliche Aufbewahrungspflichten bestehen. Eine fruehere Loeschung ist auf Anfrage moeglich,
          soweit keine gesetzlichen Gruende entgegenstehen.
        </p>
      </Section>

      <Section title="Deine Rechte">
        <div className="space-y-1.5">
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Loeschung, Einschraenkung der Verarbeitung,
            Datenuertragbarkeit sowie Widerspruch gegen bestimmte Verarbeitungen.
          </p>
          <p>Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehoerde.</p>
        </div>
      </Section>
    </>
  );
}

export default async function DatenschutzPage() {
  const privacy = await loadPrivacyFromERecht24();
  const hasApiPrivacy = privacy.html.length > 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Rechtliches
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Datenschutz</h1>
        <p className="text-sm text-muted-foreground">
          Diese Hinweise beschreiben die Verarbeitung personenbezogener Daten auf der Wartelisten-Landingpage.
        </p>
      </header>

      <div className="mt-6 grid gap-4">
        {hasApiPrivacy ? (
          <Section title="Datenschutzerklaerung (eRecht24)">
            <div
              className="[&_a]:underline [&_a]:underline-offset-4 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-medium [&_p]:my-2 [&_p]:text-sm [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: privacy.html }}
            />
            {privacy.warnings ? (
              <div
                className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200"
                dangerouslySetInnerHTML={{ __html: privacy.warnings }}
              />
            ) : null}
            {privacy.modified ? (
              <p className="mt-3 text-xs text-muted-foreground">Zuletzt aktualisiert (eRecht24): {privacy.modified}</p>
            ) : null}
          </Section>
        ) : (
          <PlaceholderPrivacy />
        )}

        {!hasApiPrivacy && privacy.error ? (
          <Section title="Hinweis">
            <div>
              Die automatische eRecht24-Datenschutzerklaerung konnte nicht geladen werden ({privacy.error}).
              Der statische Fallback wird angezeigt.
            </div>
          </Section>
        ) : null}

        <Card className="rounded-2xl border bg-background/75 shadow-sm backdrop-blur-sm">
          <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
            <p>Fuer Anfragen zum Datenschutz nutze bitte die im Impressum genannten Kontaktdaten.</p>
            <div className="flex flex-wrap gap-3">
              <Link className="underline underline-offset-4 hover:text-foreground" href="/impressum">
                Zum Impressum
              </Link>
              <Link className="underline underline-offset-4 hover:text-foreground" href="/">
                Zur Startseite
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">Stand: 06.03.2026</p>
      </div>
    </main>
  );
}
