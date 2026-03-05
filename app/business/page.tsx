import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

function AccentLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]
      bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
  );
}

function Benefit({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl border bg-amber-500/10">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

export default function BusinessPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6 space-y-12">
      {/* HERO */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Für Ausbildungsbetriebe
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Strukturierte Ausbildung.
          <span className="block">Messbarer Prüfungserfolg.</span>
        </h1>

        <p className="max-w-2xl text-base text-muted-foreground">
          Unsere Plattform unterstützt Ausbildungsbetriebe dabei, Wissen
          systematisch zu vermitteln, Lernfortschritte transparent zu machen und
          Auszubildende gezielt auf Zwischen- und Abschlussprüfungen
          vorzubereiten.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
        {/* Primary B2B CTA */}
        <Button asChild className="rounded-full">
            <Link href="/business/contact">
            Kontakt aufnehmen <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>

        {/* Secondary CTA */}
        <Button variant="outline" asChild className="rounded-full">
            <Link href="#preismodell-fuer-betriebe">
            Preise für Betriebe ansehen
            </Link>
        </Button>
        </div>

      </section>

      {/* PROBLEMS */}
      <section>
        <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader>
            <CardTitle>Herausforderungen in der Ausbildung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
            <div>Unterschiedliche Leistungsstände innerhalb einer Gruppe</div>
            <div>Begrenzte Zeit für individuelle Förderung</div>
            <div>Fehlende Transparenz beim Lernfortschritt</div>
          </CardContent>
        </Card>
      </section>

      {/* SOLUTION */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Unsere Lösung im Überblick
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Benefit
            icon={<GraduationCap className="h-5 w-5 text-amber-400" />}
            title="Didaktisch strukturierter Lernflow"
            desc="Lernen → Üben → Prüfen → gezielt wiederholen."
          />
          <Benefit
            icon={<ClipboardCheck className="h-5 w-5 text-amber-400" />}
            title="Realistischer Prüfungsmodus"
            desc="Training unter prüfungsnahen Bedingungen mit Zeitdruck und Bewertungssystem."
          />
          <Benefit
            icon={<BarChart3 className="h-5 w-5 text-amber-400" />}
            title="Transparenter Lernfortschritt"
            desc="Ergebnisse, Entwicklung und Schwächen werden klar sichtbar."
          />
          <Benefit
            icon={<ShieldCheck className="h-5 w-5 text-amber-400" />}
            title="Qualität & Vergleichbarkeit"
            desc="Einheitliche Inhalte und Bewertungsmaßstäbe für alle Auszubildenden."
          />
        </div>
      </section>

      {/* USE CASES */}
      <section>
        <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader>
            <CardTitle>Einsatzmöglichkeiten</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <div>Vorbereitung auf Zwischen- und Abschlussprüfungen</div>
            <div>Begleitend zur Berufsschule</div>
            <div>Selbstständiges Lernen im Betrieb</div>
          </CardContent>
        </Card>
      </section>

      {/* PRICING B2B */}
      <section id="preismodell-fuer-betriebe" className="space-y-3 scroll-mt-28">
        <h2 className="text-xl font-semibold tracking-tight">
          Preismodell für Betriebe
        </h2>

        <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
          <AccentLine />
          <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">
                Ab 9,90 € pro Nutzer / Monat
              </strong>{" "}
              (abhängig von Anzahl & Laufzeit)
            </p>
            <p>
              Inklusive aller Module, Prüfungen, Fehlertraining
              und späteren Erweiterungen.
            </p>
            <p>
              Optional: Pilotphase mit ausgewählten Azubis.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section>
        <Card className="relative rounded-2xl border bg-background/80 shadow-md backdrop-blur">
          <AccentLine />
          <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-amber-400" />
                Pilotprojekt starten
              </div>
              <p className="text-sm text-muted-foreground">
                Gerne stellen wir die Plattform vor und besprechen den
                möglichen Einsatz in Ihrem Ausbildungsbetrieb.
              </p>
            </div>

            <Button asChild className="rounded-full">
            <Link href="/business/contact">Kontakt aufnehmen</Link>
            </Button>

          </CardContent>
        </Card>
      </section>
    </main>
  );
}
