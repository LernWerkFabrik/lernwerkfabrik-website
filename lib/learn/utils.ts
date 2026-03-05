import type { InputSpec, NormalizedInputSpec } from "./types";

/**
 * Normalisiert Einheiten so, dass typische Schreibweisen als gleich gelten.
 * Beispiele:
 * - "m/s", "m / s", "m·s⁻¹", "m*s^-1" -> "m/s"
 * - "mm²", "mm^2", "mm2"             -> "mm^2"
 */
export function normalizeUnit(u: string) {
  let s = u ?? "";

  // 1) Whitespace robust entfernen (inkl. NBSP)
  s = s.replace(/\u00A0/g, " "); // NBSP -> Space
  s = s.trim().toLowerCase();
  s = s.replace(/\s+/g, ""); // "m / s" -> "m/s"

  // 2) Unicode-Multiplikationszeichen vereinheitlichen: · ⋅ × -> *
  s = s.replace(/[·⋅×]/g, "*");

  // 3) Unicode Minus vereinheitlichen: − – — -> -
  s = s.replace(/[−–—]/g, "-");

  // 4) Hochzahlen / Exponenten vereinheitlichen (z.B. s⁻¹, mm²)
  const superscriptMap: Record<string, string> = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁻": "-", // superscript minus
  };

  // z.B. "s⁻¹" -> "s-1", "mm²" -> "mm2"
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) =>
    m
      .split("")
      .map((ch) => superscriptMap[ch] ?? ch)
      .join("")
  );

  // 5) Häufige Schreibweise ohne ^ vereinheitlichen: "mm2" -> "mm^2", "cm3" -> "cm^3"
  // (nur wenn direkt hinter einer Buchstabeneinheit eine Zahl steht)
  s = s.replace(/([a-z]+)(-?\d+)\b/g, "$1^$2");

  // 6) Alias-/Kanonisierungstabelle (nach Normalisierung!)
  const ALIASES: Record<string, string> = {
    // Geschwindigkeit
    "m/s": "m/s",
    "m*s^-1": "m/s",
    "m*s-1": "m/s",
    "ms^-1": "m/s",
    "ms-1": "m/s",

    // Kraft
    "n": "n",
    "newton": "n",

    // Drehmoment (Kontext: Newtonmeter)
    "nm": "nm",
    "n*m": "nm",

    // Länge
    "mm": "mm",
    "cm": "cm",
    "m": "m",

    // Zeit
    "s": "s",
    "sec": "s",
    "sek": "s",
    "min": "min",
    "h": "h",

    // Fläche
    "mm^2": "mm^2",
    "cm^2": "cm^2",
    "m^2": "m^2",

    // Volumen
    "mm^3": "mm^3",
    "cm^3": "cm^3",
    "m^3": "m^3",
  };

  const mapped = ALIASES[s];
  if (mapped) return mapped;

  // Letzte kleine Heuristik (falls irgendwas seltsam übrig bleibt)
  if (s === "m*s^-1" || s === "m*s-1" || s === "ms^-1" || s === "ms-1") return "m/s";

  return s;
}

export function parseNumber(s: string) {
  return Number(String(s).replace(",", "."));
}

export function normalizeInputSpec(spec?: InputSpec): NormalizedInputSpec {
  return {
    mode: spec?.mode ?? "decimal",
    allowNegative: spec?.allowNegative ?? false,
    maxDecimals: typeof spec?.maxDecimals === "number" ? spec.maxDecimals : undefined,
  };
}
