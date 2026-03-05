import React from "react";

type Props = { size?: number; className?: string };

export default function KdSignsDiagram({ size = 240, className }: Props) {
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
      aria-label="Vorzeichenkonvention fuer Momente"
      className={`block h-auto w-full ${className ?? ""}`.trim()}
      style={{ width: "100%", height: "auto", maxWidth: outW }}
    >
      <circle cx="146" cy="110" r="56" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 108 86 A 50 50 0 0 1 182 84" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 182 84 L 170 84 L 176 94 Z" fill="currentColor" />
      <text x="146" y="118" textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor">
        +
      </text>

      <circle cx="374" cy="110" r="56" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 412 86 A 50 50 0 0 0 338 84" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M 338 84 L 350 84 L 344 94 Z" fill="currentColor" />
      <text x="374" y="118" textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor">
        -
      </text>

      <text x="146" y="188" textAnchor="middle" fontSize="13" fill="currentColor">
        gegen Uhrzeigersinn
      </text>
      <text x="374" y="188" textAnchor="middle" fontSize="13" fill="currentColor">
        im Uhrzeigersinn
      </text>
    </svg>
  );
}

