import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

function AccentLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]
      bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
  );
}

/* ----------------------------- mock data ----------------------------- */

const stats = [
  { label: "Azubis", value: "12", icon: <Users className="h-5 w-5 text-amber-400" /> },
  { label: "Aktive Module", value: "5", icon: <BookOpen className="h-5 w-5 text-amber-400" /> },
  { label: "Ø Prüfungsquote", value: "68 %", icon: <BarChart3 className="h-5 w-5 text-amber-400" /> },
  { label: "Unterstützungsbedarf", value: "3", icon: <AlertTriangle className="h-5 w-5 text-amber-400" /> },
];

const trainees = [
  { id: "Azubi A", progress: 80, lastExam: "bestanden", status: "good" },
  { id: "Azubi B", progress: 45, lastExam: "nicht bestanden", status: "bad" },
  { id: "Azubi C", progress: 60, lastExam: "knapp", status: "warn" },
  { id: "Azubi D", progress: 90, lastExam: "bestanden", status: "good" },
];

const modules = [
  { id: "Einheiten & Umrechnung", status: "gut" },
  { id: "Kräfte & Gewichtskraft", status: "mittel" },
  { id: "Arbeit & Leistung", status: "schwach" },
  { id: "Toleranzen & Passungen", status: "schwach" },
];

export default function InstructorDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6 space-y-10">
      {/* HEADER */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Beispielansicht – Ausbilder-Dashboard
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Überblick über den Lernstand
        </h1>

        <p className="max-w-2xl text-base text-muted-foreground">
          Diese Ansicht zeigt beispielhaft, wie Ausbildungsbetriebe Lernfortschritt
          zusammengefasst und unterstützend begleiten können.
        </p>
      </section>

      {/* PRIVACY NOTE */}
      <Card className="relative rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <AccentLine />
        <CardContent className="p-6 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Hinweis:</strong>  
            Diese Übersicht dient ausschließlich der Unterstützung.
            Es werden <strong>keine einzelnen Antworten</strong>,
            <strong>keine Lösungswege</strong> und
            <strong>keine privaten Lernversuche</strong> angezeigt.
          </p>
        </CardContent>
      </Card>

      {/* STATS */}
      <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <AccentLine />
        <CardContent className="grid gap-6 p-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border bg-amber-500/10">
                {s.icon}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-lg font-semibold">{s.value}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* TRAINEES */}
      <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <AccentLine />
        <CardHeader>
          <CardTitle>Azubi-Übersicht (anonymisiert)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {trainees.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="font-medium">{t.id}</div>
              <div className="text-muted-foreground">
                Fortschritt: {t.progress} %
              </div>
              <div className="flex items-center gap-2">
                {t.status === "good" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {t.status === "warn" && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                {t.status === "bad" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                <span className="text-muted-foreground">{t.lastExam}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* MODULE STATUS */}
      <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <AccentLine />
        <CardHeader>
          <CardTitle>Modul-Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {modules.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
            >
              <div>{m.id}</div>
              <Badge
                variant={
                  m.status === "gut"
                    ? "secondary"
                    : m.status === "mittel"
                    ? "outline"
                    : "destructive"
                }
              >
                {m.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="relative rounded-2xl border bg-background/80 shadow-md backdrop-blur">
        <AccentLine />
        <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-amber-400" />
              Interesse an einer echten Umsetzung?
            </div>
            <p className="text-sm text-muted-foreground">
              Gerne zeigen wir, wie dieses Dashboard mit echten Daten aussehen kann.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/business/contact">Kontakt aufnehmen</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
