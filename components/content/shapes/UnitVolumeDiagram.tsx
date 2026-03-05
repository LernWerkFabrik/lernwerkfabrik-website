import React from "react";

export default function UnitVolumeDiagram({ size = 165 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 0.78);

  const VBW = 260;
  const VBH = 200;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  // ---------- Styles ----------
  const strokeCommon = {
    stroke: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  const strokeNormal = 2.1;
  const strokeActive = 2.8; // cm³ hervorheben
  const arrowStroke = 2;

  // ---------- Layout ----------
  // Größere Würfel, aber sauber mit Platz für Pfeil + Hinweisbox
  const cube = 58;
  const depth = 20;

  const cubesY = 56;
  const gap = 64; // Platz für Pfeil

  const totalW = 2 * cube + 2 * depth + gap;
  const startX = (VBW - totalW) / 2;

  const leftX = startX;
  const rightX = startX + cube + depth + gap;

  // Pfeil zwischen den Würfeln (ohne Kollision)
  const arrowY = cubesY + depth + cube * 0.38;
  const arrowStart = leftX + cube + depth + 12;
  const arrowEnd = rightX - 12;

  // Hinweisbox
  const hintY = 150;

  // ---------- Helper: Cube (sauber, keine diagonale Linie durchs Gesicht) ----------
  const Cube = ({
    x,
    y,
    label,
    active,
  }: {
    x: number;
    y: number;
    label: string;
    active?: boolean;
  }) => {
    const sw = active ? strokeActive : strokeNormal;
    const op = active ? 0.98 : 0.9;

    // Top face points
    const topD = { x: x, y: y + depth };
    const topA = { x: x + depth, y };
    const topB = { x: x + depth + cube, y };
    const topC = { x: x + cube, y: y + depth };

    // Front face (square) corners
    const fTL = topD; // (x, y+depth)
    const fTR = topC; // (x+cube, y+depth)
    const fBL = { x: x, y: y + depth + cube };
    const fBR = { x: x + cube, y: y + depth + cube };

    // Right face points
    const rTop = topB; // (x+depth+cube, y)
    const rMid = { x: x + depth + cube, y: y + cube }; // (x+depth+cube, y+cube)
    const rBottom = { x: x + cube, y: y + depth + cube }; // (x+cube, y+depth+cube)

    // Label centered on FRONT face (nicht im perspektivischen "Gesamtwürfel")
    const labelX = x + cube / 2;
    const labelY = y + depth + cube / 2 + 6;

    return (
      <g opacity={op}>
        {/* Subtile Fill für Top (hilft auf Dark UI) */}
        <path
          d={`M ${topD.x} ${topD.y} L ${topA.x} ${topA.y} L ${topB.x} ${topB.y} L ${topC.x} ${topC.y} Z`}
          fill="currentColor"
          opacity={active ? 0.06 : 0.04}
        />

        {/* Top outline */}
        <path
          d={`M ${topD.x} ${topD.y} L ${topA.x} ${topA.y} L ${topB.x} ${topB.y} L ${topC.x} ${topC.y} Z`}
          {...strokeCommon}
          strokeWidth={sw}
        />

        {/* Front outline */}
        <path
          d={`M ${fTL.x} ${fTL.y} L ${fTR.x} ${fTR.y} L ${fBR.x} ${fBR.y} L ${fBL.x} ${fBL.y} Z`}
          {...strokeCommon}
          strokeWidth={sw}
        />

        {/* Connect top to front */}
        <path
          d={`M ${topA.x} ${topA.y} L ${fTL.x} ${fTL.y} M ${topB.x} ${topB.y} L ${fTR.x} ${fTR.y}`}
          {...strokeCommon}
          strokeWidth={sw}
        />

        {/* Right face (ohne diagonale Linie durch die Front) */}
        <path
          d={`M ${rTop.x} ${rTop.y} L ${rMid.x} ${rMid.y} L ${rBottom.x} ${rBottom.y}`}
          {...strokeCommon}
          strokeWidth={sw}
        />

        {/* Kleines Text-Backing, damit nichts „durch“ die Schrift läuft */}
        <rect
          x={labelX - 18}
          y={labelY - 16}
          width={36}
          height={22}
          rx={7}
          fill="currentColor"
          opacity={active ? 0.10 : 0.07}
        />

        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fontSize={17}
          fontFamily={fontFamily}
          fill="currentColor"
          opacity={active ? 0.98 : 0.92}
        >
          {label}
        </text>
      </g>
    );
  };

  const Arrow = () => {
    const head = 7;
    return (
      <g opacity={0.85}>
        <path
          d={`M ${arrowStart} ${arrowY} H ${arrowEnd}`}
          stroke="currentColor"
          strokeWidth={arrowStroke}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
        <path
          d={`
            M ${arrowEnd} ${arrowY}
            L ${arrowEnd - head} ${arrowY - head * 0.75}
            M ${arrowEnd} ${arrowY}
            L ${arrowEnd - head} ${arrowY + head * 0.75}
          `}
          stroke="currentColor"
          strokeWidth={arrowStroke}
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
      aria-label="Volumeneinheiten: cm³ zu m³. Exponent mal 3."
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
        Volumeneinheiten
      </text>

      {/* Exponent */}
      <text
        x={VBW / 2}
        y={44}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.85}
      >
        Exponent ×3
      </text>

      {/* Würfel (cm³ hervorgehoben) */}
      <Cube x={leftX} y={cubesY} label="cm³" active />
      <Cube x={rightX} y={cubesY} label="m³" />

      {/* Pfeil */}
      <Arrow />

      {/* Hinweisbox */}
      <rect
        x={48}
        y={hintY}
        width={164}
        height={40}
        rx={12}
        {...strokeCommon}
        strokeWidth={1.8}
        opacity={0.5}
      />
      <text
        x={VBW / 2}
        y={hintY + 25}
        textAnchor="middle"
        fontSize={17}
        fontFamily={fontFamily}
        fill="currentColor"
        opacity={0.85}
      >
        1 m³ = 1000 L
      </text>
    </svg>
  );
}
