import React from "react";

type Props = { size?: number; className?: string };

export default function KdDistributedLoadDiagram({ size = 240, className }: Props) {
  const w = 560;
  const h = 220;
  const outW = Math.max(220, Math.round(size));
  const outH = Math.round((outW * h) / w);

  const arrows = Array.from({ length: 9 }).map((_, i) => {
    const x = 110 + i * 40;
    return (
      <g key={x}>
        <line x1={x} y1={44} x2={x} y2={92} stroke="currentColor" strokeWidth="2" />
        <path d={`M ${x} 92 L ${x - 5} 82 L ${x + 5} 82 Z`} fill="currentColor" />
      </g>
    );
  });

  return (
    <svg
      width={outW}
      height={outH}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Gleichmaessige Streckenlast q auf Balken"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <line x1="90" y1="100" x2="470" y2="100" stroke="currentColor" strokeWidth="4" />
      {arrows}
      <text x="84" y="40" fontSize="15" fontWeight="700" fill="currentColor">
        q [N/m]
      </text>

      <line x1="90" y1="170" x2="470" y2="170" stroke="currentColor" strokeWidth="1.8" />
      <path d="M 90 170 L 98 165 L 98 175 Z" fill="currentColor" />
      <path d="M 470 170 L 462 165 L 462 175 Z" fill="currentColor" />
      <text x="280" y="166" textAnchor="middle" fontSize="13" fill="currentColor">
        L
      </text>

      <line x1="280" y1="58" x2="280" y2="92" stroke="currentColor" strokeWidth="2.4" strokeDasharray="6 4" />
      <text x="292" y="74" fontSize="14" fill="currentColor">
        F_res
      </text>

      <text x="90" y="202" fontSize="13" fill="currentColor" opacity="0.9">
        F_res = q * L, Angriffspunkt in der Mitte
      </text>
    </svg>
  );
}

