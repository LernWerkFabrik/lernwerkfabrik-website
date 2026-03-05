// app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nutzungsbedingungen | LernWerkFabrik",
  description: "Nutzungsbedingungen der LernWerkFabrik (LWF).",
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

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Rechtliches
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Nutzungsbedingungen</h1>
        <p className="text-sm text-muted-foreground">
          Diese Bedingungen regeln die Nutzung der LernWerkFabrik (LWF). Sie sind bewusst klar gehalten und
          beschreiben, was Nutzer dürfen – und was nicht.
        </p>
      </header>

      <div className="mt-6 grid gap-4">
        <Section title="1. Geltungsbereich">
          <p>
            Diese Nutzungsbedingungen gelten für die Nutzung der LernWerkFabrik (LWF) und der dazugehörigen Inhalte,
            Funktionen und Dienste. Abweichende Regelungen gelten nur, wenn sie schriftlich bestätigt wurden.
          </p>
        </Section>

        <Section title="2. Zweck der Plattform">
          <p>
            LWF ist eine Lern- und Trainingsplattform zur prüfungsnahen Vorbereitung (z. B. AP1/AP2/IHK). Ziel ist
            systematisches Lernen: Lernen → Üben → Prüfen → Fehlertraining.
          </p>
        </Section>

        <Section title="3. Registrierung & Konto">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Bestimmte Funktionen (z. B. Fortschritt speichern) können eine Anmeldung erfordern.
            </li>
            <li>
              Du bist verantwortlich für die Vertraulichkeit deiner Zugangsdaten.
            </li>
            <li>
              Missbrauch (z. B. automatisierte Zugriffe, Account-Sharing, Umgehung von Beschränkungen) ist untersagt.
            </li>
          </ul>
        </Section>

        <Section title="4. Inhalte, Lernmaterialien & Rechte">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Inhalte (Texte, Aufgaben, Grafiken) sind urheberrechtlich geschützt.
            </li>
            <li>
              Du darfst Inhalte ausschließlich für deine persönliche Vorbereitung nutzen.
            </li>
            <li>
              Untersagt sind: Weitergabe, Veröffentlichung, Verkauf, Upload in Foren/Chats, Training fremder KI-Modelle
              mit Plattform-Inhalten (z. B. Scraping/Export).
            </li>
          </ul>
        </Section>

        <Section title="5. Faire Nutzung & technische Schutzmaßnahmen">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Automatisiertes Auslesen (Scraping), Reverse Engineering und Manipulation der Plattform sind untersagt.
            </li>
            <li>
              Wir dürfen zum Schutz der Plattform technische Maßnahmen einsetzen (Rate Limits, Sperren, Erkennung von Missbrauch).
            </li>
          </ul>
        </Section>

        <Section title="6. Prüfungsmodus, Ergebnisse, Verantwortung">
          <p>
            Ergebnisse, Auswertungen und Empfehlungen dienen der Lernunterstützung. Sie ersetzen keine offizielle Bewertung.
            Du bleibst verantwortlich für deine Prüfungsvorbereitung und die Verwendung der Inhalte.
          </p>
        </Section>

        <Section title="7. Pro/Bezahlfunktionen (falls angeboten)">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Preise und Leistungsumfang ergeben sich aus der{" "}
              <Link className="underline underline-offset-4 hover:text-foreground" href="/pricing">
                Preisseite
              </Link>
              .
            </li>
            <li>
              Abos/Upgrades können zeit- oder funktionsgebunden sein.
            </li>
            <li>
              Widerruf/Erstattungen richten sich nach den gesetzlichen Vorgaben und den jeweils angezeigten Bedingungen.
            </li>
          </ul>
          <p className="mt-2 text-xs">
            Hinweis: Wenn du Zahlungen anbietest, sollten hier deine konkreten Vertragsbedingungen ergänzt werden.
          </p>
        </Section>

        <Section title="8. Sperrung & Kündigung">
          <p>
            Bei Verstößen gegen diese Bedingungen können wir Zugänge vorübergehend oder dauerhaft sperren. Nutzer können
            die Nutzung jederzeit einstellen. (Bei Abos ggf. zusätzliche Kündigungsregeln gemäß Preismodell.)
          </p>
        </Section>

        <Section title="9. Haftung">
          <p>
            Wir haften nach den gesetzlichen Bestimmungen. Für leichte Fahrlässigkeit haften wir nur bei Verletzung
            wesentlicher Vertragspflichten (Kardinalpflichten) und begrenzt auf den typischen, vorhersehbaren Schaden.
          </p>
        </Section>

        <Section title="10. Änderungen">
          <p>
            Wir können diese Bedingungen anpassen, wenn dies erforderlich ist (z. B. rechtliche Änderungen, neue Funktionen).
            Wesentliche Änderungen kommunizieren wir in geeigneter Weise.
          </p>
        </Section>

        <Section title="11. Kontakt">
          <p>
            Fragen zu diesen Bedingungen:{" "}
            <span className="text-foreground">[Support-E-Mail eintragen]</span>
          </p>
        </Section>

        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/impressum">
            Impressum
          </Link>
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/privacy/learn">
            Datenschutz
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
