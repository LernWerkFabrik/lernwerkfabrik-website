import React from "react";

type Props = {
  size?: number;
  activeUnit?: "mm" | "cm" | "m";
};

export default function UnitLengthDiagram({ size = 165, activeUnit = "cm" }: Props) {
  const w = size;
  const h = Math.round(size * 0.78);

  const VBW = 260;
  const VBH = 200;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  // --- Layout (kannst du hier feinjustieren) ---
  const boxW = 62;
  const boxH = 46;
  const gap = 26; // genug Platz für Pfeile
  const boxY = 52;

  // ✅ Gesamtbreite der 3 Boxen + 2 Gaps → dann zentrieren
  const total = 3 * boxW + 2 * gap;
  const startX = (VBW - total) / 2; // garantiert innerhalb der viewBox

  const leftX = startX;
  const midX = startX + boxW + gap;
  const rightX = startX + 2 * (boxW + gap);

  const centers = {
    mm: leftX + boxW / 2,
    cm: midX + boxW / 2,
    m: rightX + boxW / 2,
  };

  // Pfeile im Zwischenraum
  const arrowY = boxY + boxH / 2;
  const pad = 6; // Abstand zur Boxkante
  const a1x1 = leftX + boxW + pad;
  const a1x2 = midX - pad;
  const a2x1 = midX + boxW + pad;
  const a2x2 = rightX - pad;

  // Textpositionen
  const factorY = boxY + boxH + 18;
  const hintY = 136;

  const strokeCommon = {
    stroke: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
  };

  const boxStroke = (unit: "mm" | "cm" | "m") => (unit === activeUnit ? 2.5 : 2);
  const boxOpacity = (unit: "mm" | "cm" | "m") => (unit === activeUnit ? 0.98 : 0.75);
  const labelOpacity = (unit: "mm" | "cm" | "m") => (unit === activeUnit ? 0.98 : 0.88);

  const Arrow = ({ x1, x2 }: { x1: number; x2: number }) => {
    const head = 6.5;
    const sw = 2; // dünn
    return (
      <g opacity={0.85}>
        <path
          d={`M ${x1} ${arrowY} H ${x2}`}
          stroke="currentColor"
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <path
          d={`
            M ${x2} ${arrowY}
            L ${x2 - head} ${arrowY - head * 0.75}
            M ${x2} ${arrowY}
            L ${x2 - head} ${arrowY + head * 0.75}
          `}
          stroke="currentColor"
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  const factor1X = (leftX + boxW + midX) / 2;
  const factor2X = (midX + boxW + rightX) / 2;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${VBW} ${VBH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Längeneinheiten: mm, cm, m. Nach rechts werden Einheiten größer."
    >
      {/* Titel */}
      <text
        x={VBW / 2}
        y={22}
        textAnchor="middle"
        fontSize={20}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.9}
      >
        Längeneinheiten
      </text>

      {/* Subtile Füllung der Boxen */}
      <rect x={leftX} y={boxY} width={boxW} height={boxH} rx={12} fill="currentColor" opacity={0.05} />
      <rect x={midX} y={boxY} width={boxW} height={boxH} rx={12} fill="currentColor" opacity={0.05} />
      <rect x={rightX} y={boxY} width={boxW} height={boxH} rx={12} fill="currentColor" opacity={0.05} />

      {/* Box-Ränder */}
      <rect
        x={leftX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={12}
        {...strokeCommon}
        strokeWidth={boxStroke("mm")}
        opacity={boxOpacity("mm")}
      />
      <rect
        x={midX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={12}
        {...strokeCommon}
        strokeWidth={boxStroke("cm")}
        opacity={boxOpacity("cm")}
      />
      <rect
        x={rightX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={12}
        {...strokeCommon}
        strokeWidth={boxStroke("m")}
        opacity={boxOpacity("m")}
      />

      {/* Labels */}
      <text
        x={centers.mm}
        y={boxY + 30}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={labelOpacity("mm")}
      >
        mm
      </text>
      <text
        x={centers.cm}
        y={boxY + 30}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={labelOpacity("cm")}
      >
        cm
      </text>
      <text
        x={centers.m}
        y={boxY + 30}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={labelOpacity("m")}
      >
        m
      </text>

      {/* Pfeile */}
      <Arrow x1={a1x1} x2={a1x2} />
      <Arrow x1={a2x1} x2={a2x2} />

      {/* Faktoren */}
      <text
        x={factor1X}
        y={factorY}
        textAnchor="middle"
        fontSize={15}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.78}
      >
        ÷10
      </text>
      <text
        x={factor2X}
        y={factorY}
        textAnchor="middle"
        fontSize={15}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.78}
      >
        ÷100
      </text>

      {/* Hinweisbox */}
      <rect
        x={10}
        y={hintY}
        width={240}
        height={44}
        rx={12}
        {...strokeCommon}
        strokeWidth={1.8}
        opacity={0.5}
      />
      <text
        x={VBW / 2}
        y={hintY + 27}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.82}
      >
        nach rechts: größere Einheit
      </text>
    </svg>
  );
}
