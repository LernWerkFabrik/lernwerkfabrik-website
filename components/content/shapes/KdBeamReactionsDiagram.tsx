import React from "react";

type Props = { size?: number; className?: string };

export default function KdBeamReactionsDiagram({ size = 240, className }: Props) {
  const w = 560;
  const h = 220;
  const outW = Math.max(220, Math.round(size));
  const outH = Math.round((outW * h) / w);

  return (
    <svg
      width={outW}
      height={outH}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Balken mit Lagerreaktionen RA und RB"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <line x1="70" y1="104" x2="490" y2="104" stroke="currentColor" strokeWidth="4" />

      <path d="M 90 132 L 70 164 L 110 164 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 470 132 L 450 164 L 490 164 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />

      <line x1="90" y1="132" x2="90" y2="116" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 90 116 L 84 128 L 96 128 Z" fill="currentColor" />
      <text x="102" y="122" fontSize="14" fill="currentColor">
        R_A
      </text>

      <line x1="470" y1="132" x2="470" y2="116" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 470 116 L 464 128 L 476 128 Z" fill="currentColor" />
      <text x="482" y="122" fontSize="14" fill="currentColor">
        R_B
      </text>

      <line x1="280" y1="56" x2="280" y2="92" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 280 92 L 274 80 L 286 80 Z" fill="currentColor" />
      <text x="292" y="72" fontSize="14" fill="currentColor">
        F
      </text>

      <line x1="90" y1="186" x2="280" y2="186" stroke="currentColor" strokeWidth="1.7" />
      <path d="M 90 186 L 98 181 L 98 191 Z" fill="currentColor" />
      <path d="M 280 186 L 272 181 L 272 191 Z" fill="currentColor" />
      <text x="185" y="204" textAnchor="middle" fontSize="13" fill="currentColor">
        a
      </text>

      <line x1="90" y1="206" x2="470" y2="206" stroke="currentColor" strokeWidth="1.7" />
      <path d="M 90 206 L 98 201 L 98 211 Z" fill="currentColor" />
      <path d="M 470 206 L 462 201 L 462 211 Z" fill="currentColor" />
      <text x="280" y="202" textAnchor="middle" fontSize="13" fill="currentColor">
        L
      </text>
    </svg>
  );
}

