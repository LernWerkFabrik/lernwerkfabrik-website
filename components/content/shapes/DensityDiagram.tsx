// components/content/shapes/DensityDiagram.tsx
import React, { useId } from "react";

type Props = {
  size?: number;
  className?: string;
  canvasH?: number;

  strokeWidth?: number;       // default 2
  hatchStrokeWidth?: number;  // default 1
  nonScalingStroke?: boolean;

  /** Optional: show explanatory header texts (formula + implication) */
  showHeader?: boolean; // default true
};

export default function DensityDiagram({
  size = 620,
  className,
  canvasH = 620,

  strokeWidth = 2,
  hatchStrokeWidth = 1,
  nonScalingStroke = true,

  showHeader = true,
}: Props) {
  const id = useId();

  // Internal design canvas size
  const w = 900;
  const h = canvasH;

  // Output size preserving aspect ratio
  const outW = Math.max(280, Math.round(size));
  const outH = Math.round((outW * h) / w);

  const stroke = strokeWidth;
  const line = "currentColor";
  const fill = "currentColor";
  const ve = nonScalingStroke ? ("non-scaling-stroke" as const) : undefined;

  const LabelBlock = ({
    cx,
    y,
    text,
    bw = 140,
    bh = 44,
    fontSize = 28,
  }: {
    cx: number;
    y: number;
    text: string;
    bw?: number;
    bh?: number;
    fontSize?: number;
  }) => (
    <g>
      <rect
        x={cx - bw / 2}
        y={y}
        width={bw}
        height={bh}
        rx={14}
        fill="none"
        stroke={line}
        strokeWidth={stroke}
        vectorEffect={ve}
      />
      <text
        x={cx}
        y={y + bh / 2 + 10}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={900}
        fill={fill}
        fontFamily="ui-sans-serif, system-ui"
      >
        {text}
      </text>
    </g>
  );

  const SymbolBlock = ({
    cx,
    cy,
    text,
    bw = 82,
    bh = 54,
    fontSize = 34,
  }: {
    cx: number;
    cy: number;
    text: string;
    bw?: number;
    bh?: number;
    fontSize?: number;
  }) => (
    <g>
      <rect
        x={cx - bw / 2}
        y={cy - bh / 2}
        width={bw}
        height={bh}
        rx={16}
        fill="none"
        stroke={line}
        strokeWidth={stroke}
        vectorEffect={ve}
        opacity={0.95}
      />
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={950}
        fill={fill}
        fontFamily="ui-sans-serif, system-ui"
      >
        {text}
      </text>
    </g>
  );

  const defs = (
    <defs>
      {/* Left hatch (less dense) */}
      <pattern id={`hL_${id}`} width="28" height="28" patternUnits="userSpaceOnUse">
        <path
          d="M -8 28 L 28 -8"
          stroke={line}
          strokeWidth={hatchStrokeWidth}
          strokeLinecap="round"
          vectorEffect={ve}
          fill="none"
          opacity="0.9"
        />
      </pattern>

      {/* Right hatch (more dense) */}
      <pattern id={`hR_${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
        <path
          d="M -6 12 L 12 -6"
          stroke={line}
          strokeWidth={hatchStrokeWidth}
          strokeLinecap="round"
          vectorEffect={ve}
          fill="none"
          opacity="0.9"
        />
      </pattern>
    </defs>
  );

  const Beaker = ({
    x,
    y,
    bw,
    bh,
    hatch,
    clipKey,
  }: {
    x: number;
    y: number;
    bw: number;
    bh: number;
    hatch: "L" | "R";
    clipKey: string;
  }) => {
    const pad = 22;
    const r = 34;

    const neckW = bw * 0.5;
    const neckH = 14;
    const neckX = x + (bw - neckW) / 2;

    const clipId = `clip_${id}_${clipKey}`;

    const innerX = x + pad;
    const innerY = y + pad;
    const innerW = bw - pad * 2;
    const innerH = bh - pad * 2;

    // constant relative fill region
    const liquidY = y + bh * 0.55;
    const liquidH = bh * 0.25;

    const patternId = hatch === "L" ? `hL_${id}` : `hR_${id}`;

    return (
      <g>
        {/* Neck */}
        <rect
          x={neckX}
          y={y - neckH}
          width={neckW}
          height={neckH}
          rx={12}
          fill="none"
          stroke={line}
          strokeWidth={stroke}
          vectorEffect={ve}
        />
        {/* Body */}
        <rect
          x={x}
          y={y}
          width={bw}
          height={bh}
          rx={r}
          fill="none"
          stroke={line}
          strokeWidth={stroke}
          vectorEffect={ve}
        />

        <defs>
          <clipPath id={clipId}>
            <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={20} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <rect x={innerX} y={liquidY} width={innerW} height={liquidH} fill={fill} opacity={0.12} />
          <rect x={innerX} y={liquidY} width={innerW} height={liquidH} fill={`url(#${patternId})`} opacity={0.85} />
        </g>
      </g>
    );
  };

  // ----------------
  // Layout (no overlaps)
  // ----------------

  // Two columns
  const beakerW = 220;
  const leftX = 165;
  const rightX = 515;

  const leftCX = leftX + beakerW / 2;
  const rightCX = rightX + beakerW / 2;
  const midCX = (leftCX + rightCX) / 2;

  // Header band (optional)
  const headerH = showHeader ? 140 : 85;
  const headerFormulaY = 56;
  const headerExplainY = 92;

  // Beaker sizes (volume difference)
  const beakerH1 = 220; // larger volume
  const beakerH2 = 170; // smaller volume

  // Place beakers below header band; keep bottoms aligned
  const beakerTopY1 = headerH + 70;
  const beakerTopY2 = beakerTopY1 + (beakerH1 - beakerH2);
  const beakerBottomY = beakerTopY1 + beakerH1;

  // Mass labels (same y)
  const massY = headerH + 10;

  // ρ and V blocks below beakers
  const rhoY = beakerBottomY + 26;
  const vY = rhoY + 74;

  // Middle symbols (=, ≠, ≠) aligned to those rows
  const eqCY = massY + 22; // center of mass label row
  const neRhoCY = rhoY + 22;
  const neVCY = vY + 22;

  return (
    <>
      <svg
        width={outW}
        height={outH}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        className={`block h-auto w-full ${className ?? ""}`.trim()}
        style={{ width: "100%", height: "auto", maxWidth: outW }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        {defs}

        {/* Header (kept separate; centered; no collisions) */}
        {showHeader && (
          <>
            <text
              x={w / 2}
              y={headerFormulaY}
              textAnchor="middle"
              fontSize={50}
              fontWeight={950}
              fill={fill}
              fontFamily="ui-sans-serif, system-ui"
            >
              V = m / ρ
            </text>
            <text
              x={w / 2}
              y={headerExplainY}
              textAnchor="middle"
              fontSize={30}
              fontWeight={400}
              fill={fill}
              opacity={0.9}
              fontFamily="ui-sans-serif, system-ui"
            >
              Bei gleicher Masse m:  ρ₂ &gt; ρ₁  ⇒  V₂ &lt; V₁
            </text>
          </>
        )}

        {/* MASS row */}
        <LabelBlock cx={leftCX} y={massY} text="m" />
        <LabelBlock cx={rightCX} y={massY} text="m" />
        <SymbolBlock cx={midCX} cy={eqCY} text="=" />

        {/* BEAKERS */}
        <Beaker x={leftX} y={beakerTopY1} bw={beakerW} bh={beakerH1} hatch="L" clipKey="L" />
        <Beaker x={rightX} y={beakerTopY2} bw={beakerW} bh={beakerH2} hatch="R" clipKey="R" />

        {/* DENSITY row */}
        <LabelBlock cx={leftCX} y={rhoY} text="ρ₁" />
        <LabelBlock cx={rightCX} y={rhoY} text="ρ₂" />
        <SymbolBlock cx={midCX} cy={neRhoCY} text="≠" />

        {/* VOLUME row */}
        <LabelBlock cx={leftCX} y={vY} text="V₁" />
        <LabelBlock cx={rightCX} y={vY} text="V₂" />
        <SymbolBlock cx={midCX} cy={neVCY} text="≠" />
      </svg>
    </>
  );
}
