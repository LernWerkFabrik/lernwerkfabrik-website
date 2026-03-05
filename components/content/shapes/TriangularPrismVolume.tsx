import React from "react";

type Props = {
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

export default function TriangularPrismVolume({
  size = 180,
  offsetX = -20,
  offsetY = -17,
}: Props) {
  const s = size;

  // helper: apply global offset
  const p = (x: number, y: number) => `${x + offsetX} ${y + offsetY}`;

  /* ========= L dimension (same style as g: line + 2 end ticks + centered label) ========= */

  // Edge to measure (lower-right depth edge)
  const A = { x: 210, y: 165 };
  const B = { x: 245, y: 140 };

  // Unit direction along A->B
  const vx = B.x - A.x;
  const vy = B.y - A.y;
  const vlen = Math.hypot(vx, vy) || 1;
  const ux = vx / vlen;
  const uy = vy / vlen;

  // Perpendicular unit (for shifting the measure line outward)
  const px = -uy;
  const py = ux;

  // --- Updated tuning (LONGER + FARTHER) ---
  const shift = 27;        // was 12 -> farther away from prism
  const shorten = 2;       // was 16 -> longer dimension line
  const tick = 8;          // end tick size
  const labelOffset = 14;  // keeps label readable, like g

  // dimension line endpoints (shortened + shifted)
  const L1 = {
    x: A.x + ux * shorten + px * shift,
    y: A.y + uy * shorten + py * shift,
  };
  const L2 = {
    x: B.x - ux * shorten + px * shift,
    y: B.y - uy * shorten + py * shift,
  };

  // end ticks (perpendicular to dimension line)
  const tx = px * tick;
  const ty = py * tick;

  // centered label position (midpoint), offset away from line
  const mx = (L1.x + L2.x) / 2;
  const my = (L1.y + L2.y) / 2;
  const lx = mx + px * labelOffset;
  const ly = my + py * labelOffset;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 280 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Front triangle */}
      <path
        d={`M${p(70, 165)} L${p(140, 65)} L${p(210, 165)} Z`}
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.95"
        fill="currentColor"
        fillOpacity="0.06"
      />

      {/* Back triangle (offset) */}
      <path
        d={`M${p(105, 140)} L${p(175, 40)} L${p(245, 140)} Z`}
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.55"
        fill="none"
      />

      {/* Connecting edges */}
      <path d={`M${p(70, 165)} L${p(105, 140)}`} stroke="currentColor" strokeWidth="4" opacity="0.75" />
      <path d={`M${p(140, 65)} L${p(175, 40)}`} stroke="currentColor" strokeWidth="4" opacity="0.75" />
      <path d={`M${p(210, 165)} L${p(245, 140)}`} stroke="currentColor" strokeWidth="4" opacity="0.75" />

      {/* Base g */}
      <path d={`M${p(70, 190)} H${210 + offsetX}`} stroke="currentColor" strokeWidth="4" opacity="0.9" />
      <path d={`M${p(70, 182)} V${198 + offsetY}`} stroke="currentColor" strokeWidth="3" opacity="0.9" />
      <path d={`M${p(210, 182)} V${198 + offsetY}`} stroke="currentColor" strokeWidth="3" opacity="0.9" />
      <text
        x={140 + offsetX}
        y={214 + offsetY}
        fill="currentColor"
        fontSize="18"
        fontFamily="ui-sans-serif, system-ui"
        opacity="0.95"
        textAnchor="middle"
      >
        g
      </text>

      {/* Height h */}
      <path
        d={`M${p(140, 165)} V${80 + offsetY}`}
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.7"
        strokeDasharray="6 6"
      />
      <text
        x={150 + offsetX}
        y={120 + offsetY}
        fill="currentColor"
        fontSize="18"
        fontFamily="ui-sans-serif, system-ui"
        opacity="0.95"
      >
        h
      </text>

      {/* Length L (same style as g) */}
      <path
        d={`M${p(L1.x, L1.y)} L${p(L2.x, L2.y)}`}
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.9"
      />
      <path
        d={`M${p(L1.x - tx, L1.y - ty)} L${p(L1.x + tx, L1.y + ty)}`}
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.9"
      />
      <path
        d={`M${p(L2.x - tx, L2.y - ty)} L${p(L2.x + tx, L2.y + ty)}`}
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.9"
      />
      <text
        x={lx + offsetX}
        y={ly + offsetY}
        fill="currentColor"
        fontSize="18"
        fontFamily="ui-sans-serif, system-ui"
        opacity="0.95"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        L
      </text>
    </svg>
  );
}
