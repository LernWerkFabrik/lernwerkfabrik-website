import React from "react";

type Props = {
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

export default function PressureArea({
  size = 180,
  offsetX = 0,
  offsetY = -20,
}: Props) {
  const s = size;

  // helper for global offset
  const p = (x: number, y: number) => ({
    x: x + offsetX,
    y: y + offsetY,
  });

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Druckdiagramm"
    >
      {/* Surface plate – subtle shading */}
      <rect
        x={p(55, 120).x}
        y={p(55, 120).y}
        width="150"
        height="55"
        rx="10"
        fill="currentColor"
        opacity="0.05"
      />
      <rect
        x={p(55, 120).x}
        y={p(55, 120).y}
        width="150"
        height="55"
        rx="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.95"
      />

      {/* Downward force arrow */}
      <path
        d={`M${p(130, 45).x} ${p(130, 45).y} V${110 + offsetY}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d={`
          M${p(130, 110).x} ${p(130, 110).y}
          L${p(120, 98).x} ${p(120, 98).y}
          M${p(130, 110).x} ${p(130, 110).y}
          L${p(140, 98).x} ${p(140, 98).y}
        `}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Force label */}
      <text
        x={p(146, 70).x}
        y={p(146, 70).y}
        fill="currentColor"
        fontSize="20"
        opacity="0.95"
      >
        F
      </text>

      {/* Area label */}
      <text
        x={p(130, 155).x}
        y={p(130, 155).y}
        textAnchor="middle"
        fill="currentColor"
        fontSize="20"
        opacity="0.9"
      >
        A
      </text>

      {/* Pressure formula – centered */}
      <text
        x={p(130, 205).x}
        y={p(130, 205).y}
        textAnchor="middle"
        fill="currentColor"
        fontSize="18"
        opacity="0.75"
      >
        p = F / A
      </text>
    </svg>
  );
}
