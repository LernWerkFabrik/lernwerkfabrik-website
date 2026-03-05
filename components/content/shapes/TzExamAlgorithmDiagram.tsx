import React from "react";

type Props = { size?: number; className?: string };

function ArrowHead({ x, y, dir = "right" }: { x: number; y: number; dir?: "right" | "down" }) {
  if (dir === "down") {
    return <path d={`M ${x - 4} ${y - 6} L ${x + 4} ${y - 6} L ${x} ${y}`} fill="currentColor" opacity="0.9" />;
  }
  return <path d={`M ${x - 6} ${y - 4} L ${x - 6} ${y + 4} L ${x} ${y}`} fill="currentColor" opacity="0.9" />;
}

function Node({
  x,
  y,
  bw,
  bh,
  title,
}: {
  x: number;
  y: number;
  bw: number;
  bh: number;
  title: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={bw} height={bh} rx={14} fill="none" stroke="currentColor" strokeWidth={2.2} opacity="0.95" />
      <text x={x + bw / 2} y={y + 45} textAnchor="middle" fontSize={20} fontWeight={700} fill="currentColor">
        {title}
      </text>
    </g>
  );
}

export default function TzExamAlgorithmDiagram({ size = 240, className }: Props) {
  const w = 680;
  const h = 250;
  const outW = Math.max(220, Math.round(size));
  const outH = Math.round((outW * h) / w);

  const n1 = { x: 20, y: 24, w: 190, h: 78 };
  const n2 = { x: 245, y: 24, w: 190, h: 78 };
  const n3 = { x: 470, y: 24, w: 190, h: 78 };
  const n4 = { x: 20, y: 142, w: 145, h: 78 };
  const n5 = { x: 185, y: 142, w: 145, h: 78 };
  const n6 = { x: 350, y: 142, w: 145, h: 78 };
  const n7 = { x: 515, y: 142, w: 145, h: 78 };

  return (
    <svg
      width={outW}
      height={outH}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Pruefungs-Algorithmus fuer technische Zeichnungen"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <Node x={n1.x} y={n1.y} bw={n1.w} bh={n1.h} title="1 Gegeben" />
      <Node x={n2.x} y={n2.y} bw={n2.w} bh={n2.h} title="2 Gesucht" />
      <Node x={n3.x} y={n3.y} bw={n3.w} bh={n3.h} title="3 Symbol" />
      <Node x={n4.x} y={n4.y} bw={n4.w} bh={n4.h} title="4 Formel" />
      <Node x={n5.x} y={n5.y} bw={n5.w} bh={n5.h} title="5 Einsetzen" />
      <Node x={n6.x} y={n6.y} bw={n6.w} bh={n6.h} title="6 Rechnen" />
      <Node x={n7.x} y={n7.y} bw={n7.w} bh={n7.h} title="7 Check" />

      <path d="M 210 63 L 239 63" stroke="currentColor" strokeWidth={2.2} />
      <ArrowHead x={245} y={63} />
      <path d="M 435 63 L 464 63" stroke="currentColor" strokeWidth={2.2} />
      <ArrowHead x={470} y={63} />

      <path d="M 660 63 L 660 122 L 90 122 L 90 136" stroke="currentColor" strokeWidth={2.2} fill="none" />
      <ArrowHead x={90} y={142} dir="down" />

      <path d="M 165 181 L 179 181" stroke="currentColor" strokeWidth={2.2} />
      <ArrowHead x={185} y={181} />
      <path d="M 330 181 L 344 181" stroke="currentColor" strokeWidth={2.2} />
      <ArrowHead x={350} y={181} />
      <path d="M 495 181 L 509 181" stroke="currentColor" strokeWidth={2.2} />
      <ArrowHead x={515} y={181} />
    </svg>
  );
}
