import React from "react";

export default function TrapezoidArea({ size = 180 }: { size?: number }) {
  const s = size;

  return (
    <svg width={s} height={s} viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trapezoid */}
      <path d="M70 150 L190 150 L165 70 L95 70 Z" fill="currentColor" opacity="0.10" />
      <path d="M70 150 L190 150 L165 70 L95 70 Z" stroke="currentColor" strokeWidth="4" opacity="0.95" />

      {/* Height (h) dashed */}
      <path d="M130 150 V70" stroke="currentColor" strokeWidth="3" opacity="0.7" strokeDasharray="6 6" />
      <text x="140" y="112" fill="currentColor" fontSize="18" fontFamily="ui-sans-serif, system-ui" opacity="0.95">
        h
      </text>

      {/* Base a (bottom) */}
      <path d="M70 175 H190" stroke="currentColor" strokeWidth="4" opacity="0.9" />
      <path d="M70 167 V183" stroke="currentColor" strokeWidth="3" opacity="0.9" />
      <path d="M190 167 V183" stroke="currentColor" strokeWidth="3" opacity="0.9" />
      <text x="127" y="210" fill="currentColor" fontSize="18" fontFamily="ui-sans-serif, system-ui" opacity="0.95">
        a
      </text>

      {/* Base c (top) */}
      <path d="M95 52 H165" stroke="currentColor" strokeWidth="4" opacity="0.75" />
      <path d="M95 44 V60" stroke="currentColor" strokeWidth="3" opacity="0.75" />
      <path d="M165 44 V60" stroke="currentColor" strokeWidth="3" opacity="0.75" />
      <text x="126" y="36" fill="currentColor" fontSize="18" fontFamily="ui-sans-serif, system-ui" opacity="0.9">
        c
      </text>
    </svg>
  );
}
