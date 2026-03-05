import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

/* ----------------------------- helpers ----------------------------- */

function AccentLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
  );
}

function Feature({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check className="h-4 w-4 text-amber-400" aria-hidden="true" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground/40 dark:text-white/35" aria-hidden="true" />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground/75 dark:text-white/50"}>
        {label}
      </span>
    </div>
  );
}

/* ----------------------------- page ----------------------------- */

export default function PreisePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-6 md:pb-16 md:pt-10">
      <div className="space-y-7 md:space-y-12">
        {/* HEADER */}
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Bestehen ist kein Glück. Sondern Training.
          </h1>

          <p className="max-w-2xl text-base text-muted-foreground">
            Struktur statt Chaos. Training statt Hoffnung. Für echte
            Prüfungssicherheit.
          </p>
        </section>

        {/* PRICING CARDS */}
        <section className="grid gap-4 md:grid-cols-2 md:gap-6">
          {/* FREE */}
          <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
            <AccentLine />

            <CardHeader className="space-y-2">
              <Badge
                variant="outline"
                className="w-fit rounded-full border-amber-400/55 bg-amber-400/10 text-foreground/90"
              >
                Free
              </Badge>

              <CardTitle>Einsteigen & orientieren</CardTitle>

              <div className="text-base font-medium text-muted-foreground/85">0 €</div>

              <p className="text-sm text-muted-foreground">
                Für den Einstieg: Inhalte ansehen, den Lernflow verstehen und
                die Basis trainieren.
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2.5">
                <Feature label="2x Prüfungs-Kurztest" ok />
                <Feature label="3 Basismodule (empfohlener Start)" ok />
                <Feature
                  label="Lernmodus: Erklärung, Formeln, Beispiele & Übung"
                  ok
                />
                <Feature label="Max. 5 Durchgänge je Basismodul" ok />
              </div>
              <div className="space-y-3">
                <Feature label="Vollständiger Prüfungs-Simulator (Exam)" ok={false} />
                <Feature label="Fehlertraining (automatisch)" ok={false} />
                <Feature label="Empfehlungen & Statistiken" ok={false} />
                <Feature label="KI-Erklärungen" ok={false} />
              </div>

              <Button asChild className="mt-4 w-full rounded-full">
                <Link href="/inhalte">Mit dem Training starten</Link>
              </Button>

              <p className="text-center text-xs text-muted-foreground/90">
                Ohne Abo • Jederzeit Upgrade möglich
              </p>

              <p className="pt-1 text-xs text-muted-foreground">
                Für unbegrenztes Training jederzeit zu Pro wechseln.
              </p>
            </CardContent>
          </Card>

          {/* PRO */}
          <Card className="relative rounded-2xl border bg-background/80 shadow-md backdrop-blur">
            <AccentLine />

            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="w-fit rounded-full">Empfohlen</Badge>
                <Badge
                  variant="outline"
                  className="hidden w-fit rounded-full border-amber-400/50 text-foreground/90 md:inline-flex"
                >
                  Founding Member Preis
                </Badge>
              </div>

              <CardTitle>Pro – gezielt & sicher bestehen</CardTitle>

              {/* Hauptangebot: eine klare Entscheidung */}
              <div className="rounded-xl border border-amber-400/45 bg-gradient-to-r from-amber-400/20 via-amber-300/14 to-amber-400/18 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">
                    Frühstarter-Preis – dauerhaft 9,90 € sichern
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="text-[1.7rem] font-semibold leading-none text-foreground">
                      9,90 €
                    </div>
                    <div className="text-xs text-muted-foreground">/ Monat</div>
                  </div>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Nur für die ersten 100 Nutzer dauerhaft.
                </p>

                <p className="mt-1 text-xs text-muted-foreground/70">
                  Referenz:{" "}
                  <span className="font-medium text-foreground/80">17,90 €</span>{" "}
                  <span className="text-muted-foreground/70">Standardpreis</span>
                </p>
              </div>

            </CardHeader>

            <CardContent className="space-y-3">
              <Feature label="Alle Learn- & Prep-Module freigeschaltet" ok />
              <Feature label="Alle Prüfungen (AP1/AP2 Exam) freigeschaltet" ok />
              <Feature label="Automatisches Fehlertraining" ok />
              <Feature label="Verlauf, Auswertung & Statistiken" ok />

              <details className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 md:hidden">
                <summary className="cursor-pointer select-none text-sm text-muted-foreground/90">
                  Weitere Pro-Features anzeigen
                </summary>
                <div className="mt-2 space-y-2.5 border-t border-border/50 pt-2">
                  <Feature label="Unbegrenztes Üben (keine Run-Limits)" ok />
                  <Feature label="Empfehlungen (was als nächstes zählt)" ok />
                  <Feature label="KI-Erklärungen" ok />
                </div>
              </details>

              <div className="hidden space-y-3 md:block">
                <Feature label="Unbegrenztes Üben (keine Run-Limits)" ok />
                <Feature label="Empfehlungen (was als nächstes zählt)" ok />
                <Feature label="KI-Erklärungen" ok />
              </div>

              {/* CTA abhängig vom aktuellen Plan (Client) */}
              <ProCta />

              <details className="rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-sm text-muted-foreground/80">
                <summary className="cursor-pointer select-none text-sm text-muted-foreground/75">
                  Weitere Optionen anzeigen
                </summary>
                <div className="mt-2 space-y-2 border-t border-border/45 pt-2">
                  <Link
                    href="/pricing?price=price_standard_monthly"
                    className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-background/55 active:bg-background/65"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-foreground">17,90 € / Monat</span>
                      <span className="text-xs text-muted-foreground">Abo · monatlich kündbar</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xs text-muted-foreground/50 dark:text-white/40 transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </Link>
                  <Link
                    href="/pricing?price=price_3month_once"
                    className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-background/55 active:bg-background/65"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-foreground">44,90 € · 3 Monate Zugriff</span>
                      <span className="mt-0.5 inline-flex w-fit items-center rounded-full border border-amber-400/25 bg-amber-400/8 px-1 py-0.5 text-[9px] font-medium leading-none text-amber-900/75 opacity-80 dark:text-amber-100/65">
                        Am häufigsten von Schülern gewählt
                      </span>
                      <span className="text-xs text-muted-foreground">Einmalzahlung · endet automatisch</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xs text-muted-foreground/50 dark:text-white/40 transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </Link>
                  <Link
                    href="/pricing?price=price_yearly"
                    className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-background/55 active:bg-background/65"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-foreground">139 € · 12 Monate Zugriff</span>
                      <span className="text-xs text-muted-foreground">Günstigster Preis pro Monat</span>
                      <span className="text-xs text-muted-foreground">Einmalzahlung · endet automatisch</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xs text-muted-foreground/50 dark:text-white/40 transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </details>

            </CardContent>
          </Card>
        </section>

        {/* TRUST */}
        <section>
          <Card className="relative rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
            <AccentLine />
            <CardContent className="space-y-2.5 p-4 text-sm text-muted-foreground md:p-6">
              <p>
                <strong className="text-foreground">
                  Warum Pro?
                </strong>
              </p>
              <p>
                Gezieltes Prüfungstraining statt wahlloses Üben.
              </p>
              <p>
                Strukturierte Aufgaben, klare Auswertung und systematisches
                Fehlermanagement.
              </p>
              <p>
                Das spart Zeit, reduziert Unsicherheit und erhöht deine
                Bestehenschance.
              </p>
              <p>
                Du zahlst nicht für Extras – sondern für ein durchdachtes
                Trainingssystem.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* B2B */}
        <section className="pt-0 md:pt-2">
          <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
            <AccentLine />

            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between md:gap-6 md:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Für Ausbildungsbetriebe & Schulen
                </div>

                <p className="text-xs italic text-muted-foreground/90">
                  Sie vertreten einen Ausbildungsbetrieb?
                </p>

                <h3 className="text-lg font-semibold tracking-tight">
                  Lizenzen für Teams
                </h3>

                <p className="max-w-xl text-sm text-muted-foreground">
                  Zentrale Verwaltung, transparente Fortschrittsübersicht und
                  gezielte Förderung durch systematisches Fehlermanagement.
                </p>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Ideal für:</span>
                  <ul className="mt-1 space-y-0.5">
                    <li>• Ausbildungsbetriebe</li>
                    <li>• Umschulungen</li>
                    <li>• Berufsschulen</li>
                  </ul>
                </div>

                <p className="text-sm">
                  <strong className="text-foreground">
                    Pilotpreise ab 9,90 € pro Nutzer / Monat
                  </strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Abhängig von Anzahl und Laufzeit.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/business">Mehr erfahren</Link>
                </Button>

                <Button
                  asChild
                  className="rounded-full border border-slate-300/50 bg-slate-200/80 text-slate-900 hover:bg-slate-200 dark:border-slate-200/20 dark:bg-slate-200/15 dark:text-slate-100 dark:hover:bg-slate-200/20"
                >
                  <Link href="/business/contact">Kontakt aufnehmen</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

/* ----------------------------- client CTA ----------------------------- */
/**
 * Client-Komponente innerhalb der Datei
 * - verhindert SSR/localStorage Probleme
 * - erkennt DEV_FORCE_PLAN + normalen Plan
 */
function ProCta() {
  return <ProCtaClient />;
}

import ProCtaClient from "./pro-cta.client";

/**
 * Hinweis:
 * Wir importieren eine Client-Komponente aus einer separaten Datei,
 * weil Next.js "use client" sonst die ganze Page zu Client machen würde.
 */


