import React from "react";

type Props = { size?: number; className?: string };

export default function TzSymbolsDiagram({ size = 240, className }: Props) {
  const w = 460;
  const h = 220;
  const outW = Math.max(220, Math.round(size));
  const outH = Math.round((outW * h) / w);

  return (
    <svg
      width={outW}
      height={outH}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Zusammenhang von Durchmesser und Radius"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <circle cx="120" cy="110" r="72" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <line x1="48" y1="110" x2="192" y2="110" stroke="currentColor" strokeWidth="2.2" />
      <line x1="120" y1="110" x2="192" y2="110" stroke="currentColor" strokeWidth="2.2" strokeDasharray="6 6" />

      <text x="120" y="104" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor">
        Ø
      </text>
      <text x="156" y="100" textAnchor="middle" fontSize="17" fontWeight="700" fill="currentColor">
        R
      </text>

      <text x="252" y="90" fontSize="26" fontWeight="700" fill="currentColor">
        Ø = 2R
      </text>
      <text x="252" y="140" fontSize="26" fontWeight="700" fill="currentColor">
        R = Ø / 2
      </text>
      <text x="252" y="178" fontSize="15" fill="currentColor" opacity="0.85">
        Bei Ø immer mit Durchmesser rechnen.
      </text>
    </svg>
  );
}

