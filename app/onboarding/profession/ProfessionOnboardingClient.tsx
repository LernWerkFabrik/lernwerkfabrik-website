"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import Surface from "@/components/Surface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  PROFESSIONS,
  setProfileClient,
  getProfileClient,
  type ProfessionId,
} from "@/lib/profile";
import { getUser } from "@/lib/auth";

/**
 * ProfessionOnboardingClient
 * --------------------------
 * - wählt die Profession (Domain-Daten)
 * - Auth läuft ausschließlich über den Auth-Adapter
 * - Profil-Daten lokal (MVP), später DB
 */
export default function ProfessionOnboardingClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/dashboard";

  const [selected, setSelected] =
    React.useState<ProfessionId>("industriemechaniker");
  const [email, setEmail] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1) Auth prüfen
      const userRes = await getUser();
      if (!userRes.ok || !userRes.data) {
        // Nicht eingeloggt → Login kümmert sich
        if (!cancelled) router.replace("/login");
        return;
      }

      if (!cancelled) {
        setEmail(userRes.data.email);
      }

      // 2) Profil laden (Domain-Daten)
      const profile = getProfileClient();

      if (profile?.professionId) {
        router.replace(redirect);
        return;
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [router, redirect]);

  function save() {
    // Profession als Profil-Daten speichern (MVP)
    setProfileClient({
      ...getProfileClient(),
      professionId: selected,
    });

    router.replace(redirect);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-8 md:px-6">
      <div className="space-y-6">
        <Surface className="p-6 md:p-7 lp-surface-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="lp-kicker">Onboarding</span>
              <Badge variant="secondary" className="rounded-full">
                Berufsauswahl
              </Badge>
            </div>

            <h1 className="lp-h1">Welchen Beruf lernst du?</h1>

            <p className="lp-muted max-w-2xl">
              Diese Auswahl filtert deine Module und Prüfungen. Du kannst das
              später jederzeit ändern.
            </p>

            {email ? (
              <div className="text-xs text-muted-foreground">
                Eingeloggt als{" "}
                <span className="font-mono">{email}</span>
              </div>
            ) : null}
          </div>
        </Surface>

        <Card>
          <CardHeader>
            <CardTitle className="lp-h2">Beruf auswählen</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {PROFESSIONS.map((p) => {
                const active = selected === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={[
                      "relative w-full rounded-2xl border p-4 text-left",
                      "bg-background/70 backdrop-blur shadow-sm",
                      "transition-all duration-200 ease-out",
                      "hover:-translate-y-[1px] hover:shadow-[0_18px_36px_-26px_rgba(0,0,0,0.65)]",
                      "hover:ring-1 hover:ring-primary/12 dark:hover:ring-primary/10",
                      active
                        ? "ring-1 ring-primary/25 border-primary/25"
                        : "border-border/60",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="lp-title">{p.title}</div>
                        {p.subtitle ? (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {p.subtitle}
                          </div>
                        ) : null}
                      </div>
                      {active ? (
                        <CheckCircle2 className="h-5 w-5 text-amber-300" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button variant="outline" asChild className="rounded-full">
                <Link href="/">Zur Startseite</Link>
              </Button>

              <Button onClick={save} className="rounded-full">
                Weiter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Hinweis: Aktuell ist nur Industriemechaniker aktiv. Weitere Berufe
              kommen später dazu.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
