import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TransparencyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-6 space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Transparenz: Wer sieht was?
      </h1>

      <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]
          bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

        <CardHeader>
          <CardTitle>Azubis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <Badge variant="secondary">Privat</Badge>
          <ul className="list-disc pl-5 space-y-1">
            <li>Eigene Lernversuche</li>
            <li>Eigene Lösungen & Fehler</li>
            <li>Eigene Ergebnisse</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="relative rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]
          bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

        <CardHeader>
          <CardTitle>Ausbilder / Betriebe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <Badge variant="outline">Aggregiert</Badge>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fortschritt in Prozent</li>
            <li>Status je Modul (grün / gelb / rot)</li>
            <li>Unterstützungsbedarf</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
