import React from "react";

type Props = { size?: number; className?: string };

function ArrowHead({ x, y }: { x: number; y: number }) {
  return <path d={`M ${x - 6} ${y - 4} L ${x - 6} ${y + 4} L ${x} ${y}`} fill="currentColor" opacity="0.9" />;
}

export default function TzScalesDiagram({ size = 240, className }: Props) {
  const w = 540;
  const h = 220;
  const outW = Math.max(220, Math.round(size));
  const outH = Math.round((outW * h) / w);

  return (
    <svg
      width={outW}
      height={outH}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Skalen 1 zu n und n zu 1"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <text x="28" y="56" fontSize="20" fontWeight="700" fill="currentColor">
        1:n
      </text>
      <rect x="90" y="40" width="58" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2.1" />
      <line x1="158" y1="49" x2="204" y2="49" stroke="currentColor" strokeWidth="2.1" />
      <ArrowHead x={210} y={49} />
      <rect x="220" y="33" width="122" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2.1" />
      <text x="92" y="78" fontSize="13" fill="currentColor" opacity="0.86">
        Zeichnung
      </text>
      <text x="222" y="78" fontSize="13" fill="currentColor" opacity="0.86">
        Echtmass
      </text>

      <text x="28" y="142" fontSize="20" fontWeight="700" fill="currentColor">
        n:1
      </text>
      <rect x="90" y="119" width="122" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="2.1" />
      <line x1="222" y1="134" x2="268" y2="134" stroke="currentColor" strokeWidth="2.1" />
      <ArrowHead x={274} y={134} />
      <rect x="284" y="126" width="58" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2.1" />
      <text x="92" y="168" fontSize="13" fill="currentColor" opacity="0.86">
        Zeichnung
      </text>
      <text x="286" y="168" fontSize="13" fill="currentColor" opacity="0.86">
        Echtmass
      </text>

      <text x="372" y="72" fontSize="14" fill="currentColor">
        1:2 - echt groesser
      </text>
      <text x="372" y="149" fontSize="14" fill="currentColor">
        2:1 - echt kleiner
      </text>
    </svg>
  );
}

