import React from "react";

export default function RectangleArea({ size = 180 }: { size?: number }) {
  const s = size;

  // ViewBox
  const VBW = 240;
  const VBH = 220;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  // Rechteck (zentriert/ruhig)
  const rectW = 140;
  const rectH = 110;
  const rectX = 40;
  const rectY = 40;

  // Abstände für Maßlinien (mehr Luft, keine "dicken" Balken)
  const dimGap = 16;

  // Maßlinie a (unten)
  const aY = rectY + rectH + dimGap; // unterhalb Rechteck
  const aX1 = rectX;
  const aX2 = rectX + rectW;

  // Maßlinie b (rechts)
  const bX = rectX + rectW + dimGap; // rechts vom Rechteck
  const bY1 = rectY;
  const bY2 = rectY + rectH;

  // "T"-Enden statt Pfeile (wie in deinem Screenshot), aber dünner & cleaner
  const tick = 10;

  const strokeCommon = {
    stroke: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "miter" as const,
    strokeLinecap: "butt" as const,
  };

  const outlineSW = 2.6;
  const dimSW = 2.2;
  const tickSW = 2.2;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${VBW} ${VBH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rechteck Fläche mit Seiten a und b"
    >
      {/* Rechteck (optional minimaler Fill für Dark UI) */}
      <rect x={rectX} y={rectY} width={rectW} height={rectH} fill="currentColor" opacity={0.05} />
      <rect
        x={rectX}
        y={rectY}
        width={rectW}
        height={rectH}
        {...strokeCommon}
        strokeWidth={outlineSW}
        opacity={0.95}
      />

      {/* Maßlinie a */}
      <line x1={aX1} y1={aY} x2={aX2} y2={aY} {...strokeCommon} strokeWidth={dimSW} opacity={0.9} />
      {/* Endstriche */}
      <line x1={aX1} y1={aY - tick} x2={aX1} y2={aY + tick} {...strokeCommon} strokeWidth={tickSW} opacity={0.9} />
      <line x1={aX2} y1={aY - tick} x2={aX2} y2={aY + tick} {...strokeCommon} strokeWidth={tickSW} opacity={0.9} />

      <text
        x={(aX1 + aX2) / 2}
        y={aY + 28}
        textAnchor="middle"
        fontSize={18}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.95}
      >
        a
      </text>

      {/* Maßlinie b */}
      <line x1={bX} y1={bY1} x2={bX} y2={bY2} {...strokeCommon} strokeWidth={dimSW} opacity={0.9} />
      {/* Endstriche */}
      <line x1={bX - tick} y1={bY1} x2={bX + tick} y2={bY1} {...strokeCommon} strokeWidth={tickSW} opacity={0.9} />
      <line x1={bX - tick} y1={bY2} x2={bX + tick} y2={bY2} {...strokeCommon} strokeWidth={tickSW} opacity={0.9} />

      <text
        x={bX + 16}
        y={(bY1 + bY2) / 2 + 6}
        textAnchor="middle"
        fontSize={18}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.95}
      >
        b
      </text>
    </svg>
  );
}
