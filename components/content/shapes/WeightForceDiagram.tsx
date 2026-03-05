import React from "react";

type Props = {
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

export default function WeightForceDiagram({
  size = 200,
  offsetX = 0,
  offsetY = -17,
}: Props) {
  const w = size;
  const h = Math.round(size * 0.85);

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
      aria-label="Gewichtskraftdiagramm"
    >
      {/* Block – dezente Schattierung wie Referenz */}
      <rect
        x={p(80, 50).x}
        y={p(80, 50).y}
        width="100"
        height="70"
        rx="14"
        fill="currentColor"
        opacity="0.05"
      />
      <rect
        x={p(80, 50).x}
        y={p(80, 50).y}
        width="100"
        height="70"
        rx="14"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.95"
      />

      {/* Masse */}
      <text
        x={p(130, 92).x}
        y={p(130, 92).y}
        textAnchor="middle"
        fontSize="20"
        fill="currentColor"
        opacity="0.9"
      >
        m
      </text>

      {/* Kraftpfeil F_G – schlank & ruhig */}
      <path
        d={`M${p(130, 120).x} ${p(130, 120).y} V${185 + offsetY}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d={`
          M${p(130, 185).x} ${p(130, 185).y}
          L${p(120, 168).x} ${p(120, 168).y}
          M${p(130, 185).x} ${p(130, 185).y}
          L${p(140, 168).x} ${p(140, 168).y}
        `}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Beschriftung F_G */}
      <text
        x={p(148, 158).x}
        y={p(148, 158).y}
        fontSize="20"
        fill="currentColor"
        opacity="0.95"
      >
        F
      </text>
      <text
        x={p(160, 162).x}
        y={p(160, 162).y}
        fontSize="17"
        fill="currentColor"
        opacity="0.95"
      >
        G
      </text>

      {/* g-Hinweis */}
      <text
        x={p(130, 210).x}
        y={p(130, 210).y}
        textAnchor="middle"
        fontSize="17"
        fill="currentColor"
        opacity="0.75"
      >
        g ≈ 9,81 m/s²
      </text>
    </svg>
  );
}
