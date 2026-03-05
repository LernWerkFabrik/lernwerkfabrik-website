import type { Metadata } from "next";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    id: "item-1",
    question: "Was ist LernWerkFabrik?",
    answer:
      "LernWerkFabrik ist eine Lern- und Trainingsplattform fuer Azubis in technischen Berufen. Der Fokus liegt auf pruefungsnahen Aufgaben, klaren Erklaerungen und gezieltem Fehlertraining.",
  },
  {
    id: "item-2",
    question: "Kann ich kostenlos starten?",
    answer:
      "Ja. Du kannst mit den Free-Modulen starten und die Plattform kennenlernen. Fuer erweiterte Funktionen oder mehr Inhalte gibt es zusaetzliche Optionen auf der Preisseite.",
  },
  {
    id: "item-3",
    question: "Wie laeuft das Lernen in der Plattform ab?",
    answer:
      "Der Lernflow folgt drei Schritten: Lernen, Pruefen und Fehlertraining. So trainierst du erst Verstaendnis, dann pruefungsnah und wiederholst am Ende gezielt deine Schwaechen.",
  },
  {
    id: "item-4",
    question: "Sind meine Lernversuche privat?",
    answer:
      "Ja. Deine individuellen Antworten und Lernversuche bleiben privat. Weitere Details findest du auf der Seite Datenschutz & Privatsphaere.",
  },
  {
    id: "item-5",
    question: "Wie kann ich Support kontaktieren?",
    answer:
      "Du erreichst uns ueber den Kontaktbereich oder per E-Mail an support@lernwerkfabrik.de. Fuer Betriebe gibt es zusaetzlich einen eigenen Kontaktweg auf der Business-Seite.",
  },
];

export const metadata: Metadata = {
  title: "FAQ | LernWerkFabrik",
  description: "Haeufige Fragen und Antworten zur LernWerkFabrik.",
  robots: { index: true, follow: true },
};

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Support
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h1>
        <p className="text-sm text-muted-foreground">
          Die wichtigsten Fragen zur Plattform, Nutzung und zum Support.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border bg-background/70 p-5 shadow-sm backdrop-blur">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/pricing">
          Preise
        </Link>
        <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/business/contact">
          Kontakt
        </Link>
        <Link className="underline underline-offset-4 text-muted-foreground hover:text-foreground" href="/privacy/learn">
          Datenschutz & Privatsphaere
        </Link>
      </div>
    </main>
  );
}
