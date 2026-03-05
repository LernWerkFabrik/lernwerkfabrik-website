import React from "react";

type Props = {
  size?: number;
  /** optional: Ringfläche leicht einfärben */
  showFill?: boolean;
  /** Strichstärke in SVG-Units */
  strokeWidth?: number;
};

export default function AnnulusArea({
  size = 180,
  showFill = true,
  strokeWidth = 4,
}: Props) {
  // Wir rechnen alles aus dem viewBox-System heraus → super wartbar.
  const VB = 240;
  const cx = VB / 2;
  const cy = VB / 2;

  const R = 82;
  const r = 44;

  const fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  const commonStroke = {
    stroke: "currentColor",
    strokeWidth,
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  // Linien-Endpunkte aus Radien berechnen (statt fest 198/160)
  const xOuter = cx + R;
  const xInner = cx + r;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Annulus mit Innenradius r und Außenradius R"
    >
      {/* Optional: Ringfläche als dezenter Fill (even-odd) */}
      {showFill && (
        <path
          d={`
            M ${cx} ${cy}
            m ${-R} 0
            a ${R} ${R} 0 1 0 ${2 * R} 0
            a ${R} ${R} 0 1 0 ${-2 * R} 0
            M ${cx} ${cy}
            m ${-r} 0
            a ${r} ${r} 0 1 1 ${2 * r} 0
            a ${r} ${r} 0 1 1 ${-2 * r} 0
          `}
          fill="currentColor"
          fillRule="evenodd"
          opacity="0.08"
        />
      )}

      {/* Kreise */}
      <circle cx={cx} cy={cy} r={R} {...commonStroke} opacity={0.95} />
      <circle cx={cx} cy={cy} r={r} {...commonStroke} opacity={0.75} />

      {/* Mittelpunkt */}
      <circle cx={cx} cy={cy} r={4} fill="currentColor" opacity={0.9} />

      {/* Radiuslinien */}
      <path d={`M ${cx} ${cy} L ${xOuter} ${cy}`} {...commonStroke} opacity={0.9} />
      <path d={`M ${cx} ${cy} L ${xInner} ${cy}`} {...commonStroke} opacity={0.65} />

      {/* Labels: konsistent & besser lesbar */}
      <text
        x={(cx + xOuter) / 2}
        y={cy - 12}
        fill="currentColor"
        fontSize={18}
        fontFamily={fontFamily}
        opacity={0.95}
        textAnchor="middle"
      >
        R
      </text>

      <text
        x={(cx + xInner) / 2}
        y={cy + 28}
        fill="currentColor"
        fontSize={18}
        fontFamily={fontFamily}
        opacity={0.9}
        textAnchor="middle"
      >
        r
      </text>
    </svg>
  );
}
