// app/cookies/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookies & Tracking | LernWerkFabrik",
  description: "Informationen zu Cookies und Tracking auf der LernWerkFabrik (LWF).",
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
    <section className="min-w-0 space-y-2 rounded-2xl border bg-background/70 p-5 shadow-sm backdrop-blur">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground break-words">{children}</div>
    </section>
  );
}

function Table({
  rows,
}: {
  rows: Array<{ name: string; purpose: string; duration: string; type: string }>;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border bg-background/60 md:block">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-3 font-medium">Cookie/Storage</th>
              <th className="px-4 py-3 font-medium">Zweck</th>
              <th className="px-4 py-3 font-medium">Dauer</th>
              <th className="px-4 py-3 font-medium">Typ</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {rows.map((r) => (
              <tr key={r.name} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-foreground break-words">{r.name}</td>
                <td className="px-4 py-3 break-words">{r.purpose}</td>
                <td className="px-4 py-3 break-words">{r.duration}</td>
                <td className="px-4 py-3 break-words">{r.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <article key={r.name} className="rounded-xl border bg-background/60 p-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Cookie/Storage
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground break-words">{r.name}</p>

            <div className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Zweck
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words">{r.purpose}</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Dauer</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words">{r.duration}</p>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Typ</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground break-words">{r.type}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default function CookiesPage() {
  const rows = [
    {
      name: "Auth-Cookie (z. B. lwf_auth)",
      purpose: "Serverseitige Prüfung, ob du eingeloggt bist (Zugriffsschutz / Gates).",
      duration: "Session / kurzzeitig (abhängig von Implementierung)",
      type: "Notwendig",
    },
    {
      name: "localStorage: Login/Profil/Onboarding",
      purpose: "Speichert lokale Einstellungen und Profilstatus im MVP (z. B. Onboarding).",
      duration: "Bis zur Löschung im Browser",
      type: "Funktional",
    },
    {
      name: "localStorage: Lern-/Run-Daten (z. B. Fortschritt)",
      purpose: "Speichert Lernfortschritt/Ergebnisse lokal, sofern aktiviert.",
      duration: "Bis zur Löschung im Browser",
      type: "Funktional",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Transparenz
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Cookies & Tracking</h1>
        <p className="text-sm text-muted-foreground">
          Wir erklären klar, welche Cookies bzw. Speichermechanismen wir einsetzen – und wofür.
          Ziel: Funktionalität ohne unnötiges Tracking.
        </p>
      </header>

      <div className="mt-6 grid min-w-0 gap-4">
        <Section title="Grundsatz">
          <p>
            LWF ist als Lernwerkzeug konzipiert. Wir vermeiden unnötiges Tracking. Notwendige Cookies/Storage können
            erforderlich sein, damit Login, Zugriffsschutz und Lernfortschritt funktionieren.
          </p>
        </Section>

        <Section title="Welche Cookies/Storage nutzen wir?">
          <p className="mb-3">
            Je nach Browser und Nutzung kommen folgende Mechanismen vor (Bezeichnungen können je nach Build leicht
            variieren):
          </p>
          <Table rows={rows} />
          <p className="mt-3 text-xs text-muted-foreground">
            Hinweis: Wenn du später Analytics/Marketing-Tools aktivierst (z. B. Matomo, GA), ergänze diese Tabelle um
            Anbieter, Zweck, Rechtsgrundlage, Opt-Out und Datenübermittlung.
          </p>
        </Section>

        <Section title="Wie kannst du Cookies löschen/unterbinden?">
          <ul className="list-disc pl-5 space-y-2">
            <li>Du kannst Cookies und Website-Daten jederzeit in den Browser-Einstellungen löschen.</li>
            <li>Du kannst das Setzen von Cookies einschränken (z. B. Drittanbieter-Cookies blockieren).</li>
            <li>
              Achtung: Wenn du notwendige Cookies/Storage blockierst, funktionieren Login und Fortschritt ggf. nicht.
            </li>
          </ul>
        </Section>

        <Section title="Rechtsgrundlage (Kurzüberblick)">
          <p>
            Notwendige Cookies/Storage dienen der Bereitstellung der Website und ihrer Kernfunktionen. Weitere Cookies
            (Analytics/Marketing) würden nur nach Einwilligung gesetzt, sofern aktiviert.
          </p>
        </Section>

        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/impressum">
            Impressum
          </Link>
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/privacy/learn">
            Datenschutz
          </Link>
          <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/terms">
            Nutzungsbedingungen
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Stand: {new Date().toLocaleDateString("de-DE")}
        </p>
      </div>
    </main>
  );
}
