import React from "react";

type LeverMomentProps = {
  size?: number;
  offsetX?: number;
  offsetY?: number;
};

export default function LeverMoment({
  size = 180,
  offsetX = 0,
  offsetY = -10,
}: LeverMomentProps) {
  const s = size;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 260 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Global offset for whole graphic */}
      <g transform={`translate(${offsetX} ${offsetY})`}>
        {/* Beam */}
        <rect x="40" y="105" width="180" height="18" rx="6" fill="currentColor" opacity="0.10" />
        <rect
          x="40"
          y="105"
          width="180"
          height="18"
          rx="6"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.9"
        />

        {/* Pivot */}
        <circle cx="90" cy="114" r="10" fill="currentColor" opacity="0.9" />

        {/* Support */}
        <path d="M70 145 L90 114 L110 145 Z" fill="currentColor" opacity="0.18" />
        <path d="M70 145 L90 114 L110 145 Z" stroke="currentColor" strokeWidth="3" opacity="0.65" />

        {/* Moment arrow */}
        <path
          d="M56 148 C66 184 112 178 122 150"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.60"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M124.52 158.24 L124 148 L113.12 150.56"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.60"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Force arrow */}
        <path d="M200 52 V100" stroke="currentColor" strokeWidth="4" opacity="0.9" strokeLinecap="round" />
        <path
          d="M192 64 L200 52 L208 64"
          stroke="currentColor"
          strokeWidth="4"
          opacity="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="214" y="72" fill="currentColor" fontSize="22" fontFamily="ui-sans-serif, system-ui">
          F
        </text>

        {/* Lever arm r */}
        <path
          d="M90 90 H200"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.65"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
        <path d="M90 82 V98" stroke="currentColor" strokeWidth="3" opacity="0.65" />
        <path d="M200 82 V98" stroke="currentColor" strokeWidth="3" opacity="0.65" />
        <text x="142" y="80" fill="currentColor" fontSize="20">
          r
        </text>

        {/* Formula */}
        <text x="52" y="200" fill="currentColor" fontSize="20" opacity="0.85">
          M = F · r
        </text>
      </g>
    </svg>
  );
}
