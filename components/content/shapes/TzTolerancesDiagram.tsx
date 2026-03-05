import React from "react";

type Props = { size?: number; className?: string };

function ArrowHead({ x, y, dir }: { x: number; y: number; dir: "left" | "right" }) {
  if (dir === "left") {
    return <path d={`M ${x + 6} ${y - 4} L ${x + 6} ${y + 4} L ${x} ${y}`} fill="currentColor" opacity="0.9" />;
  }
  return <path d={`M ${x - 6} ${y - 4} L ${x - 6} ${y + 4} L ${x} ${y}`} fill="currentColor" opacity="0.9" />;
}

export default function TzTolerancesDiagram({ size = 240, className }: Props) {
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
      aria-label="Toleranzen mit Min, Nenn und Max"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <line x1="52" y1="118" x2="282" y2="118" stroke="currentColor" strokeWidth="2.3" />
      <line x1="88" y1="98" x2="88" y2="138" stroke="currentColor" strokeWidth="2.5" />
      <line x1="170" y1="92" x2="170" y2="144" stroke="currentColor" strokeWidth="2.3" strokeDasharray="6 6" opacity="0.8" />
      <line x1="252" y1="98" x2="252" y2="138" stroke="currentColor" strokeWidth="2.5" />

      <text x="88" y="88" textAnchor="middle" fontSize="14" fill="currentColor">
        x_min
      </text>
      <text x="170" y="82" textAnchor="middle" fontSize="14" fill="currentColor">
        x_nenn
      </text>
      <text x="252" y="88" textAnchor="middle" fontSize="14" fill="currentColor">
        x_max
      </text>

      <line x1="88" y1="170" x2="252" y2="170" stroke="currentColor" strokeWidth="2.3" />
      <ArrowHead x={88} y={170} dir="left" />
      <ArrowHead x={252} y={170} dir="right" />
      <text x="170" y="192" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.9">
        Toleranzfeld
      </text>

      <text x="320" y="88" fontSize="16" fontWeight="700" fill="currentColor">
        x_max = x_nenn + t
      </text>
      <text x="320" y="124" fontSize="16" fontWeight="700" fill="currentColor">
        x_min = x_nenn - t
      </text>
      <text x="320" y="160" fontSize="14" fill="currentColor" opacity="0.85">
        Immer: x_max &gt; x_nenn &gt; x_min
      </text>
    </svg>
  );
}

