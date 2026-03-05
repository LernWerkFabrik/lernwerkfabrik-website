import React from "react";

export default function CuboidVolume({ size = 180 }: { size?: number }) {
  const s = size;

  // ---- Cuboid base coordinates ----
  const frontX = 70;
  const frontY = 60;
  const frontW = 120; // a
  const frontH = 100; // h

  const depthDX = 35;
  const depthDY = -30;

  const A = { x: frontX, y: frontY };
  const B = { x: frontX + frontW, y: frontY };
  const C = { x: frontX + frontW, y: frontY + frontH };
  const D = { x: frontX, y: frontY + frontH };

  const B2 = { x: B.x + depthDX, y: B.y + depthDY };
  const C2 = { x: C.x + depthDX, y: C.y + depthDY };

  // ---- b dimension geometry ----
  const vx = C2.x - C.x;
  const vy = C2.y - C.y;
  const len = Math.hypot(vx, vy) || 1;

  let nx = -vy / len;
  let ny = vx / len;
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }

  const offset = 18;
  const b1 = { x: C.x + nx * offset, y: C.y + ny * offset };
  const b2 = { x: C2.x + nx * offset, y: C2.y + ny * offset };

  const tick = 8;
  const t1a = { x: b1.x - nx * tick, y: b1.y - ny * tick };
  const t1b = { x: b1.x + nx * tick, y: b1.y + ny * tick };
  const t2a = { x: b2.x - nx * tick, y: b2.y - ny * tick };
  const t2b = { x: b2.x + nx * tick, y: b2.y + ny * tick };

  // 🔽 ONLY change: label moved diagonally downward
  const bmx = (b1.x + b2.x) / 2 + 10;
  const bmy = (b1.y + b2.y) / 2 + 18;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cuboid */}
      <rect
        x={frontX}
        y={frontY}
        width={frontW}
        height={frontH}
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.95"
      />

      <path
        d={`M${A.x} ${A.y} L${A.x + depthDX} ${A.y + depthDY} H${B2.x} L${B.x} ${B.y} Z`}
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.85"
        fill="none"
      />

      <path
        d={`M${B.x} ${B.y} L${B2.x} ${B2.y} V${C2.y} L${C.x} ${C.y} Z`}
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.85"
        fill="none"
      />

      {/* a */}
      <path d={`M${D.x} 180 H${C.x}`} stroke="currentColor" strokeWidth="4" opacity="0.9" />
      <path d={`M${D.x} 172 V188`} stroke="currentColor" strokeWidth="3" opacity="0.9" />
      <path d={`M${C.x} 172 V188`} stroke="currentColor" strokeWidth="3" opacity="0.9" />
      <text x={(D.x + C.x) / 2} y={204} fill="currentColor" fontSize="18" opacity="0.95" textAnchor="middle">
        a
      </text>

      {/* h */}
      <path d="M50 60 V160" stroke="currentColor" strokeWidth="3" opacity="0.65" />
      <path d="M43 60 H57" stroke="currentColor" strokeWidth="3" opacity="0.65" />
      <path d="M43 160 H57" stroke="currentColor" strokeWidth="3" opacity="0.65" />
      <text x="30" y="115" fill="currentColor" fontSize="18" opacity="0.9" textAnchor="middle">
        h
      </text>

      {/* b line */}
      <path d={`M${b1.x} ${b1.y} L${b2.x} ${b2.y}`} stroke="currentColor" strokeWidth="4" opacity="0.75" />
      <path d={`M${t1a.x} ${t1a.y} L${t1b.x} ${t1b.y}`} stroke="currentColor" strokeWidth="3" opacity="0.75" />
      <path d={`M${t2a.x} ${t2a.y} L${t2b.x} ${t2b.y}`} stroke="currentColor" strokeWidth="3" opacity="0.75" />

      {/* ✅ ONLY label moved */}
      <text
        x={bmx}
        y={bmy}
        fill="currentColor"
        fontSize="18"
        opacity="0.9"
        textAnchor="middle"
      >
        b
      </text>
    </svg>
  );
}
