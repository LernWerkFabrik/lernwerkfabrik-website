import React from "react";

type Props = {
  size?: number;

  /** verschiebt die komplette Grafik */
  offsetX?: number;
  offsetY?: number;

  /** skaliert die komplette Grafik (1 = normal) */
  scale?: number;
};

export default function ExamTrapsDiagram({
  size = 165,
  offsetX = 0,
  offsetY = -8,
  scale = 1.01,
}: Props) {
  const w = size;
  const h = Math.round(size * 0.82)+20;

  const line = "currentColor";

  // Größerer vertikaler Schritt
  const startY = 78;
  const stepY = 26;

  const items = [
    { left: "Fläche", right: "mm² ↔ m²" },
    { left: "Volumen", right: "mm³ ↔ m³" },
    { left: "Einheiten", right: "m/s ↔ km/h" },
    { left: "Geometrie", right: "r ≠ d" },
    { left: "Druck", right: "A in m²" },
  ];

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 260 210"
      role="img"
      aria-label="Typische Prüfungsfallen"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
    >
      {/* 🔹 GLOBAL TRANSFORM */}
      <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
        {/* Title */}
        <text
          x="130"
          y="22"
          textAnchor="middle"
          fontSize="15"
          fontWeight="500"
          fill={line}
          opacity="0.9"
          fontFamily="ui-sans-serif, system-ui"
        >
          Prüfungsfallen
        </text>

        {/* Card */}
        <rect
          x="22"
          y="34"
          width="216"
          height="162"
          rx="16"
          stroke={line}
          strokeWidth="2.5"
          fill="none"
          opacity="0.55"
        />

        {/* Column headers */}
        <text
          x="52"
          y="58"
          fontSize="11.5"
          fontWeight="500"
          fill={line}
          opacity="0.6"
          fontFamily="ui-sans-serif, system-ui"
        >
          Thema
        </text>
        <text
          x="206"
          y="58"
          textAnchor="end"
          fontSize="11.5"
          fontWeight="500"
          fill={line}
          opacity="0.6"
          fontFamily="ui-sans-serif, system-ui"
        >
          Denk-Trigger
        </text>

        {/* Items */}
        {items.map((it, i) => {
          const y = startY + i * stepY;
          return (
            <g key={i}>
              {/* warning marker */}
              <path
                d={`M40 ${y - 6} l4 -7 l4 7 z`}
                fill={line}
                opacity={0.85}
              />

              {/* left label */}
              <text
                x="52"
                y={y}
                fontSize="13.5"
                fontWeight="400"
                fill={line}
                opacity="0.92"
                fontFamily="ui-sans-serif, system-ui"
              >
                {it.left}
              </text>

              {/* right trigger */}
              <text
                x="206"
                y={y}
                textAnchor="end"
                fontSize="13.5"
                fontWeight="400"
                fill={line}
                opacity="0.92"
                fontFamily="ui-sans-serif, system-ui"
              >
                {it.right}
              </text>
            </g>
          );
        })}

        {/* Footer mantra */}
        <text
          x="130"
          y="212"
          textAnchor="middle"
          fontSize="12"
          fontWeight="500"
          fill={line}
          opacity="0.7"
          fontFamily="ui-sans-serif, system-ui"
        >
          Erst kurz prüfen – dann rechnen
        </text>
      </g>
    </svg>
  );
}
