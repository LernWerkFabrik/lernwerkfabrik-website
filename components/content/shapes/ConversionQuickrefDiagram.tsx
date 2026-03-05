// components/content/shapes/ConversionQuickrefDiagram.tsx
import React from "react";

type Props = {
  size?: number;
  className?: string;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
};

export default function ConversionQuickrefDiagram({
  size = 260,
  className,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
}: Props) {
  const w = 760;
  const h = 520;

  const outW = Math.max(300, Math.round(size));
  const outH = Math.round((outW * h) / w);

  const stroke = 2.5;
  const line = "currentColor";
  const text = "currentColor";

  const Panel = ({
    x,
    y,
    bw,
    bh,
    title,
    rows,
  }: {
    x: number;
    y: number;
    bw: number;
    bh: number;
    title: string;
    rows: Array<[string, string]>;
  }) => (
    <g>
      <rect
        x={x}
        y={y}
        width={bw}
        height={bh}
        rx={18}
        ry={18}
        fill="none"
        stroke={line}
        strokeWidth={stroke}
      />

      {/* Panel title — BOLD */}
      <text
        x={x + 18}
        y={y + 34}
        fontSize={24}
        fontWeight={950}
        fill={text}
      >
        {title}
      </text>

      {rows.map(([a, b], i) => (
        <g key={i}>
          {/* Left text — NORMAL */}
          <text
            x={x + 18}
            y={y + 70 + i * 30}
            fontSize={22}
            fontWeight={400}
            fill={text}
          >
            {a}
          </text>

          {/* Right text — NORMAL */}
          <text
            x={x + bw - 18}
            y={y + 70 + i * 30}
            textAnchor="end"
            fontSize={22}
            fontWeight={400}
            fill={text}
          >
            {b}
          </text>
        </g>
      ))}
    </g>
  );

  return (
    <>
      <svg
        width={outW}
        height={outH}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Schnellübersicht Umrechnungen"
        className={`block h-auto w-full ${className ?? ""}`.trim()}
        style={{ width: "100%", height: "auto", maxWidth: outW }}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        {/* GLOBAL OFFSET + SCALE */}
        <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
          {/* Main title — BOLD */}
          <text
            x={24}
            y={40}
            fontSize={28}
            fontWeight={950}
            fill={text}
          >
            Schnellübersicht – Umrechnungen (prüfungsnah)
          </text>

          {/* Top row */}
          <Panel
            x={24}
            y={74}
            bw={232}
            bh={180}
            title="Länge"
            rows={[
              ["1 m", "= 100 cm"],
              ["1 m", "= 1000 mm"],
              ["1 mm", "= 10⁻³ m"],
              ["1 cm", "= 10⁻² m"],
            ]}
          />

          <Panel
            x={264}
            y={74}
            bw={232}
            bh={180}
            title="Fläche"
            rows={[
              ["1 m²", "= 10⁴ cm²"],
              ["1 m²", "= 10⁶ mm²"],
              ["1 cm²", "= 10⁻⁴ m²"],
              ["1 mm²", "= 10⁻⁶ m²"],
            ]}
          />

          <Panel
            x={504}
            y={74}
            bw={232}
            bh={180}
            title="Volumen"
            rows={[
              ["1 m³", "= 10⁶ cm³"],
              ["1 m³", "= 10⁹ mm³"],
              ["1 cm³", "= 10⁻⁶ m³"],
              ["1 mm³", "= 10⁻⁹ m³"],
            ]}
          />

          {/* Bottom row */}
          <Panel
            x={24}
            y={270}
            bw={352}
            bh={220}
            title="Kraft / Masse"
            rows={[
              ["Gewichtskraft", "F = m · g"],
              ["g", "≈ 9,81 m/s²"],
              ["1 kN", "= 1000 N"],
              ["1 kg", "≈ 9,81 N"],
              ["100 N", "≈ 10,2 kg"],
            ]}
          />

          <Panel
            x={384}
            y={270}
            bw={352}
            bh={220}
            title="Zeit / Druck"
            rows={[
              ["1 min", "= 60 s"],
              ["1 h", "= 3600 s"],
              ["1 bar", "= 10⁵ Pa"],
              ["1 MPa", "= 10⁶ Pa"],
              ["1 N/mm²", "= 1 MPa"],
            ]}
          />
        </g>
      </svg>
    </>
  );
}
