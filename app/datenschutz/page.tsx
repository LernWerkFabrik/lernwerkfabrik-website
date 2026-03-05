import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

export default function DatenschutzPage() {
  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Datenschutz</h1>

      <Card className="mt-5 rounded-2xl border bg-background/75 shadow-sm backdrop-blur-sm">
        <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
          <p>Wird ergänzt.</p>
          <p>
            Bis zur finalen Version findest du rechtliche Basisinformationen im{" "}
            <Link href="/impressum" className="underline underline-offset-4">
              Impressum
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
