"use client";

import QuestionDot from "./QuestionDots";

type Props = {
  ids: string[];
  activeIndex: number;
  onGoTo: (i: number) => void;

  statusById: Record<string, "correct" | "attempted" | undefined>;
  checkedById: Record<string, boolean | undefined>;
  firstCorrectQualityById: Record<string, "clean" | "assisted" | undefined>;
};

export default function QuestionNav({
  ids,
  activeIndex,
  onGoTo,
  statusById,
  checkedById,
  firstCorrectQualityById,
}: Props) {
  function overlayDot(id: string) {
    if (!checkedById[id]) return null;

    const st = statusById[id];
    if (st === "correct") {
      return firstCorrectQualityById[id] === "assisted" ? (
        <QuestionDot tone="gold" />
      ) : (
        <QuestionDot tone="green" />
      );
    }
    return <QuestionDot tone="red" />;
  }

  return (
    <div
      className={[
        // ✅ Fixes Raster (5×5), auch auf Mobile
        "grid grid-cols-5 gap-2",

        // ✅ Mobile: volle Kartenbreite nutzen, Desktop: kompakt + zentriert
        "w-full md:w-fit mx-auto",

        // ✅ optional: falls mal >25 IDs kommen, bleibt es sauber
        "justify-items-center",
      ].join(" ")}
    >
      {ids.map((id, i) => {
        const active = i === activeIndex;
        const st = statusById[id];
        const isChecked = Boolean(checkedById[id]);

        const isAttempted = st === "attempted";
        const isCorrect = st === "correct";

        // ✅ Wunsch: auch correct soll vollgelb sein
        const fillYellow = isAttempted || isCorrect || isChecked;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onGoTo(i)}
            className={[
              "relative rounded-full inline-flex items-center justify-center",
              "transition-colors select-none",

              // ✅ Größe: Mobile proportional zur verfügbaren Breite, ab md fix
              "w-[82%] aspect-square md:w-9 md:h-9",

              // ✅ aktive Aufgabe klar sichtbar
              active ? "border-2 border-yellow-400" : "border border-yellow-400/40",

              // ✅ Innenfarbe
              fillYellow
                ? "bg-[#E3A923] border-[#E3A923]"
                : "bg-transparent lp-dot-grad-strong hover:brightness-[0.98]",

              // ✅ aktiver Ring (separat)
              active ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-background" : "",

              // ✅ Textfarbe
              fillYellow ? "text-black" : "text-foreground/90",

              // ✅ Fokus sichtbar (Keyboard)
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ].join(" ")}
            aria-label={`Aufgabe ${i + 1}`}
            aria-current={active ? "true" : undefined}
          >
            <span className="text-[12px] sm:text-xs md:text-xs font-medium tabular-nums">{i + 1}</span>
            {overlayDot(id)}
          </button>
        );
      })}
    </div>
  );
}

