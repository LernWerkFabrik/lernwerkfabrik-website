import React from "react";

export default function ShaftPowerDiagram({ size = 165 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 0.78);

  // 🔧 globales Offset für die gesamte Grafik
  const offsetX = -38;
  const offsetY = 15;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 260 200"
      role="img"
      aria-label="Wellenleistung: P = M · ω"
    >
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        {/* Welle 1 */}
        <rect
          x="40"
          y="88"
          width="160"
          height="24"
          rx="12"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          opacity="0.95"
        />
        <text x="80" y="78" fontSize="14" fill="currentColor" opacity="0.85">
          Welle 1
        </text>

        {/* Kopplung / Welle 2 */}
        <circle cx="210" cy="100" r="22" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.95" />
        <circle cx="210" cy="100" r="6" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.95" />
        <text x="252" y="90" fontSize="14" fill="currentColor" opacity="0.85">
          Welle 2
        </text>

        {/* Rotationspfeil ω (sauberer Bogen + tangentiale Spitze) */}
        <path
          d="M239.44 83
            Q255 100 234.04 124.04"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Pfeilspitze am Ende (Tip = 234.04 / 124.04), tangential ausgerichtet */}
        <path
          d="M238.72 109.54 L234.04 124.04 L247.76 117.43"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        <text x="262" y="74" fontSize="18" fill="currentColor" opacity="0.95">
          ω
        </text>

        {/* Drehmomentpfeil M */}
        <path d="M210 100 V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M210 40 L202 52 M210 40 L218 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <text x="222" y="52" fontSize="18" fill="currentColor" opacity="0.95">
          M
        </text>

        {/* Leistung */}
        <text x="60" y="60" fontSize="18" fill="currentColor" opacity="0.85">
          P = M · ω
        </text>
      </g>
    </svg>
  );
}
