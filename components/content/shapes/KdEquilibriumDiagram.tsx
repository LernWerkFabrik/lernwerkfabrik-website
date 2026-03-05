import React from "react";

type Props = { size?: number; className?: string };

export default function KdEquilibriumDiagram({ size = 240, className }: Props) {
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
      aria-label="Kraefte und Momente im Gleichgewicht"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <line x1="60" y1="110" x2="220" y2="110" stroke="currentColor" strokeWidth="2.4" />
      <line x1="140" y1="30" x2="140" y2="190" stroke="currentColor" strokeWidth="2.4" />

      <path d="M 220 110 L 206 104 L 206 116 Z" fill="currentColor" />
      <path d="M 60 110 L 74 104 L 74 116 Z" fill="currentColor" />
      <path d="M 140 30 L 134 44 L 146 44 Z" fill="currentColor" />
      <path d="M 140 190 L 134 176 L 146 176 Z" fill="currentColor" />

      <text x="228" y="114" fontSize="13" fill="currentColor">
        Fx
      </text>
      <text x="40" y="114" fontSize="13" fill="currentColor">
        -Fx
      </text>
      <text x="146" y="30" fontSize="13" fill="currentColor">
        Fy
      </text>
      <text x="146" y="196" fontSize="13" fill="currentColor">
        -Fy
      </text>

      <path d="M 140 72 A 38 38 0 1 1 139.9 72" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="5 4" />
      <text x="124" y="70" fontSize="13" fill="currentColor">
        M
      </text>

      <text x="286" y="88" fontSize="18" fontWeight="700" fill="currentColor">
        Sum F = 0
      </text>
      <text x="286" y="120" fontSize="18" fontWeight="700" fill="currentColor">
        Sum M = 0
      </text>
      <text x="286" y="156" fontSize="13" fill="currentColor" opacity="0.9">
        Alle Kraefte und Momente muessen sich aufheben.
      </text>
    </svg>
  );
}

