// lib/questionGenerator.ts
export type Answer = { value: number; unit: string };

export type StaticQuestion = {
  id: string;
  prompt: string;
  answer: Answer;
  tolerance?: number;
  solution?: string;
  input?: any;
};

type RangeVar = { min: number; max: number; step?: number };
type FixedVar = { value: number | string };

type PrimitiveVar = number;
export type TemplateVars = Record<string, RangeVar | FixedVar | PrimitiveVar>;

export type QuestionTemplateKind =
  | "pressure_bar_from_kn_cm2"
  | "torque_nm"
  | "cylinder_volume_cm3"
  | "cylinder_mass_g"
  | "speed_m_s"
  | "power_w_from_f_v"
  | "work_j_from_f_s"
  | "density_g_cm3_from_m_g_v_cm3"
  | "mass_kg_from_rho_kg_m3_v_m3";

export type TemplatedQuestion = {
  id: string;
  template: {
    kind: QuestionTemplateKind;
    prompt: string; // supports {{var}}
    vars?: TemplateVars;
    variants?: any[];
    unit?: string;
    tolerance?: number;
    solution?: string; // supports {{var}}
    round?: number; // decimals (answer rounding)
  };
  input?: any;
};

export type AnyQuestion = StaticQuestion | TemplatedQuestion;

export type HydratedQuestion = StaticQuestion & {
  _vars?: Record<string, number>;
  _seed?: number;
  _difficulty?: number; // 0..1
};

function isTemplated(q: AnyQuestion): q is TemplatedQuestion {
  return typeof (q as any)?.template?.kind === "string";
}

/** Deterministic RNG */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Count decimals of a step like 0.1 -> 1, 0.25 -> 2, 1 -> 0 */
function decimalsFromStep(step: number) {
  if (!Number.isFinite(step) || step === 0) return 0;

  const s = step.toString().toLowerCase();
  if (s.includes("e-")) {
    const m = s.match(/e-(\d+)/);
    return m ? Math.min(10, parseInt(m[1], 10)) : 0;
  }

  const dot = s.indexOf(".");
  if (dot === -1) return 0;
  return Math.min(10, s.length - dot - 1);
}


function countDecimals(n: number) {
  // Count decimals in a number, robust against scientific notation.
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  if (s.includes("e") || s.includes("E")) {
    const [base, expStr] = s.split(/e/i);
    const exp = parseInt(expStr, 10);
    const dec = (base.split(".")[1] || "").length;
    return Math.max(0, dec - exp);
  }
  const dot = s.indexOf(".");
  return dot >= 0 ? s.length - dot - 1 : 0;
}

