import React from "react";

export default function ConeVolume({ size = 180 }: { size?: number }) {
  const s = size;

  const fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  // Geometry
  const cx = 120;
  const apexY = 48;
  const baseY = 178;

  const rx = 74;
  const ry = 22;

  const leftX = cx - rx;
  const rightX = cx + rx;

  // Radius line end slightly inside the ellipse so it doesn't touch the outline
  const rEndX = rightX - 10;

  // ✅ Move "r" OUTSIDE to the right, so it never overlaps ellipse or side line
  const rLabelX = rEndX + 18;
  const rLabelY = baseY + 6;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kegel mit Radius r und Höhe h"
    >
      {/* Base ellipse */}
      <ellipse
        cx={cx}
        cy={baseY}
        rx={rx}
        ry={ry}
        stroke="currentColor"
        strokeWidth="4"
        opacity={0.95}
      />

      {/* Back arc dashed (depth hint) */}
      <path
        d={`M ${leftX} ${baseY}
            C ${leftX} ${baseY - 12} ${rightX} ${baseY - 12} ${rightX} ${baseY}`}
        stroke="currentColor"
        strokeWidth="3"
        opacity={0.35}
        strokeDasharray="6 6"
        strokeLinecap="round"
      />

      {/* Cone sides */}
      <path
        d={`M ${cx} ${apexY} L ${leftX} ${baseY}`}
        stroke="currentColor"
        strokeWidth="4"
        opacity={0.9}
        strokeLinejoin="round"
      />
      <path
        d={`M ${cx} ${apexY} L ${rightX} ${baseY}`}
        stroke="currentColor"
        strokeWidth="4"
        opacity={0.9}
        strokeLinejoin="round"
      />

      {/* Apex */}
      <circle cx={cx} cy={apexY} r="4" fill="currentColor" opacity={0.9} />

      {/* Height h (dashed) */}
      <path
        d={`M ${cx} ${apexY} V ${baseY}`}
        stroke="currentColor"
        strokeWidth="3"
        opacity={0.7}
        strokeDasharray="6 6"
      />
      <text
        x={cx + 12}
        y={(apexY + baseY) / 2}
        fill="currentColor"
        fontSize="18"
        fontFamily={fontFamily}
        opacity={0.95}
      >
        h
      </text>

      {/* Radius r on base */}
      <path
        d={`M ${cx} ${baseY} L ${rEndX} ${baseY}`}
        stroke="currentColor"
        strokeWidth="4"
        opacity={0.85}
      />
      <circle cx={cx} cy={baseY} r="4" fill="currentColor" opacity={0.9} />

      {/* ✅ r label moved outside (no overlap) */}
      <text
        x={rLabelX}
        y={rLabelY}
        fill="currentColor"
        fontSize="18"
        fontFamily={fontFamily}
        opacity={0.95}
        textAnchor="start"
      >
        r
      </text>
    </svg>
  );
}
