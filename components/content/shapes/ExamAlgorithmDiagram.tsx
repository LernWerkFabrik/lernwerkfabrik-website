// components/content/shapes/ExamAlgorithmDiagram.tsx
import React from "react";

type Props = { size?: number; className?: string };

export default function ExamAlgorithmDiagram({ size = 520, className }: Props) {
  const W = 1200;
  const H = 560;

  const outW = Math.max(320, Math.round(size));
  const outH = Math.round((outW * H) / W);

  const stroke = 2.25;
  const line = "currentColor";
  const text = "currentColor";
  const rx = 18;
  const GAP = 2;

  const boxH = 120;
  const gapY = 36;

  const L = { x: 60, w: 420 };

  // ✅ more space between diamond and right column
  const R = { x: 780, w: 420 }; // was 740

  const y1 = 110;
  const y2 = y1 + boxH + gapY;
  const y3 = y2 + boxH + gapY;

  const midX = (col: { x: number; w: number }) => col.x + col.w / 2;

  const step = (col: { x: number; w: number }, y: number) => ({
    x: col.x,
    y,
    w: col.w,
    h: boxH,
    top: { x: midX(col), y },
    bottom: { x: midX(col), y: y + boxH },
    left: { x: col.x, y: y + boxH / 2 },
    right: { x: col.x + col.w, y: y + boxH / 2 },
    midY: y + boxH / 2,
  });

  const S1 = step(L, y1);
  const S2 = step(L, y2);
  const S3 = step(L, y3);

  const S4 = step(R, y1);
  const S5 = step(R, y2);
  const S6 = step(R, y3);

  // Diamond aligned with "Gegeben/gesucht" center, slightly left to keep balance
  const dCy = S2.midY;
  const dCx = 640; // was 660, moved left to keep overall balance after shifting R
  const dW = 172;
  const dH = 154;

  const D = {
    left: { x: dCx - dW / 2, y: dCy },
    right: { x: dCx + dW / 2, y: dCy },
    top: { x: dCx, y: dCy - dH / 2 },
    bottom: { x: dCx, y: dCy + dH / 2 },
  };

  const ortho = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    via: { x: number; y: number }[] = []
  ) => {
    const pts = [p1, ...via, p2];
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  const withEndGap = (from: { x: number; y: number }, to: { x: number; y: number }, gap = GAP) => {
    let x = to.x;
    let y = to.y;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) > Math.abs(dy)) x = to.x - Math.sign(dx) * gap;
    else if (Math.abs(dy) > 0) y = to.y - Math.sign(dy) * gap;
    return { x, y };
  };

  const Path = ({ d, marker }: { d: string; marker?: "arrow" | "none" }) => (
    <path
      d={d}
      fill="none"
      stroke={line}
      strokeWidth={stroke}
      markerEnd={marker === "arrow" ? "url(#arrow)" : undefined}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );

  const Chip = ({ x, y, label }: { x: number; y: number; label: string }) => (
    <g>
      <rect x={x} y={y} width={52} height={28} rx={10} ry={10} fill="none" stroke={line} strokeWidth={stroke} />
      <text x={x + 26} y={y + 20} textAnchor="middle" fontSize={16} fontWeight={850} fill={text}>
        {label}
      </text>
    </g>
  );

  const Node = ({
    x,
    y,
    bw,
    bh,
    badge,
    title,
    subtitle,
  }: {
    x: number;
    y: number;
    bw: number;
    bh: number;
    badge: string;
    title: string;
    subtitle: string;
  }) => {
    const bR = 15;
    const bCx = x + 30;
    const bCy = y + 28;

    return (
      <g>
        <rect x={x} y={y} width={bw} height={bh} rx={rx} ry={rx} fill="none" stroke={line} strokeWidth={stroke} />
        <circle cx={bCx} cy={bCy} r={bR} fill="none" stroke={line} strokeWidth={stroke} />
        <text x={bCx} y={bCy + 8} textAnchor="middle" fontSize={20} fontWeight={900} fill={text}>
          {badge}
        </text>

        <text x={x + 58} y={y + 50} fontSize={30} fontWeight={900} fill={text}>
          {title}
        </text>
        <text x={x + 58} y={y + 88} fontSize={22} fontWeight={600} fill={text} opacity={0.9}>
          {subtitle}
        </text>
      </g>
    );
  };

  const Decision = ({ cx, cy, dw, dh, label }: { cx: number; cy: number; dw: number; dh: number; label: string }) => {
    const x = cx - dw / 2;
    const y = cy - dh / 2;
    const points = [`${cx},${y}`, `${x + dw},${cy}`, `${cx},${y + dh}`, `${x},${cy}`].join(" ");
    return (
      <g>
        <polygon points={points} fill="none" stroke={line} strokeWidth={stroke} />
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={26} fontWeight={900} fill={text}>
          {label}
        </text>
      </g>
    );
  };

  // ===== Routing =====
  // JA: diamond top -> align to Rechnen midY -> straight into Rechnen
  const yesY = S4.midY;
  const yesApproachX = S4.left.x - 18;

  // NEIN: straight horizontal diamond-left -> step2-right
  const noGapMidX = Math.round((S2.right.x + D.left.x) / 2);

  // INPUT: Ansatz -> diamond bottom
  const inX = D.bottom.x;
  const inApproachY = D.bottom.y + 28;

  // Labels (keep off lines)
  const chipJa = { x: D.top.x + 12, y: yesY - 44 };
  const chipNein = { x: noGapMidX - 26, y: D.left.y - 48 };

  return (
    <>
      <svg
        width={outW}
        height={outH}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Prüfungs-Algorithmus als Ablaufgrafik"
        className={`block h-auto w-full ${className ?? ""}`.trim()}
        style={{ width: "100%", height: "auto", maxWidth: outW }}
      >
        <defs>
          {/* smaller arrowheads */}
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={line} />
          </marker>
        </defs>

        {/* Title */}
        <text x={60} y={60} fontSize={34} fontWeight={950} fill={text}>
          Prüfungs-Algorithmus (Kurzschema)
        </text>

        {/* Nodes */}
        <Node x={S1.x} y={S1.y} bw={S1.w} bh={S1.h} badge="1" title="Aufgabe lesen" subtitle="Was ist gefragt? Welche Größe?" />
        <Node x={S2.x} y={S2.y} bw={S2.w} bh={S2.h} badge="2" title="Gegeben/gesucht" subtitle="Einheiten prüfen, Skizze?" />
        <Node x={S3.x} y={S3.y} bw={S3.w} bh={S3.h} badge="3" title="Ansatz / Formel" subtitle="Passende Gleichung wählen" />

        <Node x={S4.x} y={S4.y} bw={S4.w} bh={S4.h} badge="4" title="Rechnen" subtitle="Sauber einsetzen & umformen" />
        <Node x={S5.x} y={S5.y} bw={S5.w} bh={S5.h} badge="5" title="Plausibilität" subtitle="Größenordnung? Einheit ok?" />
        <Node x={S6.x} y={S6.y} bw={S6.w} bh={S6.h} badge="6" title="Antwort" subtitle="Mit Einheit + Satz" />

        {/* Vertical arrows */}
        <Path d={ortho(S1.bottom, withEndGap(S1.bottom, S2.top))} marker="arrow" />
        <Path d={ortho(S2.bottom, withEndGap(S2.bottom, S3.top))} marker="arrow" />
        <Path d={ortho(S4.bottom, withEndGap(S4.bottom, S5.top))} marker="arrow" />
        <Path d={ortho(S5.bottom, withEndGap(S5.bottom, S6.top))} marker="arrow" />

        {/* Decision */}
        <Decision cx={dCx} cy={dCy} dw={dW} dh={dH} label="Stimmt’s?" />

        {/* Ansatz -> diamond bottom */}
        <Path
          d={ortho(
            S3.right,
            withEndGap({ x: inX, y: inApproachY }, D.bottom),
            [
              { x: inX, y: S3.right.y },
              { x: inX, y: inApproachY },
            ]
          )}
          marker="arrow"
        />

        {/* JA */}
        <Path d={ortho(D.top, { x: D.top.x, y: yesY })} marker="none" />
        <Path
          d={ortho(
            { x: D.top.x, y: yesY },
            withEndGap({ x: yesApproachX, y: yesY }, S4.left),
            [{ x: yesApproachX, y: yesY }]
          )}
          marker="arrow"
        />

        {/* NEIN */}
        <Path d={ortho(D.left, withEndGap(D.left, S2.right))} marker="arrow" />

        {/* Labels */}
        <Chip x={chipJa.x} y={chipJa.y} label="Ja" />
        <Chip x={chipNein.x} y={chipNein.y} label="Nein" />
      </svg>
    </>
  );
}
