import React from "react";

type Props = {
  /**
   * Maximale Breite (px) des Diagramms. Standard: 460.
   * Das SVG bleibt responsive (100% Breite im Container), aber wird nicht breiter als size.
   */
  size?: number;
  className?: string;

  /** Shift the whole diagram (graphics + labels) inside the SVG */
  offsetX?: number;
  offsetY?: number;
};

export default function RotationSpeedUnified({
  size = 460,
  className,
  offsetX = 0,
  offsetY = 0,
}: Props) {
  // "Design space" (ViewBox)
  const w = 380;
  const h = 320;

  const c = "currentColor";
  const stroke = 3;

  // unique marker ids to avoid collisions when multiple svgs appear on the page
  const uid = React.useId();
  const arrowId = `arrow-${uid}`;
  const arrowTinyId = `arrowTiny-${uid}`;

  // --- diagram center (before offset) ---
  const cx = 200;
  const cy = 160;

  const r = 84;

  // helper: point on circle (deg: math degrees, 0° to the right; y axis inverted for SVG)
  const pt = (deg: number, rad: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + Math.cos(a) * rad, y: cy - Math.sin(a) * rad };
  };

  /* ===== outer rotation (n,f) ===== */
  const rotR = r + 22;
  const rotStart = pt(155, rotR);
  const rotEnd = pt(25, rotR);

  /* ===== inner ω arc (parallel to circle on right side) ===== */
  const omegaR = r - 26; // inner radius -> keeps it parallel/concentric
  const omegaA1 = 55; // start top-right
  const omegaA2 = -55; // end bottom-right
  const omStart = pt(omegaA1, omegaR);
  const omEnd = pt(omegaA2, omegaR);

  // dashed boundary radii (for the wedge boundaries only, not a fill wedge)
  const boundR = omegaR + 15;
  const b1 = pt(omegaA1, boundR);
  const b2 = pt(omegaA2, boundR);

  /* ===== label spacing ===== */
  const topLabelDy = -6; // move f block a bit upward
  const leftBlockX = 40;
  const rightBlockX = cx + r + 40;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Zusammenhang Drehzahl n, Frequenz f und Winkelgeschwindigkeit ω"
      // critical: responsive sizing (prevents huge card height)
      className={["block w-full h-auto", className ?? ""].join(" ")}
      style={{
        // critical: SVG scales to container, but will not exceed this max width
        maxWidth: size,
      }}
      preserveAspectRatio="xMidYMid meet"
    >
        <defs>
          {/* big arrow for outer rotation */}
          <marker
            id={arrowId}
            markerWidth="10"
            markerHeight="10"
            refX="7"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill={c} />
          </marker>

          {/* tiny arrow for ω — reversed at start (markerStart) */}
          <marker
            id={arrowTinyId}
            markerUnits="strokeWidth"
            markerWidth="3.2"
            markerHeight="3.2"
            refX="2.6"
            refY="1.6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L3.2,1.6 L0,3.2 Z" fill={c} />
          </marker>
        </defs>

        {/* SHIFT EVERYTHING HERE */}
        <g transform={`translate(${offsetX} ${offsetY})`}>
          {/* ===== Labels ===== */}
          {/* f */}
          <text
            x={cx}
            y={30 + topLabelDy}
            textAnchor="middle"
            fontSize={26}
            fontWeight={600}
            fill={c}
          >
            f
          </text>
          <text
            x={cx}
            y={47 + topLabelDy}
            textAnchor="middle"
            fontSize={16}
            fontWeight={500}
            fill={c}
            opacity={0.85}
          >
            1/s (Hz)
          </text>

          {/* n */}
          <text x={leftBlockX} y={140} fontSize={26} fontWeight={600} fill={c}>
            n
          </text>
          <text
            x={leftBlockX}
            y={162}
            fontSize={16}
            fontWeight={500}
            fill={c}
            opacity={0.85}
          >
            1/min
          </text>
          <text x={leftBlockX} y={192} fontSize={20} fontWeight={600} fill={c}>
            n / 60
          </text>

          {/* ω */}
          <text x={rightBlockX} y={154} fontSize={26} fontWeight={600} fill={c}>
            ω
          </text>
          <text
            x={rightBlockX}
            y={176}
            fontSize={16}
            fontWeight={500}
            fill={c}
            opacity={0.85}
          >
            rad/s
          </text>

          {/* ===== Disc ===== */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={stroke} />
          <circle cx={cx} cy={cy} r={8} fill="none" stroke={c} strokeWidth={stroke} />

          {/* ===== Outer rotation arrow ===== */}
          <path
            d={`M ${rotStart.x} ${rotStart.y} A ${rotR} ${rotR} 0 0 1 ${rotEnd.x} ${rotEnd.y}`}
            fill="none"
            stroke={c}
            strokeWidth={stroke}
            strokeLinecap="round"
            markerEnd={`url(#${arrowId})`}
          />

          {/* ===== ω boundaries (dashed) ===== */}
          <line
            x1={cx}
            y1={cy}
            x2={b1.x}
            y2={b1.y}
            stroke={c}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="7 7"
            opacity={0.75}
          />
          <line
            x1={cx}
            y1={cy}
            x2={b2.x}
            y2={b2.y}
            stroke={c}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="7 7"
            opacity={0.75}
          />

          {/* ===== Inner ω arc (parallel to circle), arrow at start ===== */}
          <path
            d={`M ${omStart.x} ${omStart.y} A ${omegaR} ${omegaR} 0 0 1 ${omEnd.x} ${omEnd.y}`}
            fill="none"
            stroke={c}
            strokeWidth={3.2}
            strokeLinecap="round"
            markerStart={`url(#${arrowTinyId})`}
          />

          {/* ω label inside */}
          {(() => {
            const p = pt(0, omegaR - 18);
            return (
              <text
                x={p.x}
                y={p.y + 6}
                textAnchor="middle"
                fontSize={18}
                fontWeight={600}
                fill={c}
              >
                ω
              </text>
            );
          })()}

          {/* ===== Formula ===== */}
          <text
            x={cx}
            y={304}
            textAnchor="middle"
            fontSize={24}
            fontWeight={600}
            fill={c}
          >
            ω = 2π · n / 60
          </text>
        </g>
    </svg>
  );
}

