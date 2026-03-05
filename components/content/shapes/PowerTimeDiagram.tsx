import React from "react";

export default function PowerTimeDiagram({ size = 165 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 0.78);

  return (
    <svg width={w} height={h} viewBox="0 0 260 200" role="img" aria-label="Leistung: P = W / t">
      {/* Box W */}
      <rect x="20" y="55" width="70" height="60" rx="12" stroke="currentColor" strokeWidth="3" fill="none" />
      <text x="55" y="92" textAnchor="middle" fontSize="20" fill="currentColor">
        W
      </text>

      {/* Pfeil */}
      <path d="M95 85 H135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M135 85 L123 77 M135 85 L123 93" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Uhr t */}
      <circle cx="170" cy="85" r="30" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M170 85 L170 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M170 85 L185 92" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <text x="170" y="130" textAnchor="middle" fontSize="18" fill="currentColor" opacity="0.95">
        t
      </text>

      {/* Pfeil */}
      <path d="M200 85 H240" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M240 85 L228 77 M240 85 L228 93" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Output P */}
      <rect x="200" y="135" width="50" height="45" rx="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.9" />
      <text x="225" y="164" textAnchor="middle" fontSize="20" fill="currentColor">
        P
      </text>
    </svg>
  );
}
