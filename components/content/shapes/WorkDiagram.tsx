import React from "react";

export default function WorkDiagram({ size = 165 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 0.78);

  // 🔧 globaler Offset
  const offsetX =   0;
  const offsetY = -40;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 260 200"
      role="img"
      aria-label="Arbeit: W = F · s"
    >
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        {/* Grundfläche */}
        <path d="M20 160 H240" stroke="currentColor" strokeWidth="3" opacity="0.85" />

        {/* Block */}
        <rect
          x="55"
          y="95"
          width="70"
          height="55"
          rx="10"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          opacity="0.95"
        />

        {/* Kraftpfeil F */}
        <path
          d="M130 122 H210"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M210 122 L196 114 M210 122 L196 130"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <text x="168" y="110" fontSize="18" fill="currentColor" opacity="0.95">
          F
        </text>

        {/* Wegpfeil s */}
        <path
          d="M60 175 H200"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M60 175 L72 167 M60 175 L72 183"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M200 175 L188 167 M200 175 L188 183"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />
        <text x="126" y="196" fontSize="18" fill="currentColor" opacity="0.95">
          s
        </text>
      </g>
    </svg>
  );
}
