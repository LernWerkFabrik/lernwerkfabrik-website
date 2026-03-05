import React, { useId } from "react";

type Props = {
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

export default function DeviationDiagram({
  size = 165,
  offsetX = -10,
  offsetY = -20,
}: Props) {
  const w = size;
  const h = Math.round(size * 0.78);

  // Design canvas
  const vbW = 260;
  const vbH = 200;

  const line = "currentColor";
  const ve = "non-scaling-stroke" as const;

  // --- Layout ---
  const xL = 44;

  const rightMargin = 10;
  const rightTextZoneW = 68;
  const xR = vbW - rightTextZoneW;

  const yIst = 78;
  const ySoll = 108;

  const xDim = xR - 14;
  const extHalf = 16;

  const labelX = 58;

  const id = useId();
  const markerId = `arrow_${id}`;

  const Text = ({
    x,
    y,
    children,
    anchor = "start",
    size = 12,
    weight = 400,
    opacity = 0.85,
  }: {
    x: number;
    y: number;
    children: React.ReactNode;
    anchor?: "start" | "middle" | "end";
    size?: number;
    weight?: number;
    opacity?: number;
  }) => (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fontWeight={weight}
      fill={line}
      opacity={opacity}
      fontFamily="ui-sans-serif, system-ui"
    >
      {children}
    </text>
  );

  const deltaX = xR + 14;
  const deltaY = (yIst + ySoll) / 2 + 6;

  const hintX = vbW - rightMargin;
  const hintY = 126;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${vbW} ${vbH}`}
      role="img"
      aria-label="Maßabweichung"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M 1 1 L 9 5 L 1 9 Z" fill={line} opacity={0.9} />
        </marker>
      </defs>

      {/* 🔹 GLOBAL OFFSET APPLIED HERE 🔹 */}
      <g transform={`translate(${offsetX} ${offsetY})`}>
        {/* IST line */}
        <path
          d={`M${xL + 16} ${yIst} H${xR}`}
          stroke={line}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.95"
          vectorEffect={ve}
          fill="none"
        />
        <Text x={labelX} y={yIst - 10} size={14} opacity={0.88}>
          Istmaß (xᵢₛₜ)
        </Text>

        {/* SOLL line */}
        <path
          d={`M${xL + 15} ${ySoll} H${xR}`}
          stroke={line}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
          vectorEffect={ve}
          fill="none"
        />
        <Text x={labelX} y={ySoll - 10} size={14} opacity={0.72}>
          Sollmaß (xₛₒₗₗ)
        </Text>

        {/* Extension lines */}
        <path
          d={`M${xDim - extHalf} ${yIst} H${xDim + extHalf}`}
          stroke={line}
          strokeWidth="2"
          opacity="0.28"
          vectorEffect={ve}
        />
        <path
          d={`M${xDim - extHalf} ${ySoll} H${xDim + extHalf}`}
          stroke={line}
          strokeWidth="2"
          opacity="0.28"
          vectorEffect={ve}
        />

        {/* Dimension line */}
        <path
          d={`M${xDim} ${yIst + 3} V${ySoll - 3}`}
          stroke={line}
          strokeWidth="2"
          opacity="0.95"
          vectorEffect={ve}
          markerStart={`url(#${markerId})`}
          markerEnd={`url(#${markerId})`}
        />

        {/* Δ */}
        <Text x={deltaX} y={deltaY} size={20} weight={500} opacity={0.95}>
          Δ
        </Text>

        {/* Hint */}
        <Text x={hintX} y={hintY} anchor="end" size={12} opacity={0.65}>
          (hier: Δ &gt; 0)
        </Text>

        {/* Formula box */}
        <rect
          x="56"
          y="136"
          width="148"
          height="44"
          rx="12"
          stroke={line}
          strokeWidth="2"
          fill="none"
          opacity="0.38"
          vectorEffect={ve}
        />
        <Text x={vbW / 2} y={163} anchor="middle" size={20} opacity={0.9}>
          Δ = xᵢₛₜ − xₛₒₗₗ
        </Text>
      </g>
    </svg>
  );
}
