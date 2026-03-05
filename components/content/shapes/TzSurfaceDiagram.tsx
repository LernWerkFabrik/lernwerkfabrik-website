import React from "react";

type Props = { size?: number; className?: string };

export default function TzSurfaceDiagram({ size = 240, className }: Props) {
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
      aria-label="Rauheit Ra klein gegen gross"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <rect x="34" y="34" width="196" height="120" rx="12" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <rect x="290" y="34" width="196" height="120" rx="12" fill="none" stroke="currentColor" strokeWidth="2.2" />

      <line x1="50" y1="94" x2="214" y2="94" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      <line x1="306" y1="94" x2="470" y2="94" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />

      <path
        d="M 50 94 C 62 86, 74 102, 86 94 C 98 86, 110 102, 122 94 C 134 86, 146 102, 158 94 C 170 86, 182 102, 194 94 C 202 89, 208 99, 214 94"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M 306 94 L 318 70 L 330 118 L 342 74 L 354 120 L 366 72 L 378 124 L 390 76 L 402 126 L 414 74 L 426 122 L 438 76 L 450 118 L 462 84 L 470 94"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
      />

      <text x="132" y="178" textAnchor="middle" fontSize="14" fill="currentColor">
        kleiner Ra (feiner)
      </text>
      <text x="388" y="178" textAnchor="middle" fontSize="14" fill="currentColor">
        groesserer Ra (grober)
      </text>
      <text x="260" y="205" textAnchor="middle" fontSize="13" fill="currentColor" opacity="0.85">
        Merksatz: Ra runter = feiner
      </text>
    </svg>
  );
}

