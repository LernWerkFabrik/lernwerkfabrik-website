import React from "react";

type Props = {
  size?: number;
  color?: string;
};

export default function CylinderVolume({
  size = 180,
  color = "currentColor",
}: Props) {
  const VB = 240;
  const cx = VB / 2;

  // Geometry
  const rx = 72;
  const ry = 22;

  const topY = 70;
  const height = 110;
  const bottomY = topY + height;

  const leftX = cx - rx;
  const rightX = cx + rx;

  // Dimension (height)
  const dimGap = 22;
  const hX = rightX + dimGap;
  const hY1 = topY + 2;
  const hY2 = bottomY - 2;
  const tick = 10;

  // Radius line + label (clearly separated)
  const rX2 = cx + rx - 10;
  const rLabelX = rX2 + 14;
  const rLabelY = topY - 14;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  // Strokes
  const outlineSW = 2.6;
  const dimSW = 2.1;
  const dashSW = 2.0;

  // Bottom arcs
  const bottomFrontArc = `M ${leftX} ${bottomY} A ${rx} ${ry} 0 0 0 ${rightX} ${bottomY}`;
  const bottomBackArc = `M ${rightX} ${bottomY} A ${rx} ${ry} 0 0 0 ${leftX} ${bottomY}`;

  const strokeCommon = {
    stroke: color,
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Zylinder mit Radius r und Höhe h"
    >
      {/* Top ellipse */}
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ry}
        {...strokeCommon}
        strokeWidth={outlineSW}
        opacity={0.95}
      />

      {/* Side walls */}
      <path
        d={`M ${leftX} ${topY} V ${bottomY}`}
        {...strokeCommon}
        strokeWidth={outlineSW}
        opacity={0.9}
      />
      <path
        d={`M ${rightX} ${topY} V ${bottomY}`}
        {...strokeCommon}
        strokeWidth={outlineSW}
        opacity={0.9}
      />

      {/* Bottom ellipse */}
      <path
        d={bottomFrontArc}
        {...strokeCommon}
        strokeWidth={outlineSW}
        opacity={0.95}
      />
      <path
        d={bottomBackArc}
        stroke={color}
        strokeWidth={dashSW}
        opacity={0.35}
        strokeDasharray="6 6"
        strokeLinecap="butt"
        vectorEffect="non-scaling-stroke"
      />

      {/* Height indicator */}
      <path
        d={`M ${hX} ${hY1} V ${hY2}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.75}
      />
      <path
        d={`M ${hX - tick} ${hY1} H ${hX + tick}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.75}
      />
      <path
        d={`M ${hX - tick} ${hY2} H ${hX + tick}`}
        {...strokeCommon}
        strokeWidth={dimSW}
        opacity={0.75}
      />

      <text
        x={hX + 14}
        y={(hY1 + hY2) / 2 + 6}
        fill={color}
        fontSize={18}
        fontFamily={fontFamily}
        opacity={0.9}
        textAnchor="start"
      >
        h
      </text>

      {/* Radius indicator */}
      <path
        d={`M ${cx} ${topY} H ${rX2}`}
        {...strokeCommon}
        strokeWidth={outlineSW}
        opacity={0.9}
      />
      <circle cx={cx} cy={topY} r={3.6} fill={color} opacity={0.9} />

      <text
        x={rLabelX}
        y={rLabelY}
        fill={color}
        fontSize={18}
        fontFamily={fontFamily}
        opacity={0.9}
        textAnchor="start"
      >
        r
      </text>
    </svg>
  );
}
