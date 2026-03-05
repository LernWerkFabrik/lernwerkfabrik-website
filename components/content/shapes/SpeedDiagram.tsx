import React from "react";

type Props = {
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

export default function SpeedDiagram({
  size = 185,
  offsetX = 0,
  offsetY = 0,
}: Props) {
  const w = size;
  const h = Math.round(size * 0.86);

  const p = (x: number, y: number) => ({
    x: x + offsetX,
    y: y + offsetY,
  });

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Geschwindigkeitsdiagramm"
    >
      {/* s axis (horizontal) */}
      <path
        d={`M${p(48, 150).x} ${p(48, 150).y} H${p(220, 150).x}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d={`M${p(220, 150).x} ${p(220, 150).y}
            L${p(208, 142).x} ${p(208, 142).y}
            M${p(220, 150).x} ${p(220, 150).y}
            L${p(208, 158).x} ${p(208, 158).y}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />
      <text
        x={p(228, 170).x}
        y={p(228, 170).y}
        fontSize="20"
        fill="currentColor"
        opacity="0.9"
        fontFamily="ui-sans-serif, system-ui"
      >
        s
      </text>

      {/* t axis (vertical dashed) */}
      <path
        d={`M${p(70, 176).x} ${p(70, 176).y} V${p(70, 66).y}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
        strokeDasharray="6 6"
      />
      <text
        x={p(52, 76).x}
        y={p(52, 76).y}
        fontSize="20"
        fill="currentColor"
        opacity="0.8"
        fontFamily="ui-sans-serif, system-ui"
      >
        t
      </text>

      {/* motion curve + arrow (v) */}
      <path
        d={`M${p(84, 132).x} ${p(84, 132).y}
            C${p(124, 102).x} ${p(124, 102).y},
             ${p(164, 102).x} ${p(164, 102).y},
             ${p(206, 116).x} ${p(206, 116).y}`}
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d={`M${p(206, 116).x} ${p(206, 116).y}
            L${p(194, 108).x} ${p(194, 108).y}
            M${p(206, 116).x} ${p(206, 116).y}
            L${p(194, 124).x} ${p(194, 124).y}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />

      <text
        x={p(166, 98).x}
        y={p(166, 98).y}
        fontSize="20"
        fill="currentColor"
        opacity="0.95"
        fontFamily="ui-sans-serif, system-ui"
        textAnchor="middle"
      >
        v
      </text>
    </svg>
  );
}
