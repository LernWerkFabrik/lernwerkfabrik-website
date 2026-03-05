"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "lwf_seen_inhalte_intro_v1";

function AccentLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
  );
}

export default function InhalteIntroClient() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      setIsVisible(!seen);
    } catch {
      // Wenn storage blockiert ist, zeigen wir das Intro trotzdem an.
      setIsVisible(true);
    }
  }, []);

  const onDismiss = () => {
    setIsVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const chips = useMemo(
    () => [
      "Ohne Anmeldung starten",
      "Struktur & Themen ansehen",
      "Prüfungslogik statt Kurs",
      "Fehlertraining als Kern",
    ],
    []
  );

  if (!isVisible) return null;

  return (
    <section className="mt-6">
      <Card className="relative overflow-hidden rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <AccentLine />

        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Erstmal kurz orientieren</CardTitle>
              <p className="text-sm text-muted-foreground">
                Du kannst hier alles ansehen und starten –{" "}
                <span className="text-foreground">ohne Anmeldung</span>. Login brauchst du erst,
                wenn du Fortschritt speichern oder Pro nutzen willst.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={onDismiss}
              aria-label="Intro ausblenden"
              title="Intro ausblenden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {chips.map((t) => (
              <Badge key={t} variant="outline" className="rounded-full">
                {t}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="text-sm font-medium">1) Einstieg wählen</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Starte mit Grundlagen oder springe direkt in ein Thema.
              </p>
            </div>

            <div className="rounded-xl border bg-background/60 p-4">
              <div className="text-sm font-medium">2) Modul ansehen</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Struktur & Themen checken – bevor du Zeit investierst.
              </p>
            </div>

            <div className="rounded-xl border bg-background/60 p-4">
              <div className="text-sm font-medium">3) Prüfungsmodus nutzen</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Pro schaltet Prüfungen, Auswertung & Fehlertraining frei.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full rounded-full sm:w-auto">
              <Link href="#katalog">
                Direkt im Katalog starten <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
              <Link href="/pricing">
                Free vs Pro ansehen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-full sm:ml-auto sm:w-auto"
              onClick={onDismiss}
            >
              Verstanden
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
