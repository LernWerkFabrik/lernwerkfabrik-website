import React from "react";

type Props = {
  size?: number;
  showDiameter?: boolean;
};

export default function CircleAreaFormulaGraphic({
  size = 180,
  showDiameter = true,
}: Props) {
  const VB = 220;
  const cx = VB / 2;
  const cy = VB / 2;

  const r = 78;

  // Abstand der Durchmesserlinie vom Kreisrand
  const dInset = 10;
  const dY = cy + 34;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  const strokeCommon = {
    stroke: "currentColor",
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kreis mit Radius r und Durchmesser d"
    >
      {/* Kreisfläche (A = πr²) */}
      <circle cx={cx} cy={cy} r={r} fill="currentColor" opacity={0.05} />

      {/* Kreisrand */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        {...strokeCommon}
        strokeWidth={4}
        opacity={0.95}
      />

      {/* Hilfsachsen */}
      <line
        x1={cx - r}
        y1={cy}
        x2={cx + r}
        y2={cy}
        {...strokeCommon}
        strokeWidth={2}
        opacity={0.25}
      />
      <line
        x1={cx}
        y1={cy - r}
        x2={cx}
        y2={cy + r}
        {...strokeCommon}
        strokeWidth={2}
        opacity={0.25}
      />

      {/* Mittelpunkt */}
      <circle cx={cx} cy={cy} r={4} fill="currentColor" opacity={0.9} />

      {/* Radius r */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + r}
        y2={cy}
        {...strokeCommon}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.9}
      />

      <text
        x={cx + r / 2}
        y={cy - 12}
        fill="currentColor"
        fontSize={16}
        fontFamily={fontFamily}
        textAnchor="middle"
        opacity={0.95}
      >
        r
      </text>

      {/* Durchmesser d (sekundär, sauber getrennt) */}
      {showDiameter && (
        <>
          <line
            x1={cx - r + dInset}
            y1={dY}
            x2={cx + r - dInset}
            y2={dY}
            stroke="currentColor"
            strokeWidth={2}
            opacity={0.55}
            strokeDasharray="6 6"
            strokeLinecap="butt" // ← verhindert „Ankleben“
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={cx}
            y={dY + 18}
            fill="currentColor"
            fontSize={14}
            fontFamily={fontFamily}
            textAnchor="middle"
            opacity={0.75}
          >
            d = 2r
          </text>
        </>
      )}
    </svg>
  );
}
