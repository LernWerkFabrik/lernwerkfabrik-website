// app/inhalte/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { listModules } from "@/lib/content";
import { getUser } from "@/lib/auth";

import ModuleListClient from "@/app/module/ModuleListClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

function AccentLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
  );
}

const heroBadgeClass =
  "rounded-full border-amber-400/68 bg-amber-100/55 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_20px_-16px_rgba(251,191,36,0.9)] dark:border-amber-300/32 dark:bg-amber-300/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

export default async function InhaltePage() {
  const cookieStore = await cookies();
  const modules = await listModules();
  const userRes = await getUser({ cookies: cookieStore });
  const devPlanOverride = cookieStore.get("lp_dev_plan")?.value;

  const userPlan: "free" | "pro" = userRes.ok && userRes.data?.plan === "pro" ? "pro" : "free";
  const effectivePlan: "free" | "pro" =
    devPlanOverride === "pro" || devPlanOverride === "free" ? devPlanOverride : userPlan;
  const isPro = effectivePlan === "pro";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:px-6 md:pb-16 md:pt-10">
      {/* Header */}
      <header className="space-y-3">

        <h1 className="tracking-tight">
          <span className="block text-center text-[2.05rem] font-semibold leading-[1.02] md:hidden">
            Inhalte
          </span>
          <span className="mt-1 block text-center text-[1.2rem] font-medium leading-tight text-foreground/85 md:hidden">
            strukturiert für die Prüfung
          </span>
          <span className="hidden text-3xl font-semibold md:block md:text-4xl">
            Inhalte – strukturiert für die Prüfung
          </span>
        </h1>

        <p className="max-w-2xl text-base text-muted-foreground">
          Stöbere durch alle Module und starte mit einem klaren Ablauf:{" "}
          <span className="whitespace-nowrap">
            <span className="text-foreground">Lernen</span> →{" "}
            <span className="text-foreground">Üben</span> →{" "}
            <span className="text-foreground">Prüfen</span> →{" "}
            <span className="text-foreground">Fehlertraining</span>
          </span>
          .
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className={heroBadgeClass}>
            AP1 / AP2
          </Badge>
          <Badge variant="outline" className={heroBadgeClass}>
            Prüfungslogik
          </Badge>
          <Badge variant="outline" className={heroBadgeClass}>
            Wiederholbares System
          </Badge>
        </div>
      </header>

      {/* Einstieg */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="relative rounded-2xl border bg-background/80 shadow-md backdrop-blur">
          <AccentLine />
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">
              {isPro ? "Empfohlene Module" : "Empfohlener Einstieg"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? "Diese Module sind für deine aktuelle Lernphase besonders sinnvoll."
                : "Neu hier? Sieh dir die empfohlenen Startmodule an – ohne Anmeldung."}
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-full">
              <a href="#katalog">
                {isPro ? "Module öffnen" : "Empfohlenen Einstieg öffnen"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">
              {isPro ? "Alle Module & Inhalte" : "Erst schauen, dann entscheiden"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? "Vollständiger Zugriff auf alle Trainingsmodule und Aufgaben."
                : "Sieh dir Themen und Struktur an. Starten kannst du nach kostenloser Anmeldung."}
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full rounded-full">
              <a href="#modul-katalog">
                Katalog öffnen <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
          <AccentLine />
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">
              {isPro ? "Prüfungsmodus & Zusatzfunktionen" : "Pro & Prüfungsmodus"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? "Realistische Prüfungs-Simulatoren, Auswertung und Fehlertraining."
                : "Zusatzinhalte, unbegrenzte Prüfungen, Fehlertraining & Auswertung."}
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={isPro ? "/exam/technische-berechnungen" : "/pricing"}>
                {isPro ? "Prüfungsmodus öffnen" : "Preise ansehen"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Katalog */}
      <section id="katalog" className="mt-10 scroll-mt-24 space-y-3">
        <ModuleListClient modules={modules} />
      </section>
    </main>
  );
}
