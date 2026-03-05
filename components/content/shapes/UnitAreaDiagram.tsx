import React from "react";

type Props = {
  size?: number;
  activeUnit?: "cm2" | "m2";
};

export default function UnitAreaDiagram({ size = 165, activeUnit = "cm2" }: Props) {
  const w = size;
  const h = Math.round(size * 0.78);

  const VBW = 260;
  const VBH = 200;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  // --- Layout (zentriert, kein Abschneiden) ---
  const boxW = 74;
  const boxH = 74;
  const gap = 44; // ✅ genug Platz für den Pfeil
  const boxY = 52;

  const total = 2 * boxW + gap;
  const startX = (VBW - total) / 2;

  const leftX = startX;
  const rightX = startX + boxW + gap;

  const centers = {
    cm2: leftX + boxW / 2,
    m2: rightX + boxW / 2,
  };

  // Pfeil im Zwischenraum
  const arrowY = boxY + boxH / 2;
  const pad = 10; // Abstand zu den Boxkanten
  const ax1 = leftX + boxW + pad;
  const ax2 = rightX - pad;

  // Text/Box unten
  const hintY = 142;

  // Styling
  const strokeCommon = {
    stroke: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
  };

  const boxStroke = (u: "cm2" | "m2") => (u === activeUnit ? 2.5 : 2);
  const boxOpacity = (u: "cm2" | "m2") => (u === activeUnit ? 0.98 : 0.75);
  const labelOpacity = (u: "cm2" | "m2") => (u === activeUnit ? 0.98 : 0.88);

  const Arrow = () => {
    const head = 7.5;
    const sw = 2;
    return (
      <g opacity={0.88}>
        <path
          d={`M ${ax1} ${arrowY} H ${ax2}`}
          stroke="currentColor"
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <path
          d={`
            M ${ax2} ${arrowY}
            L ${ax2 - head} ${arrowY - head * 0.75}
            M ${ax2} ${arrowY}
            L ${ax2 - head} ${arrowY + head * 0.75}
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

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${VBW} ${VBH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Flächeneinheiten: cm² zu m². Exponent mal 2."
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
        Flächeneinheiten
      </text>

      {/* Exponent-Hinweis (ruhig, über dem Pfeilbereich) */}
      <text
        x={VBW / 2}
        y={44}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.85}
      >
        Exponent ×2
      </text>

      {/* Subtile Füllung */}
      <rect x={leftX} y={boxY} width={boxW} height={boxH} rx={14} fill="currentColor" opacity={0.05} />
      <rect x={rightX} y={boxY} width={boxW} height={boxH} rx={14} fill="currentColor" opacity={0.05} />

      {/* Box-Ränder */}
      <rect
        x={leftX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={14}
        {...strokeCommon}
        strokeWidth={boxStroke("cm2")}
        opacity={boxOpacity("cm2")}
      />
      <rect
        x={rightX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={14}
        {...strokeCommon}
        strokeWidth={boxStroke("m2")}
        opacity={boxOpacity("m2")}
      />

      {/* Labels */}
      <text
        x={centers.cm2}
        y={boxY + boxH / 2 + 6}
        textAnchor="middle"
        fontSize={18}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={labelOpacity("cm2")}
      >
        cm²
      </text>
      <text
        x={centers.m2}
        y={boxY + boxH / 2 + 6}
        textAnchor="middle"
        fontSize={18}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={labelOpacity("m2")}
      >
        m²
      </text>

      {/* Pfeil */}
      <Arrow />

      {/* Faktor-Box */}
      <rect
        x={48}
        y={hintY}
        width={164}
        height={44}
        rx={12}
        {...strokeCommon}
        strokeWidth={1.8}
        fill="none"
        opacity={0.5}
      />
      <text
        x={VBW / 2}
        y={hintY + 27}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.85}
      >
        1 m² = 10⁴ cm²
      </text>
    </svg>
  );
}
