import React from "react";

type Props = { size?: number; className?: string };

function ArrowHead({ x, y, dir }: { x: number; y: number; dir: "left" | "right" | "up" | "down" }) {
  if (dir === "left") return <path d={`M ${x + 6} ${y - 4} L ${x + 6} ${y + 4} L ${x} ${y}`} fill="currentColor" />;
  if (dir === "up") return <path d={`M ${x - 4} ${y + 6} L ${x + 4} ${y + 6} L ${x} ${y}`} fill="currentColor" />;
  if (dir === "down") return <path d={`M ${x - 4} ${y - 6} L ${x + 4} ${y - 6} L ${x} ${y}`} fill="currentColor" />;
  return <path d={`M ${x - 6} ${y - 4} L ${x - 6} ${y + 4} L ${x} ${y}`} fill="currentColor" />;
}

export default function TzChamferDiagram({ size = 240, className }: Props) {
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
      aria-label="Fase a mal 45 Grad und Laenge l"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <line x1="80" y1="28" x2="80" y2="190" stroke="currentColor" strokeWidth="2.4" />
      <line x1="80" y1="190" x2="340" y2="190" stroke="currentColor" strokeWidth="2.4" />
      <line x1="80" y1="128" x2="142" y2="190" stroke="currentColor" strokeWidth="2.4" />

      <line x1="62" y1="128" x2="62" y2="190" stroke="currentColor" strokeWidth="1.8" />
      <ArrowHead x={62} y={128} dir="up" />
      <ArrowHead x={62} y={190} dir="down" />
      <text x="50" y="162" textAnchor="middle" fontSize="14" fill="currentColor">
        a
      </text>

      <line x1="80" y1="208" x2="142" y2="208" stroke="currentColor" strokeWidth="1.8" />
      <ArrowHead x={80} y={208} dir="left" />
      <ArrowHead x={142} y={208} dir="right" />
      <text x="111" y="204" textAnchor="middle" fontSize="14" fill="currentColor">
        a
      </text>

      <text x="122" y="156" fontSize="14" fill="currentColor">
        l
      </text>
      <text x="155" y="176" fontSize="13" fill="currentColor" opacity="0.9">
        45°
      </text>

      <text x="210" y="84" fontSize="20" fontWeight="700" fill="currentColor">
        l = a * sqrt(2)
      </text>
      <text x="210" y="124" fontSize="16" fill="currentColor">
        a = l / sqrt(2)
      </text>
    </svg>
  );
}

