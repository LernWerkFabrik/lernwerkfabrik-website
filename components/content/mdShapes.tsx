// components/content/mdShapes.tsx
import React from "react";
import {
  CircleArea,
  RectangleArea,
  TriangleArea,
  SquareArea,
  CylinderVolume,
  CuboidVolume,
  ConeVolume,
  TriangularPrismVolume,
  PrismVolume,
  AnnulusArea,
  TrapezoidArea,
  LeverMoment,
  PressureArea,
  WorkDiagram,
  PowerTimeDiagram,
  ShaftPowerDiagram,
  UnitLengthDiagram,
  UnitAreaDiagram,
  UnitVolumeDiagram,
  WeightForceDiagram,
  TimeDiagram,
  SpeedDiagram,
  DeviationDiagram,
  ToleranceDiagram,
  ExamTrapsDiagram,
  // ✅ NEU
  ExamAlgorithmDiagram,
  RotationSpeedDiagram,
  DensityDiagram,
  ConversionQuickrefDiagram,
  TzExamAlgorithmDiagram,
  TzSymbolsDiagram,
  TzTolerancesDiagram,
  TzScalesDiagram,
  TzChamferDiagram,
  TzChainDimsDiagram,
  TzSurfaceDiagram,
  TzQuickChecksDiagram,
  KdForceUnitsDiagram,
  KdMomentAngleDiagram,
  KdEquilibriumDiagram,
  KdBeamReactionsDiagram,
  KdDistributedLoadDiagram,
  KdSignsDiagram,
} from "@/components/content/shapes/index";

export type ShapeName =
  | "circle"
  | "rectangle"
  | "triangle"
  | "square"
  | "cylinder"
  | "cuboid"
  | "cone"
  | "prism"
  | "prism_general"
  | "annulus"
  | "trapezoid"
  | "lever"
  | "pressure"
  | "work"
  | "power_time"
  | "shaft_power"
  | "unit_length"
  | "unit_area"
  | "unit_volume"
  | "weight_force"
  | "time"
  | "speed"
  | "deviation"
  | "tolerance"
  | "exam_traps"
  // ✅ NEU
  | "exam_algorithm"
  | "rotation_speed"
  | "density"
  | "conversion_quickref"
  | "tz_exam_algorithm"
  | "tz_symbols"
  | "tz_tolerances"
  | "tz_scales"
  | "tz_chamfer"
  | "tz_chain_dims"
  | "tz_surface"
  | "tz_quick_checks"
  | "kd_force_units"
  | "kd_moment_angle"
  | "kd_equilibrium"
  | "kd_beam_reactions"
  | "kd_distributed_load"
  | "kd_signs";

type ShapeComponent = React.ComponentType<{ size?: number }>;

const SHAPES: Record<ShapeName, ShapeComponent> = {
  // Flächen
  circle: CircleArea,
  rectangle: RectangleArea,
  triangle: TriangleArea,
  square: SquareArea,
  annulus: AnnulusArea,
  trapezoid: TrapezoidArea,

  // Volumen
  cylinder: CylinderVolume,
  cuboid: CuboidVolume,
  cone: ConeVolume,
  prism: TriangularPrismVolume,
  prism_general: PrismVolume,

  // Technik/Physik
  lever: LeverMoment,
  pressure: PressureArea,

  // Diagramme
  work: WorkDiagram,
  power_time: PowerTimeDiagram,
  shaft_power: ShaftPowerDiagram,

  // Einheiten
  unit_length: UnitLengthDiagram,
  unit_area: UnitAreaDiagram,
  unit_volume: UnitVolumeDiagram,

  // Weitere Diagramme
  weight_force: WeightForceDiagram,
  time: TimeDiagram,
  speed: SpeedDiagram,
  deviation: DeviationDiagram,
  tolerance: ToleranceDiagram,

  // Prüfungs-Zusätze
  exam_traps: ExamTrapsDiagram,
  // ✅ NEU
  exam_algorithm: ExamAlgorithmDiagram,

  rotation_speed: RotationSpeedDiagram,
  density: DensityDiagram,
  conversion_quickref: ConversionQuickrefDiagram,
  tz_exam_algorithm: TzExamAlgorithmDiagram,
  tz_symbols: TzSymbolsDiagram,
  tz_tolerances: TzTolerancesDiagram,
  tz_scales: TzScalesDiagram,
  tz_chamfer: TzChamferDiagram,
  tz_chain_dims: TzChainDimsDiagram,
  tz_surface: TzSurfaceDiagram,
  tz_quick_checks: TzQuickChecksDiagram,
  kd_force_units: KdForceUnitsDiagram,
  kd_moment_angle: KdMomentAngleDiagram,
  kd_equilibrium: KdEquilibriumDiagram,
  kd_beam_reactions: KdBeamReactionsDiagram,
  kd_distributed_load: KdDistributedLoadDiagram,
  kd_signs: KdSignsDiagram,

};

function ShapeBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex align-middle px-1 max-md:my-2 max-md:flex max-md:w-full max-md:justify-center max-md:px-0">
      <span className="max-w-full overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/10 p-2 [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full">
        {children}
      </span>
    </span>
  );
}

export function renderShape(name: ShapeName, size = 150) {
  const Comp = SHAPES[name];
  if (!Comp) return null;
  return <Comp size={size} />;
}

function parseShapeToken(token: string): ShapeName | null {
  const input = (token ?? "").trim().toLowerCase();
  if (!input) return null;

  const bracket = input.match(/^\[\[shape:([a-z0-9_-]+)\]\]$/i);
  const raw =
    bracket?.[1] ??
    (input.startsWith("shape:") ? input.slice("shape:".length).trim() : input);

  if (!raw) return null;
  return (raw in SHAPES ? (raw as ShapeName) : null) as ShapeName | null;
}

/** Rechte Spalte: nur SVG (keine zusätzliche Inline-Box). */
export function renderShapeInlineToken(token: string, size = 165) {
  const name = parseShapeToken(token);
  if (!name) return null;
  const shape = renderShape(name, size);
  if (!shape) return null;
  return <span className="inline-block max-w-full align-middle [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full">{shape}</span>;
}

/**
 * Fließtext: Tokens als Inline-Boxen ersetzen.
 * Robust & "pure": ersetzt rekursiv Strings in Children.
 */
export function replaceShapeTokens(children: React.ReactNode) {
  const re = /\[\[shape:([a-z0-9_-]+)\]\]/gi;

  const transform = (node: React.ReactNode): React.ReactNode => {
    if (node == null || typeof node === "boolean") return node;

    // String: tokenisieren
    if (typeof node === "string") {
      const parts: React.ReactNode[] = [];
      let last = 0;
      let match: RegExpExecArray | null;

      re.lastIndex = 0;

      while ((match = re.exec(node)) !== null) {
        const idx = match.index;
        const token = match[0];

        if (idx > last) parts.push(node.slice(last, idx));

        const name = parseShapeToken(token);
        const shape = name ? renderShape(name) : null;

        if (shape) {
          parts.push(
            <ShapeBox key={`shape-${name}-${idx}`}>
              {shape}
            </ShapeBox>
          );
        } else {
          // unbekanntes Token: unverändert lassen
          parts.push(token);
        }

        last = idx + token.length;
      }

      if (last < node.length) parts.push(node.slice(last));

      return parts.length === 1 ? parts[0] : parts;
    }

    // Array: rekursiv transformieren
    if (Array.isArray(node)) {
      return node.map((n, i) => <React.Fragment key={i}>{transform(n)}</React.Fragment>);
    }

    // React Element: children rekursiv transformieren
    if (React.isValidElement(node)) {
      const el: any = node;
      if (!el.props?.children) return node;

      const nextChildren = transform(el.props.children);
      return React.cloneElement(node, { ...el.props, children: nextChildren });
    }

    return node;
  };

  return transform(children);
}
