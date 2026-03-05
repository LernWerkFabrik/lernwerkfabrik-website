// app/dashboard/page.tsx
import type React from "react";

import Surface from "@/components/Surface";
import DashboardClient from "../DashboardClient";
import { listModules } from "@/lib/content";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, Brain } from "lucide-react";

import DashboardAreasClient from "./DashboardAreasClient";
import ProfessionBadgeClient from "./ProfessionBadgeClient";

function Step({
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
      <div className="shrink-0 rounded-xl border border-border/60 bg-transparent p-2.5 lp-card-grad-subtle">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="lp-title">{title}</div>
        <div className="mt-1.5 lp-caption">{desc}</div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const modules = await listModules();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 max-md:pt-6 max-md:pb-3 md:px-6 md:pb-5 md:pt-7">
      <div className="space-y-8 md:space-y-10">
        {/* START: kompakt, kein Kicker, kein gelber Punkt */}
        <section className="space-y-3 md:space-y-4 max-md:mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="lp-h1">Weiterlernen</h1>
              <p className="lp-muted max-w-2xl">Dein nächster empfohlener Lernschritt</p>
            </div>

            {/* Persönlichkeit rechts oben */}
            <div className="shrink-0">
              <ProfessionBadgeClient showMeta />
            </div>
          </div>

          <Surface className="p-6 md:p-7 lp-surface-1 max-md:mt-2 max-md:mb-4 max-md:pl-3 max-md:pr-3">
            <DashboardClient />
          </Surface>
        </section>

        {/* EINORDNUNG: Lernstand (Option B) */}
        <section className="mt-6 max-md:hidden">
          <div className="p-6 md:p-7 lp-surface-1 lp-card-panel-weak">
            <details open className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="lp-title">Dein Lernstand – richtig eingeordnet</div>
                  <p className="lp-muted max-w-3xl">
                    Kurz und klar, was dein aktueller Stand bedeutet – ohne Druck und ohne Spielereien.
                  </p>
                </div>
                <span className="rounded-full border border-border/40 px-3 py-1 text-xs text-muted-foreground group-open:hidden">
                  Einordnung anzeigen
                </span>
                <span className="rounded-full border border-border/40 px-3 py-1 text-xs text-muted-foreground hidden group-open:inline">
                  Einordnung ausblenden
                </span>
              </summary>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/40 bg-transparent p-4 lp-card-grad-subtle">
                  <div className="font-medium">Was ist jetzt wichtig?</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nicht Tempo – sondern sauberes Rechnen. Achte darauf, Aufgaben möglichst ohne Hilfe zu lösen.
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-transparent p-4 lp-card-grad-subtle">
                  <div className="font-medium">Wie lese ich den Fortschritt?</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ein niedriger Prozentsatz zu Beginn ist normal. Entscheidend ist, dass „richtig“ stabil wird –
                    nicht nur einmal.
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-transparent p-4 lp-card-grad-subtle">
                  <div className="font-medium">Wie geht’s weiter?</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Trainiere erst 2–3 Aufgaben sauber am Stück. Danach prüfen. So wirst du schneller sicher.
                  </p>
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* BEREICHE (fokussiert, kein Modul-Katalog) */}
        <DashboardAreasClient modules={modules as any[]} />

      </div>
    </main>
  );
}
