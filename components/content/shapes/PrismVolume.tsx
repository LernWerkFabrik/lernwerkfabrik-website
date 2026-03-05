import React from "react";

export default function PrismVolume({ size = 165 }: { size?: number }) {
  const w = size;
  const hPx = Math.round(size * 0.95);

  // ✅ Verschiebung: nach links (-) und nach oben (-)
  const ox = -27; // <- mehr links: -14, -18 ...
  const oy = -37;  // <- mehr hoch:  -12, -16 ...

  const P = (x: number, y: number) => `${x + ox} ${y + oy}`;
  const Px = (x: number) => x + ox;
  const Py = (y: number) => y + oy;

  return (
    <svg
      width={w}
      height={hPx}
      viewBox="0 0 260 220"
      role="img"
      aria-label="Volumen eines Prismas: V = A_G · h"
      style={{ display: "block", margin: "0 auto" }}
    >
      {/* Grundfläche (A_G) – leicht schattiert */}
      <path
        d={`M ${P(92, 142)} L ${P(192, 142)} L ${P(192, 192)} L ${P(92, 192)} Z`}
        fill="currentColor"
        opacity="0.10"
      />

      {/* Deckfläche */}
      <path
        d={`M ${P(132, 92)} L ${P(232, 92)} L ${P(232, 142)} L ${P(132, 142)} Z`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.95"
      />

      {/* Sichtbare Kanten */}
      <path
        d={`M ${P(92, 142)} L ${P(192, 142)} L ${P(192, 192)} L ${P(92, 192)} Z`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path
        d={`M ${P(92, 142)} L ${P(132, 92)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path
        d={`M ${P(192, 142)} L ${P(232, 92)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path
        d={`M ${P(192, 192)} L ${P(232, 142)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        opacity="0.95"
      />

      {/* Verdeckte Kanten gestrichelt */}
      <path
        d={`M ${P(92, 192)} L ${P(132, 142)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.35"
        strokeDasharray="6 6"
        strokeLinejoin="round"
      />
      <path
        d={`M ${P(132, 142)} L ${P(232, 142)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.35"
        strokeDasharray="6 6"
        strokeLinejoin="round"
      />

      {/* Hilfslinien (kleine Striche zur Kante) */}
      <path d={`M ${P(86, 142)} H ${Px(72)}`} stroke="currentColor" strokeWidth="3" opacity="0.4" />
      <path d={`M ${P(86, 192)} H ${Px(72)}`} stroke="currentColor" strokeWidth="3" opacity="0.4" />

      {/* Maßlinie links */}
      <path
        d={`M ${P(78, 142)} V ${Py(192)}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Pfeilspitzen (innen) */}
      <polygon
        points={`${Px(78)},${Py(142)} ${Px(74)},${Py(150)} ${Px(82)},${Py(150)}`}
        fill="currentColor"
        opacity="0.95"
      />
      <polygon
        points={`${Px(78)},${Py(192)} ${Px(74)},${Py(184)} ${Px(82)},${Py(184)}`}
        fill="currentColor"
        opacity="0.95"
      />

      {/* h Label mittig */}
      <text x={Px(60)} y={Py(170)} fontSize="18" fontWeight="700" fill="currentColor" opacity="0.95">
        h
      </text>

      {/* Rechtwinkelsymbol an der Grundfläche (links unten) */}
      <path
        d={`M ${P(86, 192)} H ${Px(98)} V ${Py(180)}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.6"
        strokeLinejoin="round"
      />

      {/* Label Grundfläche */}
      <text x={Px(142)} y={Py(214)} textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.85">
        Grundfläche A_G
      </text>
    </svg>
  );
}
