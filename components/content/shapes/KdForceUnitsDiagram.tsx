import React from "react";

type Props = { size?: number; className?: string };

export default function KdForceUnitsDiagram({ size = 240, className }: Props) {
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
      aria-label="Kraft und Einheiten"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <rect x="20" y="20" width="480" height="180" rx="14" fill="none" stroke="currentColor" strokeWidth="2.1" />

      <text x="40" y="56" fontSize="20" fontWeight="700" fill="currentColor">
        F [N]
      </text>
      <text x="40" y="88" fontSize="15" fill="currentColor" opacity="0.9">
        1 kN = 1000 N
      </text>
      <text x="40" y="116" fontSize="15" fill="currentColor" opacity="0.9">
        1 N = 1 kg * m / s^2
      </text>

      <line x1="260" y1="42" x2="260" y2="170" stroke="currentColor" strokeWidth="1.6" opacity="0.45" />

      <text x="280" y="74" fontSize="15" fontWeight="700" fill="currentColor">
        Umrechnung
      </text>
      <text x="280" y="104" fontSize="14" fill="currentColor">
        N  &lt;-&gt;  kN
      </text>
      <text x="280" y="132" fontSize="14" fill="currentColor">
        m  &lt;-&gt;  mm
      </text>
      <text x="280" y="160" fontSize="13" fill="currentColor" opacity="0.86">
        Hebelarm immer in m
      </text>
    </svg>
  );
}
