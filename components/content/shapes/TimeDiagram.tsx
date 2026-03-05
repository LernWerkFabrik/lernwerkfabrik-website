import React from "react";

type Props = {
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

export default function TimeDiagram({
  size = 185,
  offsetX = 0,
  offsetY = -15,
}: Props) {
  const w = size;
  const h = Math.round(size * 0.86);

  // helper for global offset
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
      aria-label="Zeitdiagramm"
    >
      {/* Clock – subtle inner shading */}
      <circle
        cx={p(130, 112).x}
        cy={p(130, 112).y}
        r="56"
        fill="currentColor"
        opacity="0.04"
      />
      <circle
        cx={p(130, 112).x}
        cy={p(130, 112).y}
        r="56"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.95"
      />
      <circle
        cx={p(130, 112).x}
        cy={p(130, 112).y}
        r="3"
        fill="currentColor"
        opacity="0.9"
      />

      {/* Hour markers */}
      <path d={`M${p(130, 56).x} ${p(130, 56).y} V${p(130, 64).y}`} stroke="currentColor" strokeWidth="2" opacity="0.8" />
      <path d={`M${p(130, 160).x} ${p(130, 160).y} V${p(130, 168).y}`} stroke="currentColor" strokeWidth="2" opacity="0.8" />
      <path d={`M${p(74, 112).x} ${p(74, 112).y} H${p(82, 112).x}`} stroke="currentColor" strokeWidth="2" opacity="0.8" />
      <path d={`M${p(178, 112).x} ${p(178, 112).y} H${p(186, 112).x}`} stroke="currentColor" strokeWidth="2" opacity="0.8" />

      {/* Clock hands */}
      <path
        d={`M${p(130, 112).x} ${p(130, 112).y} L${p(130, 80).x} ${p(130, 80).y}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d={`M${p(130, 112).x} ${p(130, 112).y} L${p(158, 128).x} ${p(158, 128).y}`}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Variable */}
      <text
        x={p(130, 188).x}
        y={p(130, 188).y}
        textAnchor="middle"
        fontSize="18"
        fill="currentColor"
        opacity="0.95"
        fontFamily="ui-sans-serif, system-ui"
      >
        t
      </text>

      {/* Unit */}
      <text
        x={p(130, 208).x}
        y={p(130, 208).y}
        textAnchor="middle"
        fontSize="13"
        fill="currentColor"
        opacity="0.7"
        fontFamily="ui-sans-serif, system-ui"
      >
        [s]
      </text>
    </svg>
  );
}
