"use client";

import Image from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WaitlistForm from "@/components/WaitlistForm";
import {
  BookOpen,
  Brain,
  Target,
  ShieldCheck,
  Gauge,
  Sparkles,
  CheckCircle2,
  Timer,
  AlertTriangle,
} from "lucide-react";

/**
 * Panel = "Exam-Style Surface"
 * - dezenter Verlauf (Sky -> Amber)
 * - weiche Vignette
 * - Ring / Border bleibt
 *
 * Hinweis: backdrop-blur-sm + etwas opakeres bg reduziert Banding/Stripe-Artefakte.
 */
function Panel({
  children,
  className = "",
  accent = "amber",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "amber" | "sky";
}) {
  const accentLine =
    accent === "sky"
      ? "bg-gradient-to-r from-transparent via-sky-400/55 to-transparent"
      : "bg-gradient-to-r from-transparent via-amber-400/70 to-transparent";

  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border bg-background/82 shadow-sm backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {/* Top accent line */}
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-2xl",
          accentLine,
        ].join(" ")}
      />

      {/* Gradient wash */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-amber-500/12" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_15%_10%,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_85%_20%,rgba(245,158,11,0.08),transparent_60%)]" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
      </div>

      <div className="relative z-10">{children}</div>
    </section>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3.5 max-md:gap-5">
      <div className="relative h-16 w-16 shrink-0 max-md:h-24 max-md:w-24">
        <Image
          src="/brand/logo-lwf-dark.png"
          alt="LernWerkFabrik"
          fill
          sizes="(max-width: 768px) 96px, 64px"
          className="object-contain block dark:hidden"
          priority={false}
        />
        <Image
          src="/brand/logo-lwf-light.png"
          alt="LernWerkFabrik"
          fill
          sizes="(max-width: 768px) 96px, 64px"
          className="object-contain hidden dark:block"
          priority={false}
        />
      </div>

      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight md:text-lg">
          Lern<span className="text-primary">Werk</span>Fabrik
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground md:text-sm max-md:mt-0">
          Prüfungsnah trainieren für Industriemechaniker/in - mit Struktur
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-foreground/80 backdrop-blur-sm">
      <span className="text-amber-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
  right,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="space-y-1">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            {eyebrow}
          </div>
        ) : null}

        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>

        {desc ? <p className="text-sm text-muted-foreground">{desc}</p> : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function MiniLogo({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-background/55 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm">
      <Sparkles className="h-3.5 w-3.5 text-amber-300/80" />
      <span>{name}</span>
    </div>
  );
}

function MetaBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
      <span className="text-amber-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function HomeClient() {
  const heroBadgeClass =
    "rounded-full border-amber-300/60 bg-amber-50/80 text-amber-900 shadow-[0_6px_14px_-12px_rgba(180,83,9,0.36),inset_0_1px_0_rgba(255,255,255,0.72)] hover:-translate-y-0.5 hover:bg-amber-50/90 hover:shadow-[0_9px_16px_-12px_rgba(180,83,9,0.4),inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-amber-200/14 dark:bg-amber-200/5 dark:text-amber-100/70 dark:shadow-[0_2px_6px_-10px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.02)] dark:hover:bg-amber-200/8 dark:hover:shadow-[0_3px_8px_-10px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.03)] md:min-w-[13.5rem] md:justify-center md:px-5 md:py-1.5 md:text-sm max-md:shrink-0 max-md:whitespace-nowrap max-md:px-2 max-md:py-px max-md:text-xs";

  return (
    <div className="relative overflow-hidden">
      {/* Background grid + glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.09) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -top-24 left-1/2 h-[440px] w-[640px] -translate-x-1/2 rounded-[999px] bg-amber-500/14 blur-3xl" />
        <div className="absolute right-[-140px] top-[140px] h-[360px] w-[360px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-[420px] w-[420px] rounded-full bg-slate-500/12 blur-3xl" />
      </div>

      {/* Centered container */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="space-y-10">
          {/* HERO */}
          <Panel className="p-6 md:p-8 max-md:p-4 max-md:pt-3" accent="amber">
            {/* top row */}
            <div className="mb-4 flex items-center justify-start gap-3 max-md:mb-1 md:mx-auto md:w-full md:max-w-[78%]">
              <BrandMark />
            </div>

            <div className="space-y-8 max-md:space-y-6">
              {/* LEFT */}
              <div className="mx-auto w-full max-w-4xl space-y-4 max-md:space-y-3 md:max-w-[78%]">
                {/* USP Badges */}
                <div className="flex justify-center md:hidden">
                  <Badge className={heroBadgeClass}>Abschlussprüfung (AP1/AP2) – strukturiert bestehen</Badge>
                </div>
                <div className="hidden md:mx-auto md:flex md:w-full md:flex-nowrap md:items-center md:justify-between">
                  <Badge className={heroBadgeClass}>
                    Abschlussprüfung (AP1/AP2)
                  </Badge>
                  <Badge className={heroBadgeClass}>
                    Prüfungslogik statt Auswendiglernen
                  </Badge>
                  <Badge className={heroBadgeClass}>
                    Fehlertraining als Kernfunktion
                  </Badge>
                </div>

                {/* Headline */}
                <h1 className="font-semibold tracking-tight text-center">
                  <span className="hidden md:block md:text-[clamp(2.4rem,4.8vw,4.2rem)] md:leading-[1.03]">
                    <span className="block">Von der Aufgabe zur</span>
                    <span className="block">sicheren Abschlussprüfung</span>
                  </span>
                  <span className="text-[2.65rem] leading-[1.06] max-md:block md:hidden">
                    Von der Aufgabe
                    <span className="block">zur sicheren</span>
                    <span className="block">Abschlussprüfung</span>
                  </span>
                </h1>

                {/* Subline */}
                <p className="mx-auto max-w-2xl text-center text-base text-muted-foreground md:text-lg max-md:text-sm max-md:leading-snug">
                  <span className="hidden md:inline">
                    Für Industriemechaniker/-innen vor der IHK-Abschlussprüfung (AP1/AP2). Erkenne typische Prüfungsfehler, verstehe die Prüfungslogik und trainiere prüfungsnah statt nur auswendig zu lernen.
                  </span>
                  <span className="md:hidden">
                    Für AP1/AP2: Prüfungslogik verstehen, Fehler erkennen und prüfungsnah trainieren.
                  </span>
                </p>
                <p className="mx-auto max-w-2xl text-center text-sm font-medium text-foreground/90 md:text-base">
                  🚀 Early Access sichern – und zum Launch direkt starten.
                </p>

                {/* Mobile CTA (früh sichtbar) */}
                <div className="md:hidden">
                  <div className="flex flex-col gap-2">
                    <WaitlistForm />
                  </div>
                  <div className="ml-1 mt-2.5 border-l border-border/80 pl-3 text-[0.82rem] text-foreground/80 dark:text-white/85">
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-foreground/70 dark:text-white/80">
                          ✓
                        </span>
                        <span>Für AP1 & AP2 entwickelt</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-foreground/70 dark:text-white/80">
                          ✓
                        </span>
                        <span>Prüfungsnah wie die echte Aufgabe</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-foreground/70 dark:text-white/80">
                          ✓
                        </span>
                        <span>Kein Auswendiglernen nötig</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Mobile Outcomes */}
                <div className="relative mt-1 overflow-hidden rounded-xl border bg-background/55 p-3 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.3)] md:hidden">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                  <div className="relative">
                    <div className="text-sm font-medium">Zum Launch kannst du:</div>
                    <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        Typische Prüfungsfehler erkennen
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        Aufgaben sicher strukturieren
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        Fortschritt realistisch einschätzen
                      </li>
                    </ul>

                    <div className="mt-3 grid gap-2">
                      <div className="relative overflow-hidden rounded-xl border border-black/16 bg-gradient-to-r from-sky-100/30 via-background/82 to-amber-100/40 p-3 text-center shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] dark:border-white/10 dark:from-sky-500/10 dark:via-background/72 dark:to-amber-500/12 dark:shadow-[0_12px_24px_-18px_rgba(0,0,0,0.72)]">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-sky-400/65 to-transparent" />
                        <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Verstehen → Prüfen → Verbessern
                        </div>
                        <ul className="mt-2 space-y-1.5 text-left text-sm text-muted-foreground">
                          <li className="flex items-center justify-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            <span>Erklärung & Beispiele</span>
                          </li>
                          <li className="flex items-center justify-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            <span>Realistische Prüfung</span>
                          </li>
                          <li className="flex items-center justify-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            <span>Automatisches Fehlertraining</span>
                          </li>
                        </ul>
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-gradient-to-r from-sky-100/24 via-background/76 to-amber-100/32 p-3 text-center shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] dark:border-white/10 dark:from-sky-500/10 dark:via-background/72 dark:to-amber-500/12">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-sky-400/65 to-transparent" />
                        <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Ergebnis</div>
                        <ul className="mt-2 space-y-1.5 text-left text-sm text-muted-foreground">
                          <li className="flex items-center justify-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            <span>Klarer Lernplan</span>
                          </li>
                          <li className="flex items-center justify-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            <span>Messbarer Fortschritt</span>
                          </li>
                          <li className="flex items-center justify-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-400" />
                            <span>Prüfungsnah trainieren</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Outcomes */}
                <div className="relative mt-1 hidden overflow-hidden rounded-2xl border bg-background/55 p-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.3)] md:mt-2 md:mx-auto md:grid md:w-full md:grid-cols-[minmax(0,1fr)_minmax(220px,0.9fr)_210px] md:items-start md:gap-5">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                  <div>
                    <div className="text-sm font-medium">Zum Launch kannst du:</div>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        Prüfungsfallen erkennen
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        Fehler automatisch wiederholen
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        Prüfungsstand realistisch einschätzen
                      </li>
                    </ul>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-black/16 bg-gradient-to-r from-sky-100/30 via-background/82 to-amber-100/40 p-3 text-center shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] dark:border-white/10 dark:from-sky-500/10 dark:via-background/72 dark:to-amber-500/12 dark:shadow-[0_12px_24px_-18px_rgba(0,0,0,0.72)]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-sky-400/65 to-transparent" />
                    <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Verstehen → Prüfen → Verbessern
                    </div>
                    <ul className="mt-2 space-y-1.5 text-left text-sm text-muted-foreground">
                      <li className="flex items-center justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        <span>Erklärung & Beispiele</span>
                      </li>
                      <li className="flex items-center justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        <span>Realistische Prüfung</span>
                      </li>
                      <li className="flex items-center justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        <span>Automatisches Fehlertraining</span>
                      </li>
                    </ul>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-black/10 bg-gradient-to-r from-sky-100/24 via-background/76 to-amber-100/32 p-3 text-center shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] dark:border-white/10 dark:from-sky-500/10 dark:via-background/72 dark:to-amber-500/12">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-sky-400/65 to-transparent" />
                    <div className="text-xs font-semibold uppercase tracking-wide text-foreground/80">Ergebnis</div>
                    <ul className="mt-2 space-y-1.5 text-left text-sm text-muted-foreground">
                      <li className="flex items-center justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        <span>Klarer Lernplan</span>
                      </li>
                      <li className="flex items-center justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        <span>Messbarer Fortschritt</span>
                      </li>
                      <li className="flex items-center justify-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-400" />
                        <span>Prüfungsnah trainieren</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* CTAs */}
                <div className="hidden flex-wrap items-start gap-3 pt-2 md:flex md:justify-center">
                  <WaitlistForm
                    buttonLabel="Early Access sichern"
                    inputClassName="md:w-full md:flex-1"
                    className="min-w-[24rem]"
                  />
                </div>
                {/* Micro-Box (straffer) */}
                <div className="relative mt-2 overflow-hidden rounded-2xl border bg-background/55 p-4 md:mt-3">
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      Hier verlieren viele Punkte in der Prüfung
                    </div>

                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-foreground/90">Hier verlieren viele Punkte:</div>
                        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 block size-2 flex-none rounded-full bg-amber-400" />
                            Einheiten & Vorzeichen → Ergebnis falsch
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 block size-2 flex-none rounded-full bg-amber-400" />
                            Teilpunkte verloren → Begründung fehlt
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 block size-2 flex-none rounded-full bg-amber-400" />
                            Ergebnis nicht geprüft → Plausibilität fehlt
                          </li>
                        </ul>
                      </div>

                      <div className="relative overflow-hidden rounded-xl border border-black/10 bg-gradient-to-r from-sky-100/24 via-background/76 to-amber-100/32 p-3 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] dark:border-white/10 dark:from-sky-500/10 dark:via-background/72 dark:to-amber-500/12">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-sky-400/65 to-transparent" />
                        <div className="text-sm font-medium text-foreground/90">So hilft dir LernWerkFabrik:</div>
                        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                            erkennt typische Fehler automatisch
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                            trainiert nur deine Schwächen
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                            prüfungsnahe Auswertung
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      Problem erkannt → <span className="text-foreground">gezielt gelöst</span>.
                    </div>
                  </div>
                </div>

                {/* Trust / principles */}
                <div className="mt-2 grid grid-cols-[auto,1fr] items-stretch gap-x-5 gap-y-2 md:block">
                  <div className="flex h-full flex-col gap-2.5 max-md:py-0.5 md:flex-row md:flex-wrap md:justify-center md:gap-10">
                    <Pill icon={<ShieldCheck className="h-4 w-4" />} label="Kostenlos anmelden (Free)" />
                    <Pill icon={<Gauge className="h-4 w-4" />} label="Messbarer Fortschritt" />
                    <Pill icon={<Brain className="h-4 w-4" />} label="Erklärhilfe: gezielt, kein Chat" />
                  </div>

                  <p className="self-center text-xs text-muted-foreground md:mt-2 md:text-center">
                    Du erhältst Zugriff direkt zum Launch nach Wartelisten-Freigabe.
                  </p>
                </div>
              </div>

              {/* CARDS unter dem Hero-Block */}
              <div className="mx-auto w-full max-w-5xl">
                <div className="grid gap-2.5 md:gap-3">
                  <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
                    <Card className="relative overflow-hidden rounded-2xl border bg-background/70 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-18px_rgba(15,23,42,0.45)]">
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/8 via-transparent to-amber-500/10" />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
                        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                      </div>
                      <CardContent className="relative p-4 max-md:py-1.5">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl border bg-amber-500/10">
                            <BookOpen className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                              Schritt 1
                            </div>
                            <div className="mt-0.5 text-base font-semibold">Lernmodus</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Verstehen statt Auswendiglernen.
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground/90">
                              Erklärung, Beispiel und Übung mit Feedback.
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <MetaBadge icon={<Timer className="h-3.5 w-3.5" />} label="45-60 min" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden rounded-2xl border bg-background/70 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-18px_rgba(15,23,42,0.45)]">
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/8 via-transparent to-amber-500/10" />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
                        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                      </div>
                      <CardContent className="relative p-4 max-md:py-1.5">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl border bg-amber-500/10">
                            <Target className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                              Schritt 2
                            </div>
                            <div className="mt-0.5 text-base font-semibold">Prüfungsmodus</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Realistische Prüfungssituation.
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground/90">
                              Ohne Hilfe, mit realitätsnaher Bewertung.
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <MetaBadge icon={<Gauge className="h-3.5 w-3.5" />} label="klarer Prüfungsstand" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden rounded-2xl border bg-background/70 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.38)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-18px_rgba(15,23,42,0.45)]">
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/8 via-transparent to-amber-500/10" />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
                        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                      </div>
                      <CardContent className="relative p-4 max-md:py-1.5">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl border bg-amber-500/10">
                            <Brain className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                              Schritt 3
                            </div>
                            <div className="mt-0.5 text-base font-semibold">Fehlertraining</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Trainiere nur deine Schwächen.
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground/90">
                              Wiederholt automatisch offene Fehler.
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <MetaBadge icon={<Timer className="h-3.5 w-3.5" />} label="zeit-effizient" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-2.5 md:grid-cols-2 md:gap-3">
                    <div className="relative overflow-hidden rounded-2xl border bg-background/55 p-4 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.36)] backdrop-blur-sm">
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/12 via-transparent to-sky-400/10" />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
                        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                      </div>

                      <div className="relative">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-base font-semibold">Training System</div>
                          <div className="inline-flex items-center gap-2 text-xs">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span className="text-muted-foreground">ready</span>
                          </div>
                        </div>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          Dein Lernsystem passt sich automatisch an.
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Fortschritt</span>
                          <span>72%</span>
                        </div>
                        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-muted/70">
                          <div className="h-full w-[72%] bg-gradient-to-r from-amber-400/75 to-amber-200/45" />
                        </div>
                        <div className="mt-1.5 text-xs text-muted-foreground">
                          Nächster Fokus: Prüfung unter Zeitdruck sicher lösen.
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border bg-background/55 p-4 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.36)] backdrop-blur-sm">
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/12 via-transparent to-sky-400/10" />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
                        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                      </div>

                      <div className="relative">
                        <div className="text-base font-semibold">Kernprinzipien</div>
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
                          <MiniLogo name="Prüfungslogik" />
                          <MiniLogo name="Fehlertraining" />
                          <MiniLogo name="Modulare Inhalte" />
                          <MiniLogo name="Prüfungsmodus" />
                          <MiniLogo name="Messbarer Fortschritt" />
                          <MiniLogo name="Gezieltes Lernen" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* VALUE GRID */}
          <section className="space-y-4">
            <div className="md:hidden">
              <WaitlistForm />
            </div>
            <SectionHeader
              title="Ein System, das sich wie Praxis anfühlt"
              desc="Ruhiges UI, klare Schritte, messbarer Fortschritt - und sauber erweiterbar."
            />

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Einfach & praxisnah",
                  label: "Didaktik",
                  desc: "Schritt-für-Schritt mit Feedback - nicht akademisch, sondern Azubi-tauglich.",
                },
                {
                  title: "Prüfungslogik im Fokus",
                  label: "Ergebnis",
                  desc: "Du trainierst genau das, was zählt: Teilpunkte, Zeitdruck, typische Fallen.",
                },
                {
                  title: "Frühzugang mit Plan",
                  label: "Launch",
                  desc: "Zum Start erhältst du direkten Zugang und klare nächste Schritte per E-Mail.",
                },
              ].map((it) => (
                <Card
                  key={it.title}
                  className="relative overflow-hidden rounded-2xl border bg-background/75 shadow-sm backdrop-blur-sm"
                >
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/8 via-transparent to-amber-500/10" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
                    <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                  </div>

                  <CardContent className="relative p-6 max-md:py-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 text-amber-300" /> {it.label}
                    </div>
                    <div className="mt-2 text-xl font-semibold">{it.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* WORKFLOW */}
          <section className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                <span className="whitespace-nowrap">Drei Schritte - ein sauberer Lernflow</span>
              </h2>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Wie ein Training: erst verstehen, dann prüfen, dann gezielt verbessern.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { t: "1. Lernen", d: "Erklärung + Beispiel + Übung mit Lösung & Feedback." },
                { t: "2. Prüfung", d: "Ohne Hilfe. Bewertet. Teilpunkte wie in der Prüfung." },
                { t: "3. Fehlertraining", d: "Automatisch nur Schwächen üben - effizient & motivierend." },
              ].map((x) => (
                <Card
                  key={x.t}
                  className="relative overflow-hidden rounded-2xl border bg-background/75 shadow-sm backdrop-blur-sm"
                >
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/8 via-transparent to-amber-500/10" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
                    <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
                  </div>
                  <CardContent className="relative p-6 max-md:py-2 max-md:text-sm max-md:leading-snug">
                    <div className="text-sm font-medium">{x.t}</div>
                    <p className="mt-2 text-sm text-muted-foreground max-md:text-sm max-md:leading-snug">
                      {x.d}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FOOTER CTA */}
           <Panel className="mt-3 p-6 md:p-8" accent="sky">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Bald live</div>
                <div className="mt-1 text-xl font-semibold md:whitespace-nowrap">Sichere dir Early Access zur LernWerkFabrik</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Die Plattform startet in Kürze. Trage dich ein und wir informieren
                  <br />
                  dich direkt zum Launch.
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 md:flex-1 md:items-end">
                <WaitlistForm
                  buttonLabel="Warteliste beitreten"
                  inputClassName="md:w-[24rem]"
                  className="md:ml-auto md:w-[36rem] md:[&>div]:justify-end [&>p]:md:text-right"
                />
                <div className="ml-1 border-l border-border/80 pl-3 text-[0.82rem] text-foreground/80 dark:text-white/85 md:hidden">
                  <ul className="space-y-2.5">
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-foreground/70 dark:text-white/80">
                        ✓
                      </span>
                      <span>Für AP1 & AP2 entwickelt</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-foreground/70 dark:text-white/80">
                        ✓
                      </span>
                      <span>Prüfungsnah wie die echte Aufgabe</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-foreground/70 dark:text-white/80">
                        ✓
                      </span>
                      <span>Kein Auswendiglernen nötig</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
