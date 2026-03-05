"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";

function AccentLine() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[2px]
      bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
    />
  );
}

export default function BusinessContactPage() {
  const [company, setCompany] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [count, setCount] = React.useState("");
  const [message, setMessage] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = encodeURIComponent("Pilotprojekt Anfrage - LernWerkFabrik");
    const body = encodeURIComponent(
      `Firma: ${company}
Name: ${name}
E-Mail: ${email}
Anzahl Azubis: ${count}

Nachricht:
${message}
`
    );

    window.location.href = `mailto:kontakt@deine-domain.de?subject=${subject}&body=${body}`;
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 p-4 md:p-6">
      {/* HEADER */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Kontakt
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Pilotprojekt starten
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Wir stellen Ihnen die Plattform persönlich vor und prüfen gemeinsam,
          wie LernWerkFabrik in Ihrem Ausbildungsbetrieb sinnvoll eingesetzt
          werden kann. Unverbindlich. Ohne Verpflichtung.
        </p>
      </section>

      {/* FORM */}
      <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <AccentLine />
        <CardHeader className="space-y-2">
          <CardTitle>Kontaktformular</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-amber-400/60 bg-amber-500/10 text-foreground"
            >
              Unverbindlich
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-border/60 text-muted-foreground"
            >
              Kein Account nötig
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Unternehmen"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
              <Input
                placeholder="Name Ansprechpartner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                type="email"
                placeholder="Geschäftliche E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                placeholder="Anzahl Azubis (optional)"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>

            <Textarea
              placeholder="Worum geht es? (z. B. Ausbildungsberuf, Anzahl Azubis, geplanter Startzeitraum)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-400" />
                <p>
                  Ihre Angaben werden ausschließlich zur Bearbeitung Ihrer
                  Anfrage verwendet. Weitere Informationen finden Sie in unserer{" "}
                  <Link
                    href="/privacy/learn"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Datenschutzerklärung
                  </Link>
                  .
                </p>
              </div>

              <div className="flex flex-col gap-2 md:items-end">
                <Button type="submit" className="rounded-full">
                  Pilotprojekt anfragen <Mail className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground md:text-right">
                  Wir melden uns zeitnah bei Ihnen.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* BACK */}
      <div>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/business">
            Zurück zur B2B-Seite <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
