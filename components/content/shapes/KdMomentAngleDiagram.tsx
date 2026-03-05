import React from "react";

type Props = { size?: number; className?: string };

export default function KdMomentAngleDiagram({ size = 240, className }: Props) {
  const w = 520;
  const h = 220;
  const outW = Math.max(220, Math.round(size));
  const outH = Math.round((outW * h) / w);

  return (
    <svg
      width={outW}
      height={outH}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Drehmoment mit Winkel alpha"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <line x1="70" y1="170" x2="250" y2="170" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="70" cy="170" r="5" fill="currentColor" />
      <line x1="70" y1="170" x2="190" y2="110" stroke="currentColor" strokeWidth="2.4" />
      <path d="M 117 170 A 47 47 0 0 1 155 146" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="128" y="151" fontSize="14" fill="currentColor">
        alpha
      </text>
      <text x="258" y="176" fontSize="14" fill="currentColor">
        r
      </text>
      <text x="194" y="104" fontSize="14" fill="currentColor">
        F
      </text>

      <text x="284" y="92" fontSize="18" fontWeight="700" fill="currentColor">
        M = F * r * sin(alpha)
      </text>
      <text x="284" y="128" fontSize="14" fill="currentColor" opacity="0.92">
        alpha = 90 deg gives sin(alpha) = 1
      </text>
      <text x="284" y="158" fontSize="14" fill="currentColor" opacity="0.9">
        Dann: M = F * r
      </text>
    </svg>
  );
}