function roundTo(value: number, decimals: number) {
  const f = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Linear interpolation */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Clamp 0..1 */
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Ease curve: starts gentle, increases later.
 * Makes 1..25 feel like a smooth ramp instead of "suddenly hard".
 */
function easeInOut(t: number) {
  t = clamp01(t);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Format for prompt/solution: round, trim zeros, german comma */
function formatNumber(value: number, maxDecimals = 6) {
  if (!Number.isFinite(value)) return String(value);

  const r = roundTo(value, maxDecimals);

  let s = Math.abs(r) >= 1e-6 && Math.abs(r) < 1e21 ? r.toString() : r.toFixed(maxDecimals);

  if (s.includes(".")) s = s.replace(/\.?0+$/, "");

  return s.replace(".", ",");
}

/**
 * Difficulty-aware range shrinking:
 * - early (difficulty ~0): values are near min (small numbers)
 * - later (difficulty ~1): full min..max available
 *
 * We scale the "effective max" from min up to max.
 */
function effectiveRange(v: RangeVar, difficulty: number): RangeVar {
  const step = v.step ?? 1;
  const d = easeInOut(clamp01(difficulty));

  // ✅ sorgt dafür, dass auch Aufgabe 1 variieren kann
  const MIN_BAND = 0.22; // 22% der Range sind schon bei difficulty=0 verfügbar

  const t = MIN_BAND + (1 - MIN_BAND) * d;
  const effMax = lerp(v.min, v.max, t);

  return { min: v.min, max: Math.max(v.min, effMax), step };
}


function pickFromRange(rng: () => number, v: RangeVar): number {
  const step = v.step ?? 1;
  const count = Math.floor((v.max - v.min) / step) + 1;
  const idx = Math.floor(rng() * count);

  const raw = v.min + idx * step;

  const dec = decimalsFromStep(step);
  return dec > 0 ? roundTo(raw, dec) : raw;
}

function resolveVarsBase(rng: () => number, vars: TemplateVars | undefined, difficulty: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (!vars) return out;
  for (const [k, defRaw] of Object.entries(vars)) {
    const def = typeof defRaw === "number" ? ({ value: defRaw } as FixedVar) : (defRaw as any);

    if ("value" in def) {
      const resolved = resolveTemplateNumber(def.value, out);
      out[k] = resolved ?? 0;
    } else {
      const eff = effectiveRange(def, difficulty);
      out[k] = pickFromRange(rng, eff);
    }
  }
  return out;
}

function interpolate(text: string, vars: Record<string, number>) {
  // Supports both {{key}} (legacy) and {key} (simpler authoring).
  const replaceKey = (_whole: string, key: string) => {
    const v = vars[key];
    if (v == null) return _whole;
    if (Number.isInteger(v)) return String(v);
    return formatNumber(v, 6);
  };

  const afterDouble = text.replace(/\{\{(\w+)\}\}/g, replaceKey);

  // Avoid touching double-brace placeholders by only replacing single braces that are not part of {{ }}.
  return afterDouble.replace(/(^|[^{])\{(\w+)\}([^}]|$)/g, (m, pre, key, post) => {
    const v = vars[key];
    if (v == null) return m;
    const rendered = Number.isInteger(v) ? String(v) : formatNumber(v, 6);
    return `${pre}${rendered}${post}`;
  });
}

function evalNumericExpression(raw: string): number | null {
  const s = String(raw ?? "").replace(",", ".").trim();
  if (!s) return null;

  // Allow only basic arithmetic expression chars.
  if (/^[0-9+\-*/().\s]+$/.test(s)) {
    try {
      const n = Function(`"use strict"; return (${s});`)();
      if (typeof n === "number" && Number.isFinite(n)) return n;
    } catch {
      // fall through
    }
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function resolveTemplateNumber(raw: unknown, vars: Record<string, number>): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const rendered = interpolate(raw, vars);
  return evalNumericExpression(rendered);
}

function canonicalUnit(u: string) {
  // keep output consistent across the app
  if (u === "N*m") return "N·m";
  if (u === "cm3") return "cm³";
  if (u === "g/cm3") return "g/cm³";
  return u;
}

function fmt(v: number, dec = 6) {
  return formatNumber(v, dec);
}

function autoSolution(
  kind: QuestionTemplateKind,
  vars: Record<string, number>,
  answer: { value: number; unit: string },
  roundDecimals: number
) {
  const pi = Math.PI;

  switch (kind) {
    case "speed_m_s": {
      const s = vars.s_m;
      const t = vars.t_s;
      const v = s / t;
      return [
        `1) Formel: v = s / t`,
        `2) Einsetzen: v = ${fmt(s)} / ${fmt(t)} = ${fmt(v, 6)} m/s`,
        `3) Gerundet: v ≈ ${fmt(roundTo(v, roundDecimals), roundDecimals)} m/s`,
      ].join("\n");
    }

    case "power_w_from_f_v": {
      const F = vars.F_N;
      const v = vars.v_ms;
      const P = F * v;
      return [
        `1) Formel: P = F · v`,
        `2) Einsetzen: P = ${fmt(F)} · ${fmt(v)} = ${fmt(P, 6)} W`,
        `3) Gerundet: P ≈ ${fmt(roundTo(P, roundDecimals), roundDecimals)} W`,
      ].join("\n");
    }

    case "work_j_from_f_s": {
      const F = vars.F_N;
      const s = vars.s_m;
      const W = F * s;
      return [
        `1) Formel: W = F · s`,
        `2) Einsetzen: W = ${fmt(F)} · ${fmt(s)} = ${fmt(W, 6)} J`,
        `3) Gerundet: W ≈ ${fmt(roundTo(W, roundDecimals), roundDecimals)} J`,
      ].join("\n");
    }

    case "torque_nm": {
      const F = vars.F_N;
      const r_m = vars.r_m != null ? vars.r_m : vars.r_mm / 1000;
      const r_mm = vars.r_mm != null ? vars.r_mm : r_m * 1000;
      const M = F * r_m;
      return [
        `1) Umrechnen: r = ${fmt(r_mm)} mm = ${fmt(r_m, 6)} m`,
        `2) Formel: M = F · r`,
        `3) Einsetzen: M = ${fmt(F)} · ${fmt(r_m, 6)} = ${fmt(M, 6)} N·m`,
        `4) Gerundet: M ≈ ${fmt(roundTo(M, roundDecimals), roundDecimals)} N·m`,
      ].join("\n");
    }

    case "pressure_bar_from_kn_cm2": {
      const F_kN = vars.F_kN;
      const A_cm2 = vars.A_cm2;

      const F_N = F_kN * 1000;
      const A_m2 = A_cm2 * 1e-4;
      const p_Pa = F_N / A_m2;
      const p_bar = p_Pa / 100000;

      return [
        `1) Umrechnen: F = ${fmt(F_kN)} kN = ${fmt(F_N)} N`,
        `2) Umrechnen: A = ${fmt(A_cm2)} cm² = ${fmt(A_m2, 6)} m²`,
        `3) Formel: p = F / A`,
        `4) Einsetzen: p = ${fmt(F_N)} / ${fmt(A_m2, 6)} = ${fmt(p_Pa, 2)} Pa`,
        `5) Pa → bar: p = ${fmt(p_Pa, 2)} / 100000 = ${fmt(p_bar, 6)} bar`,
        `6) Gerundet: p ≈ ${fmt(roundTo(p_bar, roundDecimals), roundDecimals)} bar`,
      ].join("\n");
    }

    case "cylinder_volume_cm3": {
      const d = vars.d_mm;
      const h = vars.h_mm;
      const r = d / 2;
      const V_mm3 = pi * r * r * h;
      const V_cm3 = V_mm3 / 1000;

      return [
        `1) Radius: r = d/2 = ${fmt(d)} / 2 = ${fmt(r)} mm`,
        `2) Formel: V = π · r² · h`,
        `3) Einsetzen: V = π · ${fmt(r)}² · ${fmt(h)} = ${fmt(V_mm3, 2)} mm³`,
        `4) Umrechnen: 1 cm³ = 1000 mm³ → V = ${fmt(V_mm3, 2)} / 1000 = ${fmt(V_cm3, 6)} cm³`,
        `5) Gerundet: V ≈ ${fmt(roundTo(V_cm3, roundDecimals), roundDecimals)} cm³`,
      ].join("\n");
    }

    case "cylinder_mass_g": {
      const d = vars.d_mm;
      const h = vars.h_mm;
      const rho = vars.rho_g_cm3;

      const r = d / 2;
      const V_mm3 = pi * r * r * h;
      const V_cm3 = V_mm3 / 1000;
      const m = rho * V_cm3;

      return [
        `1) Radius: r = d/2 = ${fmt(d)} / 2 = ${fmt(r)} mm`,
        `2) Volumen (mm³): V = π · r² · h = π · ${fmt(r)}² · ${fmt(h)} = ${fmt(V_mm3, 2)} mm³`,
        `3) Umrechnen: V = ${fmt(V_mm3, 2)} / 1000 = ${fmt(V_cm3, 6)} cm³`,
        `4) Masse: m = ρ · V = ${fmt(rho)} · ${fmt(V_cm3, 6)} = ${fmt(m, 6)} g`,
        `5) Gerundet: m ≈ ${fmt(roundTo(m, roundDecimals), roundDecimals)} g`,
      ].join("\n");
    }

    case "density_g_cm3_from_m_g_v_cm3": {
      const m = vars.m_g;
      const V = vars.V_cm3;
      const rho = m / V;
      return [
        `1) Formel: ρ = m / V`,
        `2) Einsetzen: ρ = ${fmt(m)} / ${fmt(V)} = ${fmt(rho, 6)} g/cm³`,
        `3) Gerundet: ρ ≈ ${fmt(roundTo(rho, roundDecimals), roundDecimals)} g/cm³`,
      ].join("\n");
    }

    case "mass_kg_from_rho_kg_m3_v_m3": {
      const rho = vars.rho_kg_m3;
      const V = vars.V_m3;
      const m = rho * V;
      return [
        `1) Formel: m = ρ · V`,
        `2) Einsetzen: m = ${fmt(rho)} · ${fmt(V, 6)} = ${fmt(m, 6)} kg`,
        `3) Gerundet: m ≈ ${fmt(roundTo(m, roundDecimals), roundDecimals)} kg`,
      ].join("\n");
    }

    default: {
      // fallback: show final only
      return `Ergebnis: ${fmt(answer.value, roundDecimals)} ${answer.unit}`;
    }
  }
}

function compute(
  kind: QuestionTemplateKind,
  v: Record<string, number>
): { value: number; unit: string; defaultTol: number } {
  const pi = Math.PI;

  switch (kind) {
    case "pressure_bar_from_kn_cm2": {
      const F = v.F_kN * 1000; // N
      const A = v.A_cm2 * 1e-4; // m2
      const pa = F / A;
      const bar = pa / 100000;
      return { value: bar, unit: "bar", defaultTol: 0.2 };
    }

    case "torque_nm": {
      const F = v.F_N;
      const r = v.r_m != null ? v.r_m : v.r_mm / 1000;
      return { value: F * r, unit: "N·m", defaultTol: 0.3 };
    }

    case "cylinder_volume_cm3": {
      const d = v.d_mm;
      const h = v.h_mm;
      const r = d / 2; // mm
      const V_mm3 = pi * r * r * h;
      const V_cm3 = V_mm3 / 1000;
      return { value: V_cm3, unit: "cm³", defaultTol: 0.3 };
    }

    case "cylinder_mass_g": {
      const d = v.d_mm;
      const h = v.h_mm;
      const rho = v.rho_g_cm3;
      const r = d / 2; // mm
      const V_mm3 = pi * r * r * h;
      const V_cm3 = V_mm3 / 1000;
      const m_g = rho * V_cm3;
      return { value: m_g, unit: "g", defaultTol: 3 };
    }

    case "speed_m_s": {
      const s = v.s_m;
      const t = v.t_s;
      return { value: s / t, unit: "m/s", defaultTol: 0.05 };
    }

    case "power_w_from_f_v": {
      const P = v.F_N * v.v_ms;
      return { value: P, unit: "W", defaultTol: 1 };
    }

    case "work_j_from_f_s": {
      const W = v.F_N * v.s_m;
      return { value: W, unit: "J", defaultTol: 1 };
    }

    case "density_g_cm3_from_m_g_v_cm3": {
      const rho = v.m_g / v.V_cm3;
      return { value: rho, unit: "g/cm³", defaultTol: 0.02 };
    }

    case "mass_kg_from_rho_kg_m3_v_m3": {
      const m = v.rho_kg_m3 * v.V_m3;
      return { value: m, unit: "kg", defaultTol: 0.02 };
    }
  }
}

/**
 * Try to make early tasks "cleaner":
 * - small difficulty: prefer nicer numbers/results
 * - high difficulty: accept anything
 *
 * We do this without changing templates by re-rolling vars a few times.
 */
function resolveVarsWithQuality(
  rng: () => number,
  kind: QuestionTemplateKind,
  vars: TemplateVars | undefined,
  difficulty: number,
  roundDecimals: number
) {
  // If there are no vars, there is nothing to resolve.
  if (!vars) return {};

  const d = clamp01(difficulty);

  // More attempts early; fewer later.
  const attempts = d < 0.25 ? 20 : d < 0.5 ? 10 : d < 0.75 ? 5 : 1;

  let best: { vars: Record<string, number>; score: number } | null = null;

  for (let i = 0; i < attempts; i++) {
    const candidate = resolveVarsBase(rng, vars, difficulty);

    // Some kinds don't have a numeric compute() result (or compute may return undefined).
    // In that case we just skip quality scoring and keep the base resolution.
    const res = compute(kind, candidate) as any;
    if (!res || typeof res.value !== "number" || !Number.isFinite(res.value)) {
      // Can't score → treat first candidate as best fallback.
      if (!best) best = { vars: candidate, score: 0 };
      continue;
    }

    const rounded = roundTo(res.value, roundDecimals);

    // Heuristic scoring: lower is better
    // Prefer:
    // - values not too tiny / not too huge
    // - values with few decimals after rounding
    // - avoid awkward near-zero results
    const abs = Math.abs(rounded);
    const magnitudePenalty = abs < 0.2 ? 5 : abs < 1 ? 2 : abs > 5000 ? 4 : abs > 500 ? 2 : 0;

    const decimals = countDecimals(rounded);
    const decimalPenalty = decimals > 2 ? 2 : decimals > 0 ? 1 : 0;

    const score = magnitudePenalty + decimalPenalty;

    if (!best || score < best.score) best = { vars: candidate, score };
  }

  return best ? best.vars : resolveVarsBase(rng, vars, difficulty);
}


function buildSolutionMarkdown(
  kind: QuestionTemplateKind,
  vars: Record<string, number>,
  answer: { value: number; unit: string },
  roundDecimals: number
) {
  const fmt = (v: number, d = 6) => formatNumber(v, d);
  const pi = Math.PI;

  // kleine Helper
  const h = (t: string) => `**${t}**`;
  const line = (...xs: string[]) => xs.join("\n");

  switch (kind) {
    case "speed_m_s": {
      const s = vars.s_m;
      const t = vars.t_s;
      const v = s / t;
      const vr = roundTo(v, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $s = ${fmt(s)}\\,\\mathrm{m}$`,
        `  - $t = ${fmt(t)}\\,\\mathrm{s}$`,
        `- **Gesucht:**`,
        `  - $v\\,\\mathrm{in}\\,\\mathrm{m/s}$`,
        ``,
        `### 2) Formel`,
        `$$v = \\frac{s}{t}$$`,
        ``,
        `### 3) Einsetzen`,
        `$$v = \\frac{${fmt(s)}}{${fmt(t)}}$$`,
        ``,
        `### 4) Rechnen`,
        `$$v = ${fmt(v, 6)}\\,\\mathrm{m/s} \\approx ${fmt(vr, roundDecimals)}\\,\\mathrm{m/s}$$`,
        ``,
        `✅ **Ergebnis:** $v = ${fmt(vr, roundDecimals)}\\,\\mathrm{m/s}$`,
        ``,
        `> **Plausibilität:** ${fmt(s)} m in ${fmt(t)} s → ${fmt(vr, roundDecimals)} m/s ist realistisch.`,
        ``
      );
    }

    case "work_j_from_f_s": {
      const F = vars.F_N;
      const s = vars.s_m;
      const W = F * s;
      const Wr = roundTo(W, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $F = ${fmt(F)}\\,\\mathrm{N}$`,
        `  - $s = ${fmt(s)}\\,\\mathrm{m}$`,
        `- **Gesucht:**`,
        `  - $W\\,\\mathrm{in}\\,\\mathrm{J}$`,
        ``,
        `### 2) Formel`,
        `$$W = F \\cdot s$$`,
        ``,
        `### 3) Einsetzen`,
        `$$W = ${fmt(F)} \\cdot ${fmt(s)}$$`,
        ``,
        `### 4) Rechnen`,
        `$$W = ${fmt(W, 6)}\\,\\mathrm{J} \\approx ${fmt(Wr, roundDecimals)}\\,\\mathrm{J}$$`,
        ``,
        `✅ **Ergebnis:** $W = ${fmt(Wr, roundDecimals)}\\,\\mathrm{J}$`,
        ``
      );
    }

    case "power_w_from_f_v": {
      const F = vars.F_N;
      const v = vars.v_ms;
      const P = F * v;
      const Pr = roundTo(P, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $F = ${fmt(F)}\\,\\mathrm{N}$`,
        `  - $v = ${fmt(v)}\\,\\mathrm{m/s}$`,
        `- **Gesucht:**`,
        `  - $P\\,\\mathrm{in}\\,\\mathrm{W}$`,
        ``,
        `### 2) Formel`,
        `$$P = F \\cdot v$$`,
        ``,
        `### 3) Einsetzen`,
        `$$P = ${fmt(F)} \\cdot ${fmt(v)}$$`,
        ``,
        `### 4) Rechnen`,
        `$$P = ${fmt(P, 6)}\\,\\mathrm{W} \\approx ${fmt(Pr, roundDecimals)}\\,\\mathrm{W}$$`,
        ``,
        `✅ **Ergebnis:** $P = ${fmt(Pr, roundDecimals)}\\,\\mathrm{W}$`,
        ``
      );
    }

    case "torque_nm": {
      const F = vars.F_N;
      const r_m = vars.r_m != null ? vars.r_m : vars.r_mm / 1000;
      const M = F * r_m;
      const Mr = roundTo(M, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $F = ${fmt(F)}\\,\\mathrm{N}$`,
        `  - $r = ${fmt(r_m)}\\,\\mathrm{m}$`,
        `- **Gesucht:**`,
        `  - $M\\,\\mathrm{in}\\,\\mathrm{N\\cdot m}$`,
        ``,
        `### 2) Formel`,
        `$$M = F \\cdot r$$`,
        ``,
        `### 3) Einsetzen`,
        `$$M = ${fmt(F)} \\cdot ${fmt(r_m)}$$`,
        ``,
        `### 4) Rechnen`,
        `$$M = ${fmt(M, 6)}\\,\\mathrm{N\\cdot m} \\approx ${fmt(Mr, roundDecimals)}\\,\\mathrm{N\\cdot m}$$`,
        ``,
        `✅ **Ergebnis:** $M = ${fmt(Mr, roundDecimals)}\\,\\mathrm{N\\cdot m}$`,
        ``
      );
    }

    case "pressure_bar_from_kn_cm2": {
      const FkN = vars.F_kN;
      const Acm2 = vars.A_cm2;
      const FN = FkN * 1000;
      const Am2 = Acm2 * 1e-4;
      const pPa = FN / Am2;
      const pbar = pPa / 100000;
      const pbr = roundTo(pbar, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $F = ${fmt(FkN)}\\,\\mathrm{kN}$`,
        `  - $A = ${fmt(Acm2)}\\,\\mathrm{cm^2}$`,
        `- **Gesucht:**`,
        `  - $p\\,\\mathrm{in}\\,\\mathrm{bar}$`,
        ``,
        `### 2) Umrechnen`,
        `- $F = ${fmt(FkN)}\\,\\mathrm{kN} = ${fmt(FN)}\\,\\mathrm{N}$`,
        `- $A = ${fmt(Acm2)}\\,\\mathrm{cm^2} = ${fmt(Am2, 6)}\\,\\mathrm{m^2}$`,
        ``,
        `### 3) Formel`,
        `$$p = \\frac{F}{A}$$`,
        ``,
        `### 4) Einsetzen & Rechnen`,
        `$$p = \\frac{${fmt(FN)}}{${fmt(Am2, 6)}} = ${fmt(pPa, 2)}\\,\\mathrm{Pa}$$`,
        `$$p = ${fmt(pPa, 2)} / 100000 = ${fmt(pbar, 6)}\\,\\mathrm{bar} \\approx ${fmt(pbr, roundDecimals)}\\,\\mathrm{bar}$$`,
        ``,
        `✅ **Ergebnis:** $p = ${fmt(pbr, roundDecimals)}\\,\\mathrm{bar}$`,
        ``
      );
    }

    case "cylinder_volume_cm3": {
      const d = vars.d_mm;
      const hmm = vars.h_mm;
      const r = d / 2;
      const Vmm3 = pi * r * r * hmm;
      const Vcm3 = Vmm3 / 1000;
      const Vcr = roundTo(Vcm3, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $d = ${fmt(d)}\\,\\mathrm{mm}$`,
        `  - $h = ${fmt(hmm)}\\,\\mathrm{mm}$`,
        `- **Gesucht:**`,
        `  - $V\\,\\mathrm{in}\\,\\mathrm{cm^3}$`,
        ``,
        `### 2) Formel`,
        `$$V = \\pi \\cdot r^2 \\cdot h,\\quad r=\\frac{d}{2}$$`,
        ``,
        `### 3) Einsetzen`,
        `$$r = ${fmt(d)}/2 = ${fmt(r)}\\,\\mathrm{mm}$$`,
        `$$V = \\pi \\cdot ${fmt(r)}^2 \\cdot ${fmt(hmm)} = ${fmt(Vmm3, 2)}\\,\\mathrm{mm^3}$$`,
        ``,
        `### 4) Umrechnen`,
        `$$1\\,\\mathrm{cm^3} = 1000\\,\\mathrm{mm^3}\\Rightarrow V = ${fmt(Vmm3, 2)}/1000 = ${fmt(Vcm3, 6)}\\,\\mathrm{cm^3}$$`,
        ``,
        `✅ **Ergebnis:** $V \\approx ${fmt(Vcr, roundDecimals)}\\,\\mathrm{cm^3}$`,
        ``
      );
    }

    case "cylinder_mass_g": {
      const d = vars.d_mm;
      const h = vars.h_mm;
      const rho = vars.rho_g_cm3;
      const r = d / 2;

      const Vmm3 = pi * r * r * h;
      const Vcm3 = Vmm3 / 1000;
      const m = rho * Vcm3;
      const mr = roundTo(m, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $d = ${fmt(d)}\\,\\mathrm{mm}$`,
        `  - $h = ${fmt(h)}\\,\\mathrm{mm}$`,
        `  - $\\rho = ${fmt(rho)}\\,\\mathrm{g/cm^3}$`,
        `- **Gesucht:**`,
        `  - $m\\,\\mathrm{in}\\,\\mathrm{g}$`,
        ``,
        `### 2) Formel`,
        `$$m = \\rho \\cdot V,\\quad V = \\pi r^2 h,\\quad r=\\frac{d}{2}$$`,
        ``,
        `### 3) Einsetzen`,
        `$$r = ${fmt(d)}/2 = ${fmt(r)}\\,\\mathrm{mm}$$`,
        `$$V = \\pi \\cdot ${fmt(r)}^2 \\cdot ${fmt(h)} = ${fmt(Vmm3, 2)}\\,\\mathrm{mm^3}$$`,
        `$$V = ${fmt(Vmm3, 2)}/1000 = ${fmt(Vcm3, 6)}\\,\\mathrm{cm^3}$$`,
        ``,
        `### 4) Rechnen`,
        `$$m = ${fmt(rho)} \\cdot ${fmt(Vcm3, 6)} = ${fmt(m, 6)}\\,\\mathrm{g} \\approx ${fmt(mr, roundDecimals)}\\,\\mathrm{g}$$`,
        ``,
        `✅ **Ergebnis:** $m \\approx ${fmt(mr, roundDecimals)}\\,\\mathrm{g}$`,
        ``
      );
    }

    case "density_g_cm3_from_m_g_v_cm3": {
      const m = vars.m_g;
      const V = vars.V_cm3;
      const rho = m / V;
      const rhor = roundTo(rho, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $m = ${fmt(m)}\\,\\mathrm{g}$`,
        `  - $V = ${fmt(V)}\\,\\mathrm{cm^3}$`,
        `- **Gesucht:**`,
        `  - $\\rho\\,\\mathrm{in}\\,\\mathrm{g/cm^3}$`,
        ``,
        `### 2) Formel`,
        `$$\\rho = \\frac{m}{V}$$`,
        ``,
        `### 3) Einsetzen & Rechnen`,
        `$$\\rho = \\frac{${fmt(m)}}{${fmt(V)}} = ${fmt(rho, 6)}\\,\\mathrm{g/cm^3} \\approx ${fmt(rhor, roundDecimals)}\\,\\mathrm{g/cm^3}$$`,
        ``,
        `✅ **Ergebnis:** $\\rho \\approx ${fmt(rhor, roundDecimals)}\\,\\mathrm{g/cm^3}$`,
        ``
      );
    }

    case "mass_kg_from_rho_kg_m3_v_m3": {
      const rho = vars.rho_kg_m3;
      const V = vars.V_m3;
      const m = rho * V;
      const mr = roundTo(m, roundDecimals);

      return line(
        `## Lösung`,
        ``,
        `### 1) Gegeben / Gesucht`,
        `- **Gegeben:**`,
        `  - $\\rho = ${fmt(rho)}\\,\\mathrm{kg/m^3}$`,
        `  - $V = ${fmt(V, 6)}\\,\\mathrm{m^3}$`,
        `- **Gesucht:**`,
        `  - $m\\,\\mathrm{in}\\,\\mathrm{kg}$`,
        ``,
        `### 2) Formel`,
        `$$m = \\rho \\cdot V$$`,
        ``,
        `### 3) Einsetzen & Rechnen`,
        `$$m = ${fmt(rho)} \\cdot ${fmt(V, 6)} = ${fmt(m, 6)}\\,\\mathrm{kg} \\approx ${fmt(mr, roundDecimals)}\\,\\mathrm{kg}$$`,
        ``,
        `✅ **Ergebnis:** $m \\approx ${fmt(mr, roundDecimals)}\\,\\mathrm{kg}$`,
        ``
      );
    }
  }
}


function mdLine(...lines: string[]) {
  return lines.join("\n");
}

function mdGivenSought(given: string[], sought: string[]) {
  return mdLine(
    `## Lösung`,
    ``,
    `### 1) Gegeben / Gesucht`,
    ``,
    `- **Gegeben:**`,
    ...given.map((x) => `  - ${x}`),
    ``,
    `- **Gesucht:**`,
    ...sought.map((x) => `  - ${x}`),
    ``
  );
}

function mdUnitsCheck(items: string[]) {
  return mdLine(
    `### 2) Einheiten prüfen`,
    ``,
    ...items.map((x) => `- ${x} ✅`),
    ``
  );
}

function mdFormula(katexBlock: string) {
  return mdLine(
    `### 3) Formel`,
    ``,
    `$$`,
    katexBlock,
    `$$`,
    ``
  );
}

function mdSubstitution(katexBlock: string) {
  return mdLine(
    `### 4) Einsetzen`,
    ``,
    `$$`,
    katexBlock,
    `$$`,
    ``
  );
}

function mdCompute(katexBlock: string) {
  return mdLine(
    `### 5) Rechnen`,
    ``,
    `$$`,
    katexBlock,
    `$$`,
    ``
  );
}

function mdResult(line: string) {
  return mdLine(`✅ **Ergebnis:** ${line}`, ``);
}

function mdPlausibility(text: string) {
  return mdLine(
    `> **Plausibilität:** ${text}`,
    ``
  );
}




// --- Variant + interpolation helpers (supports all input forms) ---
const TEMPLATE_KEYS = new Set([
  "kind",
  "prompt",
  "vars",
  "unit",
  "round",
  "tolerance",
  "solution",
  "variants",
]);

function splitVariant(v: any) {
  // variant may either be a flat object (legacy) or have nested { template, ...rootOverrides }
  const nestedTemplate = v && typeof v === "object" && "template" in v ? (v.template ?? {}) : {};
  const flat = v && typeof v === "object" ? v : {};
  const merged = { ...flat, ...nestedTemplate };

  const tpl: any = {};
  const root: any = {};

  for (const [k, val] of Object.entries(merged)) {
    if (k === "template") continue;
    if (TEMPLATE_KEYS.has(k)) tpl[k] = val;
    else root[k] = val;
  }

  // vars are always treated as template vars
  if (flat && typeof flat === "object" && "vars" in flat) tpl.vars = (flat as any).vars;
  if (nestedTemplate && typeof nestedTemplate === "object" && "vars" in nestedTemplate) {
    tpl.vars = { ...(tpl.vars ?? {}), ...(nestedTemplate as any).vars };
  }

  return { tpl, root };
}

function deepInterpolate(anyValue: any, vars: Record<string, number>): any {
  if (anyValue == null) return anyValue;
  if (typeof anyValue === "string") return interpolate(anyValue, vars);
  if (Array.isArray(anyValue)) return anyValue.map((v) => deepInterpolate(v, vars));
  if (typeof anyValue === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(anyValue)) {
      // do not interpolate ids/keys that must remain stable for grading
      if (k === "id" || k === "key") {
        out[k] = v;
      } else {
        out[k] = deepInterpolate(v, vars);
      }
    }
    return out;
  }
  return anyValue;
}

/**
 * Deterministically shuffle single-choice options and remap correctIndex.
 * Keeps grading stable while removing positional patterns.
 */
function shuffleSingleChoiceOptions(base: any, rng: () => number) {
  const qType = String(base?.type ?? "").trim();
  if (qType !== "single_choice") return;

  const answerObj =
    base?.answer && typeof base.answer === "object" ? { ...(base.answer as Record<string, unknown>) } : null;

  const choicesSrc = Array.isArray(answerObj?.choices)
    ? [...(answerObj!.choices as unknown[])]
    : Array.isArray(base?.choices)
    ? [...(base.choices as unknown[])]
    : null;

  if (!choicesSrc || choicesSrc.length < 2) return;

  const rawCorrectIndex = (answerObj as any)?.correctIndex ?? (base as any)?.grading?.correctIndex;
  const correctIndex = Number(rawCorrectIndex);
  if (!Number.isFinite(correctIndex) || correctIndex < 0 || correctIndex >= choicesSrc.length) return;

  const oldPositions = choicesSrc.map((_, idx) => idx);
  const shuffledPositions = shuffleWithRng(oldPositions, rng);
  const shuffledChoices = shuffledPositions.map((oldIdx) => choicesSrc[oldIdx]);
  const remappedCorrectIndex = shuffledPositions.indexOf(correctIndex);

  base.answer = {
    ...(answerObj ?? {}),
    choices: shuffledChoices,
    correctIndex: remappedCorrectIndex,
  };

  if (Array.isArray(base?.choices)) {
    base.choices = [...shuffledChoices];
  }

  if (base?.grading && typeof base.grading === "object" && "correctIndex" in base.grading) {
    base.grading = {
      ...base.grading,
      correctIndex: remappedCorrectIndex,
    };
  }
}

/**
 * Deterministically shuffle multi-select options and remap correctIndices.
 * Keeps grading stable while removing positional patterns.
 */
function shuffleMultiSelectOptions(base: any, rng: () => number) {
  const qType = String(base?.type ?? "").trim();
  if (qType !== "multi_select") return;

  const answerObj =
    base?.answer && typeof base.answer === "object" ? { ...(base.answer as Record<string, unknown>) } : null;

  const choicesSrc = Array.isArray(answerObj?.choices)
    ? [...(answerObj!.choices as unknown[])]
    : Array.isArray(base?.choices)
    ? [...(base.choices as unknown[])]
    : null;
  if (!choicesSrc || choicesSrc.length < 2) return;

  const rawCorrectIndices = Array.isArray((answerObj as any)?.correctIndices)
    ? (answerObj as any).correctIndices
    : Array.isArray((base as any)?.grading?.correctIndices)
    ? (base as any).grading.correctIndices
    : null;

  const correctIndices = Array.isArray(rawCorrectIndices)
    ? rawCorrectIndices
        .map((n: any) => Number(n))
        .filter((n: number) => Number.isInteger(n) && n >= 0 && n < choicesSrc.length)
    : [];

  if (correctIndices.length <= 0) return;

  const oldPositions = choicesSrc.map((_, idx) => idx);
  const shuffledPositions = shuffleWithRng(oldPositions, rng);
  const shuffledChoices = shuffledPositions.map((oldIdx) => choicesSrc[oldIdx]);
  const remappedCorrectIndices = Array.from(
    new Set(
      correctIndices
        .map((oldIdx) => shuffledPositions.indexOf(oldIdx))
        .filter((idx) => Number.isInteger(idx) && idx >= 0)
    )
  ).sort((a, b) => a - b);

  base.answer = {
    ...(answerObj ?? {}),
    choices: shuffledChoices,
    correctIndices: remappedCorrectIndices,
  };

  if (Array.isArray(base?.choices)) {
    base.choices = [...shuffledChoices];
  }

  if (base?.grading && typeof base.grading === "object" && "correctIndices" in base.grading) {
    base.grading = {
      ...base.grading,
      correctIndices: remappedCorrectIndices,
    };
  }
}

/**
 * Hydrate questions deterministically using seed.
 * Adds a difficulty ramp across the list:
 *   i=0 -> difficulty ~0 (easy)
 *   i=n-1 -> difficulty ~1 (hard)
 */
export function hydrateQuestions(raw: AnyQuestion[], seed: number): HydratedQuestion[] {
  const rng = mulberry32(seed >>> 0);
  const n = Math.max(1, raw.length);

  return raw.map((q, i) => {
    if (!isTemplated(q)) {
      const base = { ...(q as any) };
      shuffleSingleChoiceOptions(base, rng);
      shuffleMultiSelectOptions(base, rng);
      return base as HydratedQuestion;
    }
    let tq = q as TemplatedQuestion & Record<string, any>;

    // difficulty across whole run (0..1)
    const difficulty = n === 1 ? 1 : i / (n - 1);

    // NEW: support template.variants for *all* input forms (variant may override root fields too)
    if (Array.isArray((tq as any).template?.variants) && (tq as any).template.variants.length > 0) {
      const variants = (tq as any).template.variants as any[];
      const picked = variants[Math.floor(rng() * variants.length)];

      const { tpl, root } = splitVariant(picked);

      // Apply root overrides (type, items, answer, input, help, meta, etc.)
      const mergedRoot = { ...(tq as any), ...root };

      // Apply template overrides
      mergedRoot.template = {
        ...(mergedRoot.template ?? {}),
        ...tpl,
        vars: {
          ...((mergedRoot.template ?? {}).vars ?? {}),
          ...(tpl?.vars ?? {}),
        },
        variants: undefined,
      };

      tq = mergedRoot as TemplatedQuestion & Record<string, any>;
    }

    const decimals = typeof tq.template.round === "number" ? tq.template.round : 2;

    const vars = tq.template.vars
      ? resolveVarsWithQuality(rng, tq.template.kind, tq.template.vars, difficulty, decimals)
      : {};

    let res: { value: number; unit: string; defaultTol: number } | undefined;
    try {
      res = tq.template.vars ? compute(tq.template.kind, vars) : undefined;
    } catch {
      res = undefined;
    }

    // If this template kind is not numeric-computable, we return the (possibly variant-expanded)
    // question as-is. The Practice UI handles non-numeric kinds (single_choice, order_steps, etc.).
    if (!res || typeof res.value !== "number" || !Number.isFinite(res.value)) {
      const baseInterpolated = deepInterpolate(tq as any, vars);
      const prompt = (tq as any).template?.prompt ? interpolate((tq as any).template.prompt, vars) : (baseInterpolated as any).prompt;
      const base = {
        ...(baseInterpolated as any),
        prompt,
        _vars: vars,
        _seed: seed,
        _difficulty: difficulty,
      } as any;

      // Optional helper for static numeric variants using answer.formula
      // (e.g. "a+b+c" style content in non-numeric template kinds).
      const formula = String((base as any)?.answer?.formula ?? "").trim();
      if (formula.length > 0) {
        const val = resolveTemplateNumber(formula, vars);
        if (val != null) {
          if (!(base as any).answer || typeof (base as any).answer !== "object") (base as any).answer = {};
          (base as any).answer.value = val;
          if (typeof (base as any).answer.unit !== "string") (base as any).answer.unit = "";
        }
      }

      // Shuffle order-items deterministically, keep stable ids for grading.
      if ((tq as any)?.type === "order" && Array.isArray((tq as any)?.items)) {
        const rawItems = (tq as any).items as any[];
        const normalized = rawItems.map((it, idx) => {
          if (it && typeof it === "object") {
            const id = String((it as any).id ?? idx);
            const text = String((it as any).text ?? (it as any).label ?? "");
            return { id, text };
          }
          return { id: String(idx), text: String(it) };
        });

        const correctOrder = Array.isArray((tq as any)?.answer?.correctOrder)
          ? (tq as any).answer.correctOrder
          : [];
        const correctOrderIds = Array.isArray(correctOrder) && correctOrder.length
          ? correctOrder.map((n: any) => {
              const i = Number(n);
              return Number.isFinite(i) && normalized[i] ? String(normalized[i].id) : String(n);
            })
          : normalized.map((it) => String(it.id));

        base.items = shuffleWithRng(normalized, rng);
        base.answer = {
          ...((tq as any).answer ?? {}),
          correctOrderIds,
        };
      }

      // Shuffle single-choice options deterministically and remap correctIndex.
      shuffleSingleChoiceOptions(base, rng);
      // Shuffle multi-select options deterministically and remap correctIndices.
      shuffleMultiSelectOptions(base, rng);

      return base;
    }

    const value = roundTo(res.value, decimals);

    const prompt = interpolate(tq.template.prompt, vars);
    const computedSolution = buildSolutionMarkdown(
      tq.template.kind,
      vars,
      { value, unit: tq.template.unit ?? res.unit },
      decimals
    );

    // ✅ Immer die berechnete Lösung verwenden (damit Ergebnis/Schritte stimmen)
    const solution = buildSolutionMarkdown(
      tq.template.kind,
      vars,
      { value, unit: tq.template.unit ?? res.unit },
      decimals
    );
    const unit = canonicalUnit(tq.template.unit ?? res.unit);

    return {
      id: tq.id,
      prompt,
      answer: { value, unit },
      tolerance: tq.template.tolerance ?? res.defaultTol,
      solution,
      input: (tq as any).input,
      _vars: vars,
      _seed: seed,
      _difficulty: difficulty,
    };
  });
}
