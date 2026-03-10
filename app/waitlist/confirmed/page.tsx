import type { Metadata } from "next";
import Link from "next/link";

import WaitlistConfirmedTracker from "./WaitlistConfirmedTracker";

export const metadata: Metadata = {
  title: "Warteliste bestätigt | LernWerkFabrik",
  description: "Bestätigung der Wartelisten-Anmeldung bei LernWerkFabrik.",
  robots: { index: false, follow: false },
};

type SearchParams = {
  status?: string;
};

function StatusContent({ status }: { status: string }) {
  if (status === "success") {
    return (
      <>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Anmeldung bestätigt
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Deine Anmeldung ist jetzt bestätigt.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Du stehst jetzt auf der Warteliste von LernWerkFabrik. Die ersten 100 können
          LernWerkFabrik kostenlos testen und erhalten zum Launch einen reduzierten Preis.
        </p>
      </>
    );
  }

  if (status === "invalid") {
    return (
      <>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Link nicht mehr gültig
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Dieser Bestätigungslink ist nicht mehr gültig.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Wenn du dich noch einmal einträgst, schicken wir dir direkt einen neuen
          Bestätigungslink.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-300">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
        Bestätigung offen
      </div>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        Die Bestätigung konnte gerade nicht abgeschlossen werden.
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
        Bitte versuche es in ein paar Minuten erneut oder trage dich einfach noch einmal ein.
      </p>
    </>
  );
}

export default async function WaitlistConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status } = await searchParams;
  const normalizedStatus =
    status === "success" || status === "invalid" || status === "error" ? status : "invalid";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-3xl items-center px-4 py-10 md:px-6">
      <section className="w-full rounded-3xl border bg-background/70 p-6 shadow-sm backdrop-blur md:p-8">
        <WaitlistConfirmedTracker status={normalizedStatus} />

        <div className="space-y-4">
          <StatusContent status={normalizedStatus} />

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium text-foreground transition hover:bg-background/80"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
