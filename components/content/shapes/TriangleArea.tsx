import React from "react";

export default function TriangleArea({ size = 180 }: { size?: number }) {
  const s = size;

  // ViewBox-System
  const VBW = 240;
  const VBH = 220;

  // Dreieck (wie bei dir)
  const P1 = { x: 50, y: 160 };  // links unten
  const P2 = { x: 190, y: 160 }; // rechts unten
  const P3 = { x: 140, y: 60 };  // Spitze

  // Höhe (Fußpunkt senkrecht unter Spitze auf Grundlinie)
  const H = { x: P3.x, y: P1.y };

  // Inset, damit die gestrichelte Linie oben nicht in die Spitze "klebt"
  const hTopInset = 10;
  const hBottomInset = 8;

  // Maßlinie g
  const gY = 185;
  const tickHalf = 10;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  const strokeCommon = {
    stroke: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${VBW} ${VBH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Dreieck mit Grundseite g und Höhe h"
    >
      {/* Fläche */}
      <path
        d={`M ${P1.x} ${P1.y} L ${P2.x} ${P2.y} L ${P3.x} ${P3.y} Z`}
        fill="currentColor"
        opacity="0.08"
      />

      {/* Kontur */}
      <path
        d={`M ${P1.x} ${P1.y} L ${P2.x} ${P2.y} L ${P3.x} ${P3.y} Z`}
        {...strokeCommon}
        strokeWidth={4}
        opacity={0.95}
      />

      {/* Höhe h (gestrichelt, sauber inset + butt caps) */}
      <line
        x1={H.x}
        y1={P3.y + hTopInset}
        x2={H.x}
        y2={H.y - hBottomInset}
        stroke="currentColor"
        strokeWidth={3}
        opacity={0.7}
        strokeDasharray="6 6"
        strokeLinecap="butt"
        vectorEffect="non-scaling-stroke"
      />

      {/* h-Label mittig neben der Linie (nicht oben am Eck) */}
      <text
        x={H.x + 12}
        y={(P3.y + hTopInset + (H.y - hBottomInset)) / 2 + 6}
        fill="currentColor"
        fontSize={18}
        fontFamily={fontFamily}
        opacity={0.95}
      >
        h
      </text>

      {/* Optional: rechter Winkel am Fußpunkt (wirkt "korrekt" und ruhig) */}
      <path
        d={`
          M ${H.x} ${H.y - 10}
          L ${H.x + 10} ${H.y - 10}
          L ${H.x + 10} ${H.y}
        `}
        stroke="currentColor"
        strokeWidth={3}
        opacity={0.45}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Maßlinie g */}
      <line
        x1={P1.x}
        y1={gY}
        x2={P2.x}
        y2={gY}
        {...strokeCommon}
        strokeWidth={4}
        opacity={0.9}
      />
      <line
        x1={P1.x}
        y1={gY - tickHalf}
        x2={P1.x}
        y2={gY + tickHalf}
        stroke="currentColor"
        strokeWidth={3}
        opacity={0.9}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
      <line
        x1={P2.x}
        y1={gY - tickHalf}
        x2={P2.x}
        y2={gY + tickHalf}
        stroke="currentColor"
        strokeWidth={3}
        opacity={0.9}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />

      {/* g-Label mittig unter der Maßlinie */}
      <text
        x={(P1.x + P2.x) / 2}
        y={gY + 27}
        fill="currentColor"
        fontSize={18}
        fontFamily={fontFamily}
        opacity={0.95}
        textAnchor="middle"
      >
        g
      </text>
    </svg>
  );
}
