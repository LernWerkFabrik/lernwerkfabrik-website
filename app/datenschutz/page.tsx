import type { Metadata } from "next";
import HomeResetLink from "@/app/HomeResetLink";
import ScrollResetLink from "@/app/ScrollResetLink";

import { Card, CardContent } from "@/components/ui/card";
import { PRIVACY_STATIC_HTML } from "@/app/datenschutz/privacyStaticHtml";

export const metadata: Metadata = {
  title: "Datenschutz | LernWerkFabrik",
  description: "Datenschutzhinweise der LernWerkFabrik.",
  robots: { index: true, follow: true },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-2xl border bg-background/70 p-5 shadow-sm backdrop-blur">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Rechtliches
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Datenschutz</h1>
        <p className="text-sm text-muted-foreground">
          Diese Hinweise beschreiben die Verarbeitung personenbezogener Daten auf der Wartelisten-Landingpage.
        </p>
      </header>

      <div className="mt-6 grid gap-4">
        <Section title="Datenschutzerklärung">
          <div
            className="[&_a]:underline [&_a]:underline-offset-4 [&_h1]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-medium [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-medium [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-medium [&_li]:my-1 [&_p]:my-2 [&_p]:text-sm [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: PRIVACY_STATIC_HTML }}
          />
        </Section>

        <Card className="rounded-2xl border bg-background/75 shadow-sm backdrop-blur-sm">
          <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
            <p>
              Für Fragen zum Datenschutz können Sie sich jederzeit über die im Impressum angegebenen
              Kontaktdaten an uns wenden.
            </p>
            <div className="flex flex-wrap gap-3">
              <ScrollResetLink className="underline underline-offset-4 hover:text-foreground" href="/impressum">
                Zum Impressum
              </ScrollResetLink>
              <HomeResetLink className="underline underline-offset-4 hover:text-foreground" href="/">
                Zur Startseite
              </HomeResetLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
