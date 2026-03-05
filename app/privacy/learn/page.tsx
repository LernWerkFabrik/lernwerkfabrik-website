import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function LearnPrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Deine Lern-Privatsphäre
      </h1>

      <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]
          bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

        <CardContent className="p-6 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
            <p>
              <strong className="text-foreground">Dein Lernen gehört dir.</strong>
              <br />
              Erklärungen, Übungen, Fehlertraining und Lernversuche sind privat.
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-1">
            <li>Keine einzelnen Antworten sichtbar</li>
            <li>Keine Lösungswege einsehbar</li>
            <li>Keine Überwachung deines Lernverhaltens</li>
          </ul>

          <p>
            Ausbildungsbetriebe sehen ausschließlich zusammengefasste
            Unterstützungs-Hinweise (z. B. „Modul noch unsicher“),
            um gezielt helfen zu können.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
