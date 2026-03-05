import React from "react";

type Props = { size?: number; className?: string };

export default function TzQuickChecksDiagram({ size = 240, className }: Props) {
  const w = 520;
  const h = 220;
  const outW = Math.max(220, Math.round(size));
  const outH = Math.round((outW * h) / w);

  const row = (y: number, text: string) => (
    <g key={y}>
      <rect x="34" y={y - 12} width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d={`M 38 ${y - 4} L 42 ${y} L 48 ${y - 8}`} fill="none" stroke="currentColor" strokeWidth="1.8" />
      <text x="60" y={y + 1} fontSize="14.5" fill="currentColor">
        {text}
      </text>
    </g>
  );

  return (
    <svg
      width={outW}
      height={outH}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Schnellchecks fuer technische Zeichnungen"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <rect x="18" y="18" width="484" height="184" rx="14" fill="none" stroke="currentColor" strokeWidth="2.1" />
      <text x="34" y="44" fontSize="16" fontWeight="700" fill="currentColor">
        Schnell-Checks
      </text>

      {[
        [68, "Ø = 2R kontrollieren"],
        [94, "Max > Nenn > Min"],
        [120, "Skala: 1:2 echt groesser / 2:1 kleiner"],
        [146, "Fase: a x 45deg  ->  l = a * sqrt(2)"],
        [172, "Ergebnis immer mit Einheit (mm)"],
      ].map(([y, text]) => row(y as number, text as string))}
    </svg>
  );
}

