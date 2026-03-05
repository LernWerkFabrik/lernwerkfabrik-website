import React from "react";

type Props = { size?: number; className?: string };

function ArrowHead({ x, y, dir }: { x: number; y: number; dir: "left" | "right" }) {
  if (dir === "left") {
    return <path d={`M ${x + 6} ${y - 4} L ${x + 6} ${y + 4} L ${x} ${y}`} fill="currentColor" />;
  }
  return <path d={`M ${x - 6} ${y - 4} L ${x - 6} ${y + 4} L ${x} ${y}`} fill="currentColor" />;
}

export default function TzChainDimsDiagram({ size = 240, className }: Props) {
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
      aria-label="Kettenmasse mit x0 und Schrittweite p"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <line x1="70" y1="42" x2="70" y2="182" stroke="currentColor" strokeWidth="2.4" />
      <line x1="70" y1="140" x2="442" y2="140" stroke="currentColor" strokeWidth="2.2" />

      {[130, 190, 250, 310].map((x) => (
        <g key={x}>
          <circle cx={x} cy={140} r={8} fill="none" stroke="currentColor" strokeWidth="2.2" />
          <line x1={x} y1={124} x2={x} y2={154} stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
        </g>
      ))}

      <line x1="70" y1="186" x2="130" y2="186" stroke="currentColor" strokeWidth="1.8" />
      <ArrowHead x={70} y={186} dir="left" />
      <ArrowHead x={130} y={186} dir="right" />
      <text x="100" y="204" textAnchor="middle" fontSize="14" fill="currentColor">
        x0
      </text>

      <line x1="130" y1="106" x2="190" y2="106" stroke="currentColor" strokeWidth="1.8" />
      <ArrowHead x={130} y={106} dir="left" />
      <ArrowHead x={190} y={106} dir="right" />
      <text x="160" y="99" textAnchor="middle" fontSize="14" fill="currentColor">
        p
      </text>

      <text x="328" y="64" fontSize="16" fontWeight="700" fill="currentColor">
        x_k = x0 + (k - 1) * p
      </text>
    </svg>
  );
}

