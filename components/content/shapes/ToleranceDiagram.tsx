import React from "react";

export default function ToleranceDiagram({ size = 165 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 0.78);

  return (
    <svg width={w} height={h} viewBox="0 0 260 200" role="img" aria-label="Toleranz">

      {/* Skala */}
      <path d="M40 110 H220" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.75" />

      {/* Grenzen */}
      <path d="M80 92 V128" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
      <path d="M180 92 V128" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.95" />

      {/* Nennmaß */}
      <path d="M130 73 V140" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" strokeDasharray="6 6" />

      <text x="80" y="86" textAnchor="middle" fontSize="16" fill="currentColor" opacity="0.85">
        U
      </text>
      <text x="180" y="86" textAnchor="middle" fontSize="16" fill="currentColor" opacity="0.85">
        O
      </text>
      <text x="130" y="50" textAnchor="middle" fontSize="20" fill="currentColor" opacity="0.7">
        Nennmaß
      </text>

      {/* Toleranzpfeil */}
      <path d="M80 150 H180" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
      <path d="M80 150 L92 142 M80 150 L92 158" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
      <path d="M180 150 L168 142 M180 150 L168 158" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.95" />
      <text x="130" y="176" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.9">
        T = O − U
      </text>
    </svg>
  );
}
