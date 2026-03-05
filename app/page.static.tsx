import Image from "next/image";

import WaitlistForm from "@/components/WaitlistForm";

export default function LandingPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-900/40 p-6 md:p-10">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
          <div className="space-y-5">
            <p className="inline-flex rounded-full border border-amber-300/40 bg-amber-200/10 px-3 py-1 text-xs font-medium text-amber-100">
              Plattform ist bald live
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
              Early Access fuer LernWerkFabrik sichern
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 md:text-base">
              Wir starten in Kuerze mit der neuen Lernplattform fuer AP1/AP2. Trag dich jetzt in die
              Warteliste ein und erhalte direkt zum Launch Zugriff.
            </p>
          </div>

          <div className="relative h-20 w-20 md:h-24 md:w-24">
            <Image
              src="/brand/logo-lwf-dark.png"
              alt="LernWerkFabrik Logo"
              fill
              sizes="96px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </section>

      <section
        id="warteliste"
        className="rounded-3xl border border-white/15 bg-slate-900/70 p-5 backdrop-blur md:p-8"
      >
        <h2 className="text-xl font-semibold md:text-2xl">Warteliste beitreten</h2>
        <p className="mt-2 text-sm text-slate-300">
          Wir informieren dich, sobald LernWerkFabrik live geht. Kein Spam.
        </p>
        <div className="mt-5 max-w-2xl">
          <WaitlistForm source="landing-static" buttonLabel="Warteliste beitreten" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          "Pruefungsnahe AP1/AP2 Inhalte",
          "Klare Lernpfade statt Chaos",
          "Start-Info direkt per E-Mail",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/15 bg-slate-900/60 px-4 py-4 text-sm text-slate-200"
          >
            {item}
          </div>
        ))}
      </section>
    </div>
  );
}
