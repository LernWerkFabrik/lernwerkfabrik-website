import React from "react";

export default function SquareArea({ size = 165 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 0.78);

  // ViewBox
  const VBW = 260;
  const VBH = 200;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  // Quadrat
  const sq = 120;
  const dimGap = 14;
  const head = 8;

  // Gesamthöhe der Konstruktion:
  // Quadrat + Maßlinie unten + Text
  const totalH = sq + dimGap + 20;

  // 🔴 WICHTIG: jetzt vertikal zentriert
  const sqX = (VBW - sq) / 2;
  const sqY = (VBH - totalH) / 2;

  // Maßlinien
  const bottomY = sqY + sq + dimGap;
  const bottomX1 = sqX;
  const bottomX2 = sqX + sq;

  const leftX = sqX - dimGap;
  const leftY1 = sqY;
  const leftY2 = sqY + sq;

  // Styles
  const strokeCommon = {
    stroke: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "miter" as const,
    strokeLinecap: "butt" as const,
  };

  const outlineSW = 2.4;
  const dimSW = 2;

  const ArrowHeadsH = (x1: number, x2: number, y: number) => (
    <>
      <path
        d={`M ${x1} ${y} L ${x1 + head} ${y - head * 0.7} M ${x1} ${y} L ${x1 + head} ${y + head * 0.7}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.9}
      />
      <path
        d={`M ${x2} ${y} L ${x2 - head} ${y - head * 0.7} M ${x2} ${y} L ${x2 - head} ${y + head * 0.7}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.9}
      />
    </>
  );

  const ArrowHeadsV = (x: number, y1: number, y2: number) => (
    <>
      <path
        d={`M ${x} ${y1} L ${x - head * 0.7} ${y1 + head} M ${x} ${y1} L ${x + head * 0.7} ${y1 + head}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.9}
      />
      <path
        d={`M ${x} ${y2} L ${x - head * 0.7} ${y2 - head} M ${x} ${y2} L ${x + head * 0.7} ${y2 - head}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.9}
      />
    </>
  );

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${VBW} ${VBH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Quadrat mit Seitenlänge a"
    >
      {/* Quadrat */}
      <rect x={sqX} y={sqY} width={sq} height={sq} fill="currentColor" opacity={0.05} />
      <rect
        x={sqX}
        y={sqY}
        width={sq}
        height={sq}
        {...strokeCommon}
        strokeWidth={outlineSW}
        opacity={0.95}
      />

      {/* Maßlinie unten (a) */}
      <path
        d={`M ${bottomX1} ${bottomY} H ${bottomX2}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.85}
      />
      {ArrowHeadsH(bottomX1, bottomX2, bottomY)}
      <text
        x={(bottomX1 + bottomX2) / 2}
        y={bottomY + 16}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.95}
      >
        a
      </text>

      {/* Maßlinie links (a) */}
      <path
        d={`M ${leftX} ${leftY1} V ${leftY2}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.85}
      />
      {ArrowHeadsV(leftX, leftY1, leftY2)}
      <text
        x={leftX - 14}
        y={(leftY1 + leftY2) / 2 + 6}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.95}
      >
        a
      </text>
    </svg>
  );
}
