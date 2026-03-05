"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import Markdown from "@/components/content/Markdown";
import { getScrollRoot } from "@/components/content/scroll";
import QuestionNav from "./QuestionNav";

import { explainLocally } from "@/lib/learn/explain";
import TextAnswerField from "@/components/learn/TextAnswerField";

import type { LearnFeedback, HydratedLikeQuestion, NormalizedInputSpec } from "@/lib/learn/types";
import type { ExplainResult } from "@/lib/learn/explain";
import { CheckCircle2, ChevronDown, GripVertical, HelpCircle, XCircle } from "lucide-react";

type NotesById = Record<string, string>;
type PendingTaskCardScroll = { mode: "align-top" };
const MOBILE_TASK_CARD_TOP_GAP_PX = 14;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function rightPanelFromPrompt(
  prompt: string | undefined
): { title: string; kind: "formula" | "trap"; bodyMd: string } | null {
  const p = (prompt ?? "").toLowerCase();
  const hasWord = (word: string) => new RegExp(`\\b${word}\\b`, "i").test(p);

  // Geschwindigkeit
  if (p.includes("geschwindigkeit") || p.includes("v in m/s")) {
    return {
      title: "Formel",
      kind: "formula",
      bodyMd: [`$$v = \\frac{s}{t}$$`, ``, `**Prüfungsfalle:** Einheit am Ende prüfen (**m/s**).`].join("\n"),
    };
  }

  // Arbeit
  if (hasWord("arbeit") || p.includes("berechne die arbeit") || p.includes("berechne w")) {
    return {
      title: "Formel",
      kind: "formula",
      bodyMd: [`$$W = F \\cdot s$$`, ``, `**Prüfungsfalle:** $1\\,\\mathrm{N\\cdot m} = 1\\,\\mathrm{J}$.`].join(
        "\n"
      ),
    };
  }

  // Leistung
  if (p.includes("leistung") || p.includes("berechne die leistung") || p.includes("berechne p")) {
    return {
      title: "Formel",
      kind: "formula",
      bodyMd: [`$$P = F \\cdot v$$`, ``, `**Prüfungsfalle:** kW -> W (x1000).`].join("\n"),
    };
  }

  // Drehmoment
  if (p.includes("drehmoment") || p.includes("hebelarm")) {
    return {
      title: "Formel",
      kind: "formula",
      bodyMd: [`$$M = F \\cdot r$$`, ``, `**Prüfungsfalle:** mm -> m (x1000).`].join("\n"),
    };
  }

  // Druck / Hydraulik
  if (p.includes("druck") || p.includes("hydraul")) {
    return {
      title: "Prüfungsfalle",
      kind: "trap",
      bodyMd: [
        `**Achte auf Umrechnung:**`,
        `- $1\\,\\mathrm{kN} = 1000\\,\\mathrm{N}$`,
        `- $1\\,\\mathrm{cm^2} = 10^{-4}\\,\\mathrm{m^2}$`,
        `- $1\\,\\mathrm{bar} = 100000\\,\\mathrm{Pa}$`,
      ].join("\n"),
    };
  }

  // Zylinder
  if (p.includes("zylinder") && (p.includes("volumen") || p.includes("masse") || p.includes("dichte"))) {
    return {
      title: "Formel",
      kind: "formula",
      bodyMd: [`$$V = \\pi r^2 h,\\quad r=\\frac{d}{2}$$`, ``, `**Prüfungsfalle:** mm^3 -> cm^3 (x1000).`].join("\n"),
    };
  }

  return null;
}

function parseGermanNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const normalized = raw.replace(",", ".").trim();
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function formatGermanNumber(value: number, maxDecimals = 6): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round((value + Number.EPSILON) * 10 ** maxDecimals) / 10 ** maxDecimals;
  let s = rounded.toString();
  if (s.includes("e") || s.includes("E")) {
    s = rounded.toFixed(maxDecimals);
  }
  if (s.includes(".")) {
    s = s.replace(/\.?0+$/, "");
  }
  return s.replace(".", ",");
}

function unitToLatex(unit: string): string {
  return unit
    .replace(/Â/g, "")
    .replace(/\u00b7/g, "\\cdot ")
    .replace(/·/g, "\\cdot ")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .trim();
}

function buildResultMarkdown(value: number, unit: string): string {
  if (!Number.isFinite(value)) return "";
  const v = formatGermanNumber(value);
  const u = String(unit ?? "").trim();
  if (!u) return `✅ **Ergebnis:** ${v}`;
  return `✅ **Ergebnis:** $${v}\\,\\mathrm{${unitToLatex(u)}}$`;
}

function matchValueWithOptionalUnit(
  text: string,
  re: RegExp
): { value: number; unit?: string } | null {
  const m = text.match(re);
  if (!m) return null;
  const value = parseGermanNumber(m[1]);
  if (value == null) return null;
  const unit = m[2] ? String(m[2]).toLowerCase() : undefined;
  return { value, unit };
}

function buildDetailedNumericSolution(q?: HydratedLikeQuestion): string {
  if (!q) return "";
  const prompt = String((q as any)?.prompt ?? "").trim();
  if (!prompt) return "";

  const promptClean = prompt.replace(/Â/g, "");
  const lower = promptClean.toLowerCase();
  const templateKind = String((q as any)?.template?.kind ?? "").trim();
  const rawAnswerValue = Number((q as any)?.answer?.value);
  const answerValue = Number.isFinite(rawAnswerValue) ? rawAnswerValue : NaN;
  const answerUnit = String((q as any)?.answer?.unit ?? (q as any)?.unit ?? "").trim();

  // Drehmoment / Umfangskraft
  if (templateKind === "torque_nm" || lower.includes("drehmoment") || lower.includes("umfangskraft")) {
    const force = matchValueWithOptionalUnit(promptClean, /F\s*=\s*([0-9]+(?:[.,][0-9]+)?)\s*N\b/i);
    const radius =
      matchValueWithOptionalUnit(promptClean, /r\s*=\s*([0-9]+(?:[.,][0-9]+)?)\s*(mm|m)\b/i) ??
      matchValueWithOptionalUnit(promptClean, /radius(?:\s+von)?\s*([0-9]+(?:[.,][0-9]+)?)\s*(mm|m)\b/i);
    const torque =
      matchValueWithOptionalUnit(
        promptClean,
        /(?:drehmoment(?:\s+von)?|M\s*=)\s*([0-9]+(?:[.,][0-9]+)?)\s*N\s*(?:\u00C2)?\s*(?:·|\u00b7|\*|x)?\s*m\b/i
      ) ??
      matchValueWithOptionalUnit(promptClean, /\b([0-9]+(?:[.,][0-9]+)?)\s*N\s*(?:\u00C2)?\s*(?:·|\u00b7|\*|x)\s*m\b/i);

    if (radius) {
      const rInput = radius.value;
      const rUnit = radius.unit === "mm" ? "mm" : "m";
      const rM = rUnit === "mm" ? rInput / 1000 : rInput;

      // Umfangskraft: F = M / r
      if (lower.includes("umfangskraft") && torque && rM > 0) {
        const calcF = torque.value / rM;
        const resultF = Number.isFinite(answerValue) ? answerValue : calcF;
        return [
          `### 1) Gegeben / Gesucht`,
          `- Gegeben: $M = ${formatGermanNumber(torque.value)}\\,\\mathrm{N\\cdot m}$`,
          `- Gegeben: $r = ${formatGermanNumber(rInput)}\\,\\mathrm{${rUnit}}${rUnit === "mm" ? ` = ${formatGermanNumber(rM)}\\,\\mathrm{m}` : ""}$`,
          `- Gesucht: $F\\,\\mathrm{in}\\,\\mathrm{N}$`,
          ``,
          `### 2) Formel`,
          `$$F = \\frac{M}{r}$$`,
          ``,
          `### 3) Einsetzen`,
          `$$F = \\frac{${formatGermanNumber(torque.value)}}{${formatGermanNumber(rM)}} = ${formatGermanNumber(calcF)}\\,\\mathrm{N}$$`,
          ``,
          buildResultMarkdown(resultF, answerUnit || "N"),
        ].join("\n");
      }

      // Drehmoment: M = F * r
      if (force) {
        const calcM = force.value * rM;
        const resultM = Number.isFinite(answerValue) ? answerValue : calcM;
        return [
          `### 1) Gegeben / Gesucht`,
          `- Gegeben: $F = ${formatGermanNumber(force.value)}\\,\\mathrm{N}$`,
          `- Gegeben: $r = ${formatGermanNumber(rInput)}\\,\\mathrm{${rUnit}}${rUnit === "mm" ? ` = ${formatGermanNumber(rM)}\\,\\mathrm{m}` : ""}$`,
          `- Gesucht: $M\\,\\mathrm{in}\\,\\mathrm{N\\cdot m}$`,
          ``,
          `### 2) Formel`,
          `$$M = F \\cdot r$$`,
          ``,
          `### 3) Einsetzen`,
          `$$M = ${formatGermanNumber(force.value)} \\cdot ${formatGermanNumber(rM)} = ${formatGermanNumber(calcM)}\\,\\mathrm{N\\cdot m}$$`,
          ``,
          buildResultMarkdown(resultM, answerUnit || "N·m"),
        ].join("\n");
      }
    }
  }

  // Mittige Einzelkraft -> gleiche Lagerkräfte
  if (lower.includes("mittig") && lower.includes("lagerkraft")) {
    const totalForce = matchValueWithOptionalUnit(promptClean, /([0-9]+(?:[.,][0-9]+)?)\s*N\b/i);
    if (totalForce) {
      const calc = totalForce.value / 2;
      const result = Number.isFinite(answerValue) ? answerValue : calc;
      return [
        `### 1) Gegeben / Gesucht`,
        `- Gegeben: Gesamtlast $F = ${formatGermanNumber(totalForce.value)}\\,\\mathrm{N}$ (mittig)`,
        `- Gesucht: Lagerkraft je Auflager`,
        ``,
        `### 2) Gleichgewichtsansatz`,
        `$$\\Sigma F = 0 \\Rightarrow R_A + R_B = F$$`,
        `$$\\text{bei mittiger Last: } R_A = R_B$$`,
        ``,
        `### 3) Einsetzen`,
        `$$2\\cdot R_B = ${formatGermanNumber(totalForce.value)} \\Rightarrow R_B = ${formatGermanNumber(totalForce.value)} / 2 = ${formatGermanNumber(calc)}\\,\\mathrm{N}$$`,
        ``,
        buildResultMarkdown(result, answerUnit || "N"),
      ].join("\n");
    }
  }

  // Lagerkraft RB bei Einzelkraft
  if (lower.includes("berechne rb")) {
    const force =
      matchValueWithOptionalUnit(promptClean, /kraft(?:\s+von)?\s*([0-9]+(?:[.,][0-9]+)?)\s*N\b/i) ??
      matchValueWithOptionalUnit(promptClean, /([0-9]+(?:[.,][0-9]+)?)\s*N\s*wirkt/i);
    const a = matchValueWithOptionalUnit(promptClean, /([0-9]+(?:[.,][0-9]+)?)\s*m\s+vom linken lager entfernt/i);
    const L = matchValueWithOptionalUnit(promptClean, /balkenl(?:ä|a)nge\s*([0-9]+(?:[.,][0-9]+)?)\s*m\b/i);
    if (force && a && L && L.value > 0) {
      const calc = (force.value * a.value) / L.value;
      const result = Number.isFinite(answerValue) ? answerValue : calc;
      return [
        `### 1) Gegeben / Gesucht`,
        `- Gegeben: $F = ${formatGermanNumber(force.value)}\\,\\mathrm{N}$`,
        `- Gegeben: $a = ${formatGermanNumber(a.value)}\\,\\mathrm{m}$ (Abstand vom linken Lager)`,
        `- Gegeben: $L = ${formatGermanNumber(L.value)}\\,\\mathrm{m}$`,
        `- Gesucht: $R_B\\,\\mathrm{in}\\,\\mathrm{N}$`,
        ``,
        `### 2) Formel (Momentengleichgewicht um A)`,
        `$$\\Sigma M_A = 0 \\Rightarrow R_B \\cdot L = F \\cdot a$$`,
        `$$R_B = \\frac{F \\cdot a}{L}$$`,
        ``,
        `### 3) Einsetzen`,
        `$$R_B = \\frac{${formatGermanNumber(force.value)} \\cdot ${formatGermanNumber(a.value)}}{${formatGermanNumber(L.value)}} = ${formatGermanNumber(calc)}\\,\\mathrm{N}$$`,
        ``,
        buildResultMarkdown(result, answerUnit || "N"),
      ].join("\n");
    }
  }

  // Gleichmäßig verteilte Last -> Resultierende
  if (lower.includes("verteilte last") && lower.includes("resultierende")) {
    const qLoad = matchValueWithOptionalUnit(promptClean, /q\s*=\s*([0-9]+(?:[.,][0-9]+)?)\s*N\s*\/\s*m\b/i);
    const length = matchValueWithOptionalUnit(promptClean, /wirkt auf\s*([0-9]+(?:[.,][0-9]+)?)\s*m\b/i);
    if (qLoad && length) {
      const calc = qLoad.value * length.value;
      const result = Number.isFinite(answerValue) ? answerValue : calc;
      return [
        `### 1) Gegeben / Gesucht`,
        `- Gegeben: $q = ${formatGermanNumber(qLoad.value)}\\,\\mathrm{N/m}$`,
        `- Gegeben: $l = ${formatGermanNumber(length.value)}\\,\\mathrm{m}$`,
        `- Gesucht: Resultierende Kraft $F_R\\,\\mathrm{in}\\,\\mathrm{N}$`,
        ``,
        `### 2) Formel`,
        `$$F_R = q \\cdot l$$`,
        ``,
        `### 3) Einsetzen`,
        `$$F_R = ${formatGermanNumber(qLoad.value)} \\cdot ${formatGermanNumber(length.value)} = ${formatGermanNumber(calc)}\\,\\mathrm{N}$$`,
        ``,
        buildResultMarkdown(result, answerUnit || "N"),
      ].join("\n");
    }
  }

  return "";
}

function getStructuredTextKeywords(
  keywordsByKey: Record<string, unknown>,
  key: string
): string[] {
  const raw = keywordsByKey?.[key];
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => String(v ?? "").trim()).filter(Boolean);
}

function parseNominalAndTolerance(promptText: string): { nominal: number; tolerance: number } | null {
  const m = String(promptText ?? "").match(/([0-9]+(?:[.,][0-9]+)?)\s*±\s*([0-9]+(?:[.,][0-9]+)?)/);
  if (!m) return null;
  const nominal = parseGermanNumber(m[1]);
  const tolerance = parseGermanNumber(m[2]);
  if (nominal == null || tolerance == null) return null;
  return { nominal, tolerance };
}

function buildStructuredFieldSample(args: {
  key: string;
  label: string;
  promptText: string;
  promptLower: string;
}): string {
  const keyLower = args.key.toLowerCase();
  const labelLower = args.label.toLowerCase();
  const promptText = args.promptText;
  const promptLower = args.promptLower;

  const isDecision = keyLower.includes("decision") || keyLower.includes("method") || labelLower.includes("vorgehen");
  const isReason = keyLower.includes("reason") || keyLower.includes("explanation") || labelLower.includes("begr");
  const isCheck =
    keyLower.includes("check") ||
    labelLower.includes("kontroll") ||
    labelLower.includes("pruef") ||
    labelLower.includes("pr\u00fcf");

  if (isReason && promptLower.includes("mittig") && promptLower.includes("lager")) {
    return [
      "Bei mittiger Einzelkraft ist das System symmetrisch.",
      "Aus dem statischen Gleichgewicht (Summe F = 0 und Summe M = 0) folgt,",
      "dass beide Lagerkr\u00e4fte gleich gro\u00df sind: RA = RB = F / 2.",
    ].join(" ");
  }

  if (isDecision && promptLower.includes("einseitig") && promptLower.includes("lager")) {
    return [
      "Ich zeichne zuerst eine Skizze mit Lasten und Abst\u00e4nden,",
      "w\u00e4hle dann einen Bezugspunkt und stelle das Momentengleichgewicht auf.",
      "Danach berechne ich die Lagerkraft und pr\u00fcfe mit Summe F = 0.",
    ].join(" ");
  }

  if (isDecision && promptLower.includes("grenzma") && promptLower.includes("messwert")) {
    const parsed = parseNominalAndTolerance(promptText);
    if (parsed) {
      const lower = parsed.nominal - parsed.tolerance;
      const upper = parsed.nominal + parsed.tolerance;
      return [
        `Ich lese zuerst das Nennma\u00df ${formatGermanNumber(parsed.nominal)} mm und die Toleranz \u00b1${formatGermanNumber(parsed.tolerance)} mm aus der Zeichnung.`,
        `Dann berechne ich die Grenzma\u00dfe: unteres Grenzma\u00df ${formatGermanNumber(lower)} mm und oberes Grenzma\u00df ${formatGermanNumber(upper)} mm.`,
        "Danach messe ich das Teil mit einem geeigneten Pr\u00fcfmittel und dokumentiere den Messwert.",
        "Anschlie\u00dfend vergleiche ich den Messwert mit beiden Grenzma\u00dfen.",
        "Liegt der Messwert innerhalb der Grenzen, ist das Ma\u00df i. O.; au\u00dferhalb der Grenzen ist es n. i. O.",
      ].join(" ");
    }

    return [
      "Ich lese zuerst Nennma\u00df und Toleranz aus der Zeichnung.",
      "Dann berechne ich oberes und unteres Grenzma\u00df.",
      "Danach ermittle ich den Messwert mit einem geeigneten Pr\u00fcfmittel.",
      "Anschlie\u00dfend vergleiche ich den Messwert mit beiden Grenzma\u00dfen und treffe die Entscheidung i. O. oder n. i. O.",
    ].join(" ");
  }

  if (isDecision) {
    return "Ich beschreibe die Schritte in sinnvoller Reihenfolge (Analyse, Ansatz, Rechnung, Kontrolle).";
  }

  if (isReason) {
    return "Ich begr\u00fcnde die Entscheidung fachlich mit Gleichgewicht, Funktion und Plausibilit\u00e4t.";
  }

  if (isCheck) {
    return "Ich nenne einen messbaren Kontrollpunkt mit Soll/Ist-Vergleich und passender Einheit.";
  }

  return "Formuliere die Antwort kurz, fachlich und nachvollziehbar in 2-4 S\u00e4tzen.";
}

function buildStructuredTextSolution(q?: HydratedLikeQuestion): string {
  if (!q) return "";
  const t = String((q as any)?.type ?? "").trim();
  if (t !== "structured_text") return "";

  const fieldsRaw = (q as any)?.answer?.fields;
  const fields = Array.isArray(fieldsRaw) ? fieldsRaw : [];
  if (!fields.length) return "";

  const modelRaw = (q as any)?.feedback?.modelStructure;
  const model =
    modelRaw && typeof modelRaw === "object" ? (modelRaw as Record<string, string>) : {};

  const helpStepsRaw = (q as any)?.help?.solutionSteps;
  const helpSteps = Array.isArray(helpStepsRaw)
    ? helpStepsRaw.map((v: unknown) => String(v ?? "").trim()).filter(Boolean)
    : [];

  const keywordsRaw = (q as any)?.answer?.keywords;
  const keywordsByKey =
    keywordsRaw && typeof keywordsRaw === "object"
      ? (keywordsRaw as Record<string, unknown>)
      : {};

  const promptText = String((q as any)?.prompt ?? "");
  const promptLower = promptText.toLowerCase();
  const lines: string[] = ["## Muster-L\u00f6sung (Beispiel)", ""];

  if (helpSteps.length > 0) {
    lines.push("### Vorgehen");
    helpSteps.forEach((step, idx) => {
      const clean = step.replace(/^\d+\)\s*/, "");
      lines.push(`${idx + 1}. ${clean}`);
    });
    lines.push("");
  }

  let renderedSections = 0;

  for (const f of fields as Array<{ key?: string; label?: string }>) {
    const key = String(f?.key ?? "").trim();
    if (!key) continue;

    const label = String(f?.label ?? key).trim() || key;
    const modelText = String(model?.[key] ?? "").trim();
    const fieldKeywords = getStructuredTextKeywords(keywordsByKey, key);
    const sample =
      modelText || buildStructuredFieldSample({ key, label, promptText, promptLower });

    lines.push(`### ${label}`);
    lines.push(`**Mustertext:** ${sample || "Keine Musterantwort verf\u00fcgbar."}`);
    if (fieldKeywords.length > 0) {
      lines.push("");
      lines.push(`**Key-Begriffe:** ${fieldKeywords.join(", ")}`);
    }
    lines.push("");
    renderedSections += 1;
  }

  if (renderedSections === 0 && helpSteps.length === 0) return "";
  return lines.join("\n").trim();
}

const summaryBadge3dClass = [
  "rounded-full border-primary/50 text-foreground",
  "bg-[linear-gradient(180deg,rgba(255,250,232,0.98)_0%,rgba(248,236,196,0.96)_58%,rgba(236,219,162,0.94)_100%)]",
  "dark:border-primary/35 dark:bg-[linear-gradient(180deg,rgba(90,70,26,0.82)_0%,rgba(66,51,20,0.92)_62%,rgba(44,33,12,0.96)_100%)]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(164,123,26,0.28),0_1px_2px_rgba(20,24,32,0.10),0_8px_12px_-10px_rgba(20,24,32,0.38)]",
  "dark:shadow-[inset_0_1px_0_rgba(255,236,190,0.28),inset_0_-1px_0_rgba(0,0,0,0.45),0_8px_14px_-12px_rgba(0,0,0,0.72)]",
].join(" ");

export default function PracticePanel(props: {
  qs: HydratedLikeQuestion[];
  index: number;
  current?: HydratedLikeQuestion;
  activeId: string | null;
  goTo: (i: number) => void;

  value: string;
  unit: string;
  onValueChange: (v: string) => void;
  onUnitChange: (u: string) => void;
  textFields: Record<string, string>;
  onTextFieldsChange: (next: Record<string, string>) => void;

  statusById: Record<string, "correct" | "attempted" | undefined>;
  checkedById: Record<string, boolean | undefined>;
  dirtyById: Record<string, boolean | undefined>;
  firstCorrectQualityById: Record<string, "clean" | "assisted" | undefined>;

  feedback: LearnFeedback;
  onCheckOne: () => void;
  onCheckAll: () => void;

  canUseExplain: boolean;

  showSolution: boolean;
  solutionUnlocked: boolean;
  onToggleSolution: () => void;

  tipsSeenById: Record<string, boolean | undefined>;
  revealTips: () => void;

  getInputSpec: (q?: HydratedLikeQuestion) => NormalizedInputSpec;

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Option 3 hooks (von LearnClient)
  isErrorMode?: boolean;
  wrongTotal?: number;
  errorRound?: number;
  canUseErrorMode?: boolean;
  onEnterErrorMode?: () => void;
  onExitErrorMode?: () => void;
  onRepeatRun?: () => void;
}) {
  // DnD (order tasks) ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Hooks mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ssen immer in gleicher Reihenfolge laufen (React Rules of Hooks)
  const dndSensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 10 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );
  const [dndActiveId, setDndActiveId] = useState<string | null>(null);

  const {
    qs,
    index,
    current,
    activeId,
    goTo,

    value,
    unit,
    onValueChange,
    onUnitChange,
    textFields,
    onTextFieldsChange,

    statusById,
    checkedById,
    dirtyById,
    firstCorrectQualityById,

    feedback,
    onCheckOne,
    onCheckAll,

    showSolution,
    solutionUnlocked,
    onToggleSolution,

    tipsSeenById,
    revealTips,

    getInputSpec,

    isErrorMode = false,
    wrongTotal = 0,
    errorRound = 0,
    canUseErrorMode = false,
    onEnterErrorMode,
    onExitErrorMode,
    onRepeatRun,

    canUseExplain,
  } = props;

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Anzahl Aufgaben "In Arbeit" (gelbe Punkte)
  const yellowCount = Object.values(statusById).filter((s) => s === "attempted").length;

  const ids = qs.map((q) => q.id);
  const inputSpec = getInputSpec(current);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Task-Typen: harte UI-Regel
  // Structured Text => NIE Ergebnis/Einheit rendern (auch wenn Content unit enthÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤lt)
  // Wichtig: Einige Calculation-Tasks haben ebenfalls answer.fields (work/value/unit). Deshalb NICHT nur auf fields prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼fen.
  const qType = (current as any)?.type as string | undefined;
  const rawFields =
    (current as any)?.answer?.fields ??
    (current as any)?.fields ??
    null;

  function detectStructuredText(): boolean {
    if (!current) return false;
    if (qType === "structured_text") return true;
    if (qType === "calculation") return false;

    // Fallback: wenn fields vorhanden sind, aber KEIN number/value Feld -> structured.
    if (Array.isArray(rawFields) && rawFields.length > 0) {
      const hasNumberKind = rawFields.some((f: any) => String(f?.kind ?? "").toLowerCase() === "number");
      const hasValueKey = rawFields.some((f: any) => String(f?.key ?? "").toLowerCase() === "value");
      // Calculation-Layout: work/value/unit oder number-kind -> numeric
      if (hasNumberKind || hasValueKey) return false;
      // reine Text-Struktur: decision/reason/check etc.
      return true;
    }

    return false;
  }

  const isStructuredText = detectStructuredText();

  const qTypeSafe = String((current as any)?.type ?? "").trim();

  const isSingleChoice = qTypeSafe === "single_choice";
  const isMultiSelect = qTypeSafe === "multi_select";
  const isOrder = qTypeSafe === "order";
  const isScenarioDecision = qTypeSafe === "scenario_decision";
  const isMatch = qTypeSafe === "match";

  const isChoiceLike = isSingleChoice || isScenarioDecision;
  const isNonNumericTask = isStructuredText || isChoiceLike || isMultiSelect || isOrder || isMatch;
  const isNumericTask = !isNonNumericTask;

  // For choice-like tasks, we store selection in textFields via key "choice"
  const choiceValue = String((textFields as any)?.choice ?? "");

  function safeParseJsonArray(raw: any): string[] {
    try {
      if (Array.isArray(raw)) return raw.map(String);
      const s = String(raw ?? "").trim();
      if (!s) return [];
      const v = JSON.parse(s);
      if (Array.isArray(v)) return v.map(String);
      return [];
    } catch {
      return [];
    }
  }

  const multiSelected = safeParseJsonArray((textFields as any)?.multi);
  const orderSelected = safeParseJsonArray((textFields as any)?.order);
  const matchSelectedPairs: Record<string, string> = (() => {
    try {
      const s = String((textFields as any)?.match ?? "").trim();
      if (!s) return {};
      const v = JSON.parse(s);
      if (v && typeof v === "object") return v as Record<string, string>;
      return {};
    } catch {
      return {};
    }
  })();

  const singleChoiceOptions: { id: string; text: string }[] = useMemo(() => {
    if (!current) return [];
    if (isScenarioDecision) {
      const opts = (current as any)?.options ?? [];
      return Array.isArray(opts)
        ? opts
            .map((o: any) => ({ id: String(o?.id ?? ""), text: String(o?.text ?? "") }))
            .filter((o: any) => o.id)
        : [];
    }
    if (isSingleChoice) {
      const ch = (current as any)?.answer?.choices ?? [];
      return Array.isArray(ch) ? ch.map((t: any, idx: number) => ({ id: String(idx), text: String(t) })) : [];
    }
    return [];
  }, [current?.id, isScenarioDecision, isSingleChoice]);

  const multiSelectOptions: { id: string; text: string }[] = useMemo(() => {
    if (!current || !isMultiSelect) return [];
    const ch = (current as any)?.answer?.choices ?? (current as any)?.choices ?? [];
    return Array.isArray(ch) ? ch.map((t: any, idx: number) => ({ id: String(idx), text: String(t) })) : [];
  }, [current?.id, isMultiSelect]);

  const orderItems: { id: string; text: string }[] = useMemo(() => {
    if (!current || !isOrder) return [];
    const items = (current as any)?.items ?? [];
    if (!Array.isArray(items)) return [];
    return items.map((t: any, idx: number) => {
      if (t && typeof t === "object") {
        const id = String((t as any).id ?? idx);
        const text = String((t as any).text ?? (t as any).label ?? "");
        return { id, text };
      }
      return { id: String(idx), text: String(t) };
    });
  }, [current?.id, isOrder]);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Einheit-Logik (nur relevant fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r Numeric)
  const expectedUnit = isNumericTask ? (current?.answer as any)?.unit ?? (current as any)?.unit ?? "" : "";
  const expectedUnitTrim = String(expectedUnit ?? "").trim();
  const hasExpectedUnit = isNumericTask && expectedUnitTrim.length > 0;

  const valueInputRef = useRef<HTMLInputElement | null>(null);
  const taskCardRef = useRef<HTMLDivElement | null>(null);
  const pendingTaskCardScrollRef = useRef<PendingTaskCardScroll | null>(null);
  const skipMobileAutoFocusOnceRef = useRef(false);
  const [mobileScrollTick, setMobileScrollTick] = useState(0);
  const [mobileResultInputActivated, setMobileResultInputActivated] = useState(false);
  const [resultFlash, setResultFlash] = useState<null | "ok" | "bad" | "assist">(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const lastSolveSignatureRef = useRef<string>("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const id = current?.id ?? null;
    if (!id) {
      prevActiveIdRef.current = null;
      lastSolveSignatureRef.current = "";
      setResultFlash(null);
      return;
    }

    const checked = Boolean(checkedById?.[id]);
    const status = statusById?.[id];
    const quality = firstCorrectQualityById?.[id];
    const kind = !checked
      ? "idle"
      : status === "correct" && quality === "assisted"
      ? "assisted"
      : status === "correct"
      ? "correct"
      : "wrong";
    const signature = `${id}:${kind}:${checked ? 1 : 0}`;

    // Beim Aufgabenwechsel keine Flash-Animation starten.
    if (prevActiveIdRef.current !== id) {
      prevActiveIdRef.current = id;
      lastSolveSignatureRef.current = signature;
      setResultFlash(null);
      return;
    }

    if (signature === lastSolveSignatureRef.current) return;
    lastSolveSignatureRef.current = signature;

    if (!checked) {
      setResultFlash(null);
      return;
    }

    const nextFlash =
      kind === "correct" ? "ok" : kind === "wrong" ? "bad" : kind === "assisted" ? "assist" : null;
    if (!nextFlash) return;

    setResultFlash(nextFlash);
    const timer = window.setTimeout(() => {
      setResultFlash((curr) => (curr === nextFlash ? null : curr));
    }, 550);

    return () => window.clearTimeout(timer);
  }, [current?.id, checkedById, statusById, firstCorrectQualityById]);

  // ---------------------------
  // Notes (persist per page) ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â stored per question.id
  // ---------------------------
  const notesKey = useMemo(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "unknown";
    return `lp_practice_notes_v1:${path}`;
  }, []);

  const [notesById, setNotesById] = useState<NotesById>(() => safeRead(notesKey, {}));

  useEffect(() => {
    safeWrite(notesKey, notesById);
  }, [notesKey, notesById]);

  const currentNotes = current?.id ? notesById[current.id] ?? "" : "";

  function setCurrentNotes(next: string) {
    if (!current?.id) return;
    setNotesById((prev) => ({ ...prev, [current.id]: next }));
  }

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Tipps mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ssen zum Aufgabentyp passen (nicht nur Keyword/Formel).
  // Structured-Text: eigener, klarer UI-Block (keine Markdown-Escape-Artefakte).
  const structuredTips = useMemo(() => {
    if (!current || !isStructuredText) return null;

    const fields = ((current as any)?.answer?.fields ?? (current as any)?.fields ?? []) as any[];
    const labels = Array.isArray(fields)
      ? fields
          .map((f) => String(f?.label ?? "").trim())
          .filter(Boolean)
      : [];

    const hasDecision = labels.some((l) => /entscheidung|vorgehen|kernaussage/i.test(l));
    const hasReason = labels.some((l) => /begründung|warum/i.test(l));
    const hasCheck = labels.some((l) => /kontroll|prüfung|absicherung|woran erkennst/i.test(l));

    const items: string[] = [];
    if (hasDecision) items.push('Sag klar **was** du tust (aktiver Satz: "Ich ..."/"Der Prüfling ...").');
    if (hasReason) items.push('Begründe kurz mit **Toleranz/Qualität/Funktion/Sicherheit**.');
    if (hasCheck) items.push('Nenne einen **messbaren Kontrollpunkt** (Soll/Ist + Prüfmittel + Toleranz).');
    if (items.length === 0) items.push('Formuliere prüfungsgerecht: **Was? Warum? Woran prüfst du?**');

    return {
      title: "Prüfungshinweis",
      items,
      template: [
        "Entscheidung: ...",
        "Begründung: ...",
        "Kontrollpunkt: ...",
      ],
    };
  }, [current?.id, isStructuredText]);

  const rightPanel = useMemo(() => {
    if (!current) return null;
    if (isStructuredText) return null; // Structured nutzt structuredTips
    return rightPanelFromPrompt(current?.prompt);
  }, [current?.id, current?.prompt, isStructuredText]);
  const tipsRevealed = current?.id ? Boolean(tipsSeenById?.[current.id]) : false;
  const hasTips = Boolean(rightPanel || structuredTips);
  const [mobileTipsOpenForId, setMobileTipsOpenForId] = useState<string | null>(null);
  const mobileTipsOpen = Boolean(current?.id && mobileTipsOpenForId === current.id);
  const [mobileNotesOpenForId, setMobileNotesOpenForId] = useState<string | null>(null);
  const mobileNotesOpen = Boolean(current?.id && mobileNotesOpenForId === current.id);

  function toggleMobileTips() {
    if (!current?.id) return;
    const willOpen = mobileTipsOpenForId !== current.id;
    if (willOpen && hasTips && !tipsRevealed) {
      revealTips();
    }
    setMobileTipsOpenForId(willOpen ? current.id : null);
  }

  function toggleMobileNotes() {
    if (!current?.id) return;
    const willOpen = mobileNotesOpenForId !== current.id;
    setMobileNotesOpenForId(willOpen ? current.id : null);
  }

  // ---------------------------
  // Abschluss-Logik (Option A: Abschlussblock nur wenn ALLE geprÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼ft)
  // ---------------------------
  const checkedCount = useMemo(() => ids.filter((id) => Boolean(checkedById?.[id])).length, [ids, checkedById]);
  const correctCount = useMemo(() => ids.filter((id) => statusById?.[id] === "correct").length, [ids, statusById]);
  const wrongCount = useMemo(
    () =>
      ids.filter((id) => {
        if (!checkedById?.[id]) return false;
        return statusById?.[id] !== "correct";
      }).length,
    [ids, checkedById, statusById]
  );
  const assistedCorrectCount = useMemo(
    () => ids.filter((id) => firstCorrectQualityById?.[id] === "assisted").length,
    [ids, firstCorrectQualityById]
  );
  const cleanCorrectCount = useMemo(
    () => ids.filter((id) => firstCorrectQualityById?.[id] === "clean").length,
    [ids, firstCorrectQualityById]
  );
  const inWorkCount = useMemo(
    () => ids.filter((id) => statusById?.[id] === "attempted" && !checkedById?.[id]).length,
    [ids, statusById, checkedById]
  );

  const isRunCheckedComplete = ids.length > 0 && checkedCount === ids.length;
  const isAllCorrect = isRunCheckedComplete && wrongCount === 0 && correctCount === ids.length;
  const isPerfectClean = isAllCorrect && assistedCorrectCount === 0 && cleanCorrectCount === ids.length;

  const errorRatePct = useMemo(() => {
    if (checkedCount <= 0) return null;
    const pct = (wrongCount / checkedCount) * 100;
    return Math.round(pct);
  }, [checkedCount, wrongCount]);

  const currentSolveState = useMemo(() => {
    if (!current?.id) return { kind: "idle" as const, label: "In Arbeit" };

    const id = current.id;
    const checked = Boolean(checkedById?.[id]);
    const status = statusById?.[id];
    const quality = firstCorrectQualityById?.[id];

    if (status === "correct" && quality === "assisted") {
      return { kind: "assisted" as const, label: "Mit Hilfe" };
    }
    if (status === "correct") {
      return { kind: "correct" as const, label: "Richtig" };
    }
    if (checked) {
      return { kind: "wrong" as const, label: "Falsch" };
    }
    return { kind: "idle" as const, label: "In Arbeit" };
  }, [current?.id, checkedById, statusById, firstCorrectQualityById]);

  const solveStateBadgeClass =
    currentSolveState.kind === "correct"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-950/70 dark:text-emerald-100"
      : currentSolveState.kind === "wrong"
      ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/70 dark:bg-rose-950/70 dark:text-rose-100"
      : currentSolveState.kind === "assisted"
      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/70 dark:bg-amber-950/70 dark:text-amber-100"
      : "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/65 dark:bg-sky-950/65 dark:text-sky-100";

  const solveFlashClass =
    resultFlash === "ok"
      ? "ring-2 ring-emerald-400/35 border-emerald-400/85 bg-emerald-500/12 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.2),0_12px_26px_-20px_rgba(16,185,129,0.55)]"
      : resultFlash === "bad"
      ? "ring-2 ring-rose-400/35 border-rose-400/85 bg-rose-500/12 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.2),0_12px_26px_-20px_rgba(244,63,94,0.55)]"
      : resultFlash === "assist"
      ? "ring-2 ring-amber-400/35 border-amber-400/85 bg-amber-500/12 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_12px_26px_-20px_rgba(245,158,11,0.55)]"
      : "";

  const checkButtonFlashClass =
    resultFlash === "ok"
      ? "ring-2 ring-emerald-400/45 bg-emerald-500/90 text-white"
      : resultFlash === "bad"
      ? "ring-2 ring-rose-400/45 bg-rose-500/90 text-white"
      : resultFlash === "assist"
      ? "ring-2 ring-amber-400/45 bg-amber-500/90 text-black"
      : "";

  // ---------------------------
  // Option A: Soft-Gate fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r "LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶sung anzeigen"
  // ---------------------------
  const [solutionGateOpen, setSolutionGateOpen] = useState(false);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Abgeleitete LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶sung (fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼r non-numeric Tasks, wenn kein solution-Text vorhanden ist)
  const derivedSolution = useMemo(() => {
    if (!current) return "";
    const t = String((current as any)?.type ?? "").trim();

    // Numeric tasks: prefer a derived step-by-step solution, fallback to final value.
    if (isNumericTask) {
      const detailed = buildDetailedNumericSolution(current);
      if (detailed) return detailed;

      const rawValue = (current as any)?.answer?.value;
      const valueText = String(rawValue ?? "").trim();
      if (!valueText) return "";

      const unitText = String((current as any)?.answer?.unit ?? (current as any)?.unit ?? "").trim();
      return unitText ? `**Ergebnis:** ${valueText} ${unitText}` : `**Ergebnis:** ${valueText}`;
    }


    // Structured Text: prefer explicit solution, otherwise generate a deterministic sample solution.
    if (t === "structured_text") return buildStructuredTextSolution(current);

    // Single choice / Scenario decision
    if (t === "single_choice" || t === "scenario_decision") {
      const correctIndex = (current as any)?.answer?.correctIndex;
      const correctOptionId =
        (current as any)?.answer?.correctOptionId ??
        (current as any)?.answer?.correctId ??
        (current as any)?.correctOptionId ??
        (current as any)?.correctId;

      if (t === "scenario_decision" && correctOptionId != null) {
        const opts = (current as any)?.options ?? [];
        const hit = Array.isArray(opts) ? opts.find((o: any) => String(o?.id) === String(correctOptionId)) : null;
        const label = hit ? String(hit.text ?? hit.label ?? hit.id) : "";
        return label ? `**Richtige Option:** ${label}` : "";
      }

      if (typeof correctIndex === "number") {
        const choices = (current as any)?.answer?.choices ?? [];
        const label = Array.isArray(choices) ? String(choices[correctIndex] ?? "") : "";
        return label ? `**Richtige Option:** ${label}` : "";
      }

      return "";
    }

    // Multi select
    if (t === "multi_select") {
      const correct = (current as any)?.answer?.correctIndices ?? (current as any)?.answer?.correct ?? [];
      const choices = (current as any)?.answer?.choices ?? (current as any)?.choices ?? [];
      const idxs = Array.isArray(correct) ? correct : [];
      const labels = idxs
        .map((i: any) => {
          const n = typeof i === "number" ? i : Number(i);
          return Number.isFinite(n) && Array.isArray(choices) ? String(choices[n] ?? "") : "";
        })
        .filter(Boolean);

      return labels.length ? `**Richtige Antworten:**\n- ${labels.join("\n- ")}` : "";
    }

    // Order
    if (t === "order") {
      const correctOrder =
        (current as any)?.answer?.correctOrderIds ??
        (current as any)?.answer?.correctOrder ??
        (current as any)?.correctOrder ??
        [];
      const items = (current as any)?.items ?? [];
      const ids = Array.isArray(correctOrder) ? correctOrder.map(String) : [];
      const itemsArr = Array.isArray(items) ? items : [];
      const itemsAreObjects = itemsArr.some((it: any) => it && typeof it === "object" && "id" in it);

      const labels = ids
        .map((id: string) => {
          if (itemsAreObjects) {
            const hit = itemsArr.find((x: any) => String(x?.id) === String(id));
            return hit ? String(hit.text ?? hit.label ?? "") : "";
          }

          // fallback: index-based items
          const n = Number(id);
          if (Number.isFinite(n) && Array.isArray(items)) {
            const it = items[n];
            return String(it ?? "");
          }
          return "";
        })
        .filter(Boolean);

      return labels.length ? `**Richtige Reihenfolge:**\n1. ${labels.join("\n1. ")}` : "";
    }

    // Match
    if (t === "match") {
      const pairs = (current as any)?.answer?.pairs ?? (current as any)?.answer?.correctPairs ?? null;
      const left = (current as any)?.left ?? (current as any)?.pairsLeft ?? [];
      const right = (current as any)?.right ?? (current as any)?.pairsRight ?? [];

      // pairs may be object {leftId:rightId} or array [{left,right}]
      const lines: string[] = [];

      if (pairs && typeof pairs === "object" && !Array.isArray(pairs)) {
        for (const [l, r] of Object.entries(pairs)) {
          const lHit = Array.isArray(left) ? left.find((x: any) => String(x?.id ?? x) === String(l)) : null;
          const rHit = Array.isArray(right) ? right.find((x: any) => String(x?.id ?? x) === String(r)) : null;
          const lTxt = lHit ? String((lHit as any).text ?? lHit) : String(l);
          const rTxt = rHit ? String((rHit as any).text ?? rHit) : String(r);
          lines.push(`- ${lTxt} -> ${rTxt}`);
        }
      } else if (Array.isArray(pairs)) {
        for (const p of pairs) {
          const l = String((p as any)?.left ?? (p as any)?.a ?? "");
          const r = String((p as any)?.right ?? (p as any)?.b ?? "");
          if (l && r) lines.push(`- ${l} -> ${r}`);
        }
      }

      return lines.length ? `**Richtige Zuordnung:**\n${lines.join("\n")}` : "";
    }

    return "";
  }, [current?.id, isNumericTask]);

  const hasAnySolution = Boolean(current?.solution) || derivedSolution.trim().length > 0;


  const canToggleSolution = Boolean(hasAnySolution);

  const solutionButtonLabel = showSolution ? "Lösung ausblenden" : "Lösung ansehen";

  const solutionButtonTitle = !hasAnySolution
    ? "Keine Lösung hinterlegt"
    : showSolution
    ? "Bereits korrekt gelöste Aufgaben bleiben grün"
    : !tipsRevealed && hasTips
    ? "Empfohlen: erst Tipps öffnen. Mit Hilfe zählt nur, wenn die Aufgabe noch nicht korrekt gelöst ist."
    : "Mit Hilfe zählt nur, wenn die Aufgabe noch nicht korrekt gelöst ist.";

  function onClickSolution() {
    if (!hasAnySolution) return;

    if (showSolution) {
      onToggleSolution();
      return;
    }

    if (!tipsRevealed && hasTips) {
      setSolutionGateOpen(true);
      return;
    }

    onToggleSolution();
  }

  function isMobileViewport() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function focusValueInput(opts?: { preventScroll?: boolean; select?: boolean }) {
    const el = valueInputRef.current;
    if (!el) return;

    const preventScroll = Boolean(opts?.preventScroll);
    try {
      if (preventScroll) {
        el.focus({ preventScroll: true });
      } else {
        el.focus();
      }
    } catch {
      el.focus();
    }

    if (opts?.select) {
      try {
        el.select();
      } catch {
        // ignore
      }
    }
  }

  function refocusResultInputIfNeeded() {
    if (!isNumericTask) return;
    if (!mobileResultInputActivated) return;
    if (!isMobileViewport()) return;

    const focusInput = () => {
      if (document.activeElement === valueInputRef.current) return;
      focusValueInput({ preventScroll: true });
    };

    // Sofort nach Action + kurzer Fallback nach mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶glichem Re-Render
    window.setTimeout(focusInput, 0);
    window.setTimeout(focusInput, 80);
  }

  function handleGoToFromNav(next: number) {
    if (next === index) return;
    pendingTaskCardScrollRef.current = { mode: "align-top" };
    skipMobileAutoFocusOnceRef.current = true;
    goTo(next);
  }

  function keepMobileInputFocusOnActionMouseDown(e: React.MouseEvent<HTMLButtonElement>) {
    if (!isMobileViewport()) return;
    if (!isNumericTask) return;
    if (!mobileResultInputActivated) return;
    e.preventDefault();
  }

  function keepMobileInputFocusOnActionPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobileViewport()) return;
    if (!isNumericTask) return;
    if (!mobileResultInputActivated) return;
    e.preventDefault();
  }

  function queueMobileAlignTaskTop(opts?: { forceRun?: boolean; skipAutoFocusOnce?: boolean }) {
    if (!isMobileViewport()) return false;
    if (!taskCardRef.current) return false;

    pendingTaskCardScrollRef.current = {
      mode: "align-top",
    };
    skipMobileAutoFocusOnceRef.current = opts?.skipAutoFocusOnce ?? true;
    if (opts?.forceRun) {
      setMobileScrollTick((v) => v + 1);
    }
    return true;
  }

  function handleGoTo(next: number, opts?: { alignTaskCard?: boolean }) {
    const isMobile = isMobileViewport();
    if (isMobile && next !== index) {
      if (opts?.alignTaskCard) {
        queueMobileAlignTaskTop({ skipAutoFocusOnce: true });
      }
    }
    goTo(next);
    if (!(isMobile && opts?.alignTaskCard)) {
      refocusResultInputIfNeeded();
    }
  }

  function handleCheckOne() {
    const isMobile = isMobileViewport();
    const keptAtTop = isMobile
      ? queueMobileAlignTaskTop({ forceRun: true, skipAutoFocusOnce: false })
      : isNumericTask && mobileResultInputActivated
      ? queueMobileAlignTaskTop({ forceRun: true })
      : false;
    onCheckOne();
    if (!keptAtTop && !isMobile) {
      refocusResultInputIfNeeded();
    }
  }

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Auto-Fokus: nur bei Numeric-Tasks (sonst kein Keyboard/kein Leerlauf)
  useEffect(() => {
    if (!current) return;
    if (!isNumericTask) return;
    if (isMobileViewport() && !mobileResultInputActivated) {
      return;
    }
    if (isMobileViewport() && skipMobileAutoFocusOnceRef.current) {
      skipMobileAutoFocusOnceRef.current = false;
      return;
    }

    const isMobile = isMobileViewport();
    const t = window.setTimeout(() => {
      if (document.activeElement === valueInputRef.current) return;
      focusValueInput({ preventScroll: isMobile, select: !isMobile });
    }, 0);

    return () => window.clearTimeout(t);
  }, [current?.id, isNumericTask, mobileResultInputActivated]);

  useEffect(() => {
    const pending = pendingTaskCardScrollRef.current;
    if (!pending) return;
    pendingTaskCardScrollRef.current = null;
    if (!isMobileViewport()) return;

    if (!taskCardRef.current) return;

    const alignTaskCardTop = () => {
      const el = taskCardRef.current;
      if (!el) return;

      // Mobile: Aufgabenkarte unter Header mit zusÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤tzlichem Abstand landen lassen.
      const header = document.querySelector<HTMLElement>("[data-scroll-header]");
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const targetViewportTop = Math.max(0, Math.round(headerBottom + MOBILE_TASK_CARD_TOP_GAP_PX));

      const root = getScrollRoot();
      if (root) {
        const rr = root.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        const targetTopInRoot = Math.max(0, targetViewportTop - rr.top);
        const top = root.scrollTop + (er.top - rr.top) - targetTopInRoot;
        root.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "auto" });
        return;
      }

      const er = el.getBoundingClientRect();
      const top = window.scrollY + er.top - targetViewportTop;
      window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "auto" });
    };

    const run = () => alignTaskCardTop();

    const timers: number[] = [];
    timers.push(window.setTimeout(run, 0));
    timers.push(window.setTimeout(run, 160));
    timers.push(window.setTimeout(run, 320));
    timers.push(window.setTimeout(run, 520));

    return () => {
      for (const t of timers) {
        window.clearTimeout(t);
      }
    };
  }, [current?.id, mobileScrollTick]);

  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Keyboard: ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“/ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ wechseln; Enter = Next; Shift+Enter = PrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼fen; Home/End
  // Fehler-Modus lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤uft via gefilterte qs (LearnClient)
  useEffect(() => {
    function clampGo(next: number) {
      if (!qs.length) return;
      const clamped = Math.max(0, Math.min(qs.length - 1, next));
      if (clamped !== index) goTo(clamped);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!qs.length) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toUpperCase();
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || (target as any)?.isContentEditable;

      const allowNavInInput = e.ctrlKey || e.altKey || e.metaKey;

      if (e.key === "Enter") {
        if (tag === "TEXTAREA") return;

        e.preventDefault();
        if (e.shiftKey) {
          onCheckOne();
        } else {
          clampGo(index + 1);
        }
        return;
      }

      if (inInput && !allowNavInInput) return;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp": {
          e.preventDefault();
          clampGo(index - 1);
          return;
        }
        case "ArrowRight":
        case "ArrowDown": {
          e.preventDefault();
          clampGo(index + 1);
          return;
        }
        case "Home": {
          e.preventDefault();
          clampGo(0);
          return;
        }
        case "End": {
          e.preventDefault();
          clampGo(qs.length - 1);
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [qs.length, index, goTo, onCheckOne]);

  // ---------------------------
  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ "ErklÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤r mir das" (lokal, spoilerfrei)
  // ---------------------------
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainVm, setExplainVm] = useState<ExplainResult | null>(null);

  // Reset, wenn Frage wechselt
  useEffect(() => {
    setExplainOpen(false);
    setExplainVm(null);
  }, [current?.id]);

  function onExplain() {
    if (!current?.id) return;

    // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ ErklÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤rung nutzt Tipp-Status. Bereits korrekt (grÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼n) bleibt dabei unverÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ndert.
    if (!tipsSeenById?.[current.id]) {
      revealTips();
    }

    const wasChecked = Boolean(checkedById?.[current.id]);
    const isCorrect = statusById?.[current.id] === "correct";

    const userInputParts = [
      isStructuredText
        ? Object.entries(textFields ?? {})
            .map(([k, v]) => (String(v ?? "").trim() ? `${k}: ${String(v).trim()}` : ""))
            .filter(Boolean)
            .join("\n")
        : value?.trim()
        ? `Ergebnis: ${value.trim()}`
        : "",

      !isStructuredText && unit?.trim() ? `Einheit: ${unit.trim()}` : "",
      currentNotes?.trim() ? `Notizen: ${currentNotes.trim()}` : "",
    ].filter(Boolean);

    const res = explainLocally({
      questionId: current.id,
      questionText: current.prompt ?? "",
      questionType: String((current as any)?.type ?? "").trim(),
      topic: (current as any)?.meta?.topic,
      userInput: userInputParts.join("\n"),
      status: wasChecked ? "checked" : userInputParts.length > 0 ? "attempted" : "unanswered",
      checkedCorrect: wasChecked ? isCorrect : undefined,
      tipsSeen: true,
    });

    setExplainVm(res);
    setExplainOpen(true);
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-transparent lp-card-panel-weak max-md:gap-3">
      <CardHeader className="space-y-2 pb-3">
        <CardTitle>
          {/* Mobile layout: Text oben, darunter Übung + Aufgabe nebeneinander */}
          <div className="md:hidden space-y-1">
            <div className="text-xs text-muted-foreground leading-snug text-center">
              <div className="font-semibold text-foreground/75">Eigenständiges Rechnen ist prüfungsentscheidend.</div>
              <div className="text-muted-foreground">In der Prüfung zählt, was du selbst rechnen kannst.</div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">Übung</span>
              <div className="flex items-center gap-2">
                {qs.length ? (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    Aufgabe {index + 1}/{qs.length}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="rounded-full text-xs">
                    Keine Aufgaben
                  </Badge>
                )}
                {isErrorMode && onExitErrorMode ? (
                  <Button type="button" variant="outline" className="h-7 rounded-full px-3 text-xs" onClick={onExitErrorMode}>
                    Alle Aufgaben
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <span className="shrink-0">Übung</span>

            <div className="text-center text-sm text-muted-foreground leading-relaxed">
              <div className="font-semibold text-foreground/75">Eigenständiges Rechnen ist prüfungsentscheidend.</div>
              <div className="text-muted-foreground">In der Prüfung zählt, was du selbst rechnen kannst.</div>
            </div>

            <div className="justify-self-end flex items-center gap-2">
              {qs.length ? (
                <Badge variant="secondary" className="rounded-full">
                  Aufgabe {index + 1}/{qs.length}
                </Badge>
              ) : (
                <Badge variant="destructive" className="rounded-full">
                  Keine Aufgaben
                </Badge>
              )}
              {isErrorMode && onExitErrorMode ? (
                <Button type="button" variant="outline" className="rounded-full" onClick={onExitErrorMode}>
                  Alle Aufgaben
                </Button>
              ) : null}
            </div>
          </div>
        </CardTitle>

        <Separator />

        {/* Links Notizen | Mitte Nav | Rechts Tipps (geblurrt bis Klick) */}
        {qs.length ? (
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch">
            {/* LINKS: Notizen */}
            <Card className="rounded-2xl border-border/60 bg-transparent lp-card-grad-subtle h-full flex flex-col shadow-[0_18px_46px_-36px_rgba(20,24,32,0.26)]">
              <CardHeader className="py-0">
                <CardTitle className="hidden md:block text-sm text-muted-foreground">Rechenweg / Notizen</CardTitle>
                <button
                  type="button"
                  className="md:hidden -mx-1 flex items-center justify-between gap-2 rounded-xl px-1 py-1 text-left"
                  onClick={toggleMobileNotes}
                  aria-expanded={mobileNotesOpen}
                  aria-label={mobileNotesOpen ? "Notizen einklappen" : "Notizen ausklappen"}
                >
                  <span className="text-sm font-semibold text-muted-foreground">Notizen anzeigen...</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {mobileNotesOpen ? "Einklappen" : "Ausklappen"}
                    <ChevronDown className={["h-4 w-4 transition-transform", mobileNotesOpen ? "rotate-180" : ""].join(" ")} />
                  </span>
                </button>
              </CardHeader>
              <CardContent className={["pt-0 flex-1 flex-col", mobileNotesOpen ? "flex" : "hidden md:flex"].join(" ")}>
                <Textarea
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Notiere hier deinen Rechenweg, Umformungen oder Einheiten..."
                  className="min-h-[140px] md:min-h-[140px] resize-none py-2 leading-tight flex-1"
                />
                <p className="mt-2 text-xs text-muted-foreground">(Wird pro Aufgabe gespeichert.)</p>
              </CardContent>
            </Card>

            {/* MITTE: Navigation */}
            <div className="flex justify-center">
              <QuestionNav
                ids={ids}
                activeIndex={index}
                onGoTo={handleGoToFromNav}
                statusById={statusById}
                checkedById={checkedById}
                firstCorrectQualityById={firstCorrectQualityById}
              />
            </div>

            {/* RECHTS: Tipps */}
            <Card className="rounded-2xl border-border/60 bg-transparent lp-card-grad-subtle h-full flex flex-col shadow-[0_18px_46px_-36px_rgba(20,24,32,0.26)]">
              <CardHeader className="py-0">
                <CardTitle className="hidden md:block text-sm text-muted-foreground">Tipps</CardTitle>
                {hasTips ? (
                  <button
                    type="button"
                    className="md:hidden -mx-1 flex items-center justify-between gap-2 rounded-xl px-1 py-1 text-left"
                    onClick={toggleMobileTips}
                    aria-expanded={mobileTipsOpen}
                    aria-label={mobileTipsOpen ? "Tipps einklappen" : "Tipps ausklappen"}
                  >
                    <span className="text-sm font-semibold text-muted-foreground">Tipps anzeigen...</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {mobileTipsOpen ? "Einklappen" : "Ausklappen"}
                      <ChevronDown className={["h-4 w-4 transition-transform", mobileTipsOpen ? "rotate-180" : ""].join(" ")} />
                    </span>
                  </button>
                ) : (
                  <div className="md:hidden -mx-1 flex items-center justify-between gap-2 rounded-xl px-1 py-1 text-left">
                    <span className="text-sm font-semibold text-muted-foreground">Keine Tipps</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className={["pt-0 relative min-h-[140px] flex-1", hasTips ? (mobileTipsOpen ? "flex" : "hidden md:flex") : "hidden md:flex"].join(" ")}>
                {structuredTips ? (
                  <>
                    <div className={["w-full", tipsRevealed ? "" : "blur-md brightness-75 select-none pointer-events-none transition"].join(" ")}>
                      <div className="space-y-4">
                        <div className="text-sm font-semibold text-foreground/90">{structuredTips.title}</div>

                        <div className="space-y-2 text-sm text-foreground/85">
                          <div className="text-xs font-semibold tracking-wide text-muted-foreground">SO BEKOMMST DU PUNKTE</div>
                          <ul className="list-disc pl-5 space-y-1">
                            {structuredTips.items.map((it, idx) => (
                              <li key={idx}>
                                <span
                                  className="text-foreground/85"
                                  dangerouslySetInnerHTML={{ __html: it.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-transparent p-3 lp-card-grad-subtle">
                          <div className="text-xs font-semibold tracking-wide text-muted-foreground">MINI-TEMPLATE</div>
                          <div className="mt-2 space-y-1 font-mono text-xs text-foreground/85">
                            {structuredTips.template.map((l, idx) => (
                              <div key={idx}>{l}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!tipsRevealed ? (
                      <div className="absolute inset-0 hidden md:flex items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-full"
                          onClick={revealTips}
                          title="Tipps anzeigen (Mit Hilfe nur, wenn noch nicht korrekt gelöst)"
                        >
                          Tipps anzeigen
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : rightPanel ? (
                  <>
                    <div className={["w-full", tipsRevealed ? "" : "blur-md brightness-75 select-none pointer-events-none transition"].join(" ")}>
                      <Markdown source={rightPanel.bodyMd} />
                    </div>

                    {!tipsRevealed ? (
                      <div className="absolute inset-0 hidden md:flex items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-full"
                          onClick={revealTips}
                          title="Tipps anzeigen (Mit Hilfe nur, wenn noch nicht korrekt gelöst)"
                        >
                          Tipps anzeigen
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Keine Tipps verfügbar.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {current ? (
          <div
            ref={taskCardRef}
            className="mt-3 rounded-2xl border border-border/60 bg-transparent p-4 lp-card-grad shadow-[0_22px_56px_-42px_rgba(20,24,32,0.28)] transition-[border-color,box-shadow] duration-300"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold tracking-wide text-muted-foreground">AUFGABE</div>
                {isStructuredText ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-foreground/75">
                    Textantwort
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-foreground/80">
                  {index + 1}/{qs.length}
                </span>
                {/* "Ziel:" nur bei Numeric-Tasks + wenn Einheit vorgegeben */}
                {isNumericTask && hasExpectedUnit ? (
                  <div className="text-xs text-muted-foreground">
                    Ziel: <span className="text-foreground/80">{expectedUnitTrim}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-1 rounded-full bg-white/10" />
              <div className="min-w-0 space-y-2">
                {/* Kontext/Gegebenes anzeigen (falls vorhanden). Das loest "ohne Kontext antworten". */}
                {(() => {
                  const ctx =
                    (current as any)?.context?.text ??
                    (current as any)?.contextText ??
                    (current as any)?.given ??
                    (current as any)?.context ??
                    "";
                  const txt = String(ctx ?? "").trim();
                  if (!txt) return null;
                  return (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] font-semibold tracking-wide text-muted-foreground">
                        {String((current as any)?.given ?? "").trim() ? "GEGEBEN" : "KONTEXT"}
                      </div>
                      <div className="mt-1 text-sm leading-relaxed text-foreground/85">{txt}</div>
                    </div>
                  );
                })()}

                <div className="text-base leading-relaxed text-foreground/95">{current.prompt}</div>
              </div>
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {current ? (
          <>
            {isRunCheckedComplete ? (
              <Card className="rounded-2xl border-primary/25 bg-primary/10">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between gap-3">
                    <span>Abschluss</span>
                    <span className="text-sm text-muted-foreground">{isAllCorrect ? "Alles korrekt" : "Durchgang beendet"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                    {!isErrorMode && isAllCorrect ? (
                      <Badge variant="secondary" className="rounded-full">
                        {isPerfectClean ? "Eigenständig geschafft" : "Geschafft"}
                      </Badge>
                    ) : isErrorMode ? (
                      <Badge variant="secondary" className="rounded-full">
                        Fehler-Modus Runde {Math.max(1, errorRound)}
                      </Badge>
                    ) : null}

                    <Badge variant="outline" className={summaryBadge3dClass}>
                      Gepr\u00fcft: {checkedCount}/{ids.length}
                    </Badge>
                    <Badge variant="outline" className={summaryBadge3dClass}>
                      In Arbeit: <span suppressHydrationWarning>{mounted ? inWorkCount : 0}</span>
                    </Badge>
                    <Badge variant="outline" className={summaryBadge3dClass}>
                      Richtig: {cleanCorrectCount}/{ids.length}
                    </Badge>
                    <Badge variant="outline" className={summaryBadge3dClass}>
                      Mit Hilfe: {assistedCorrectCount}
                    </Badge>
                    <Badge variant="outline" className={summaryBadge3dClass}>
                      Falsch: {wrongCount}
                    </Badge>
                    <Badge variant="outline" className={summaryBadge3dClass}>
                      Fehlerquote: {errorRatePct ?? 0}%
                    </Badge>
                  </div>

                  {/* Option 3: Einstieg unten (Abschluss) */}
                  <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                    {!isErrorMode ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-center rounded-full gap-2 md:w-auto"
                        onClick={onEnterErrorMode}
                        disabled={wrongTotal <= 0 || !canUseErrorMode}
                        title={
                          !canUseErrorMode
                            ? "Nur in Pro verfügbar"
                            : wrongTotal > 0
                            ? "Nur die geprüften Fehler üben"
                            : "Keine Fehler vorhanden"
                        }
                      >
                        Fehler üben
                        {!canUseErrorMode ? (
                          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                            PRO
                          </span>
                        ) : null}
                      </Button>
                    ) : (
                      <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-center rounded-full md:w-auto"
                          onClick={onEnterErrorMode}
                          disabled={wrongTotal <= 0 || !canUseErrorMode || !onEnterErrorMode}
                          title={wrongTotal > 0 ? "Nächste Fehler-Runde starten" : "Keine Fehler mehr vorhanden"}
                        >
                          (Lupe) Fehler üben ({Math.max(2, errorRound + 1)})
                        </Button>
                        {onExitErrorMode ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center rounded-full md:w-auto"
                            onClick={onExitErrorMode}
                            title="Zurück zu allen Aufgaben"
                          >
                            Alle Aufgaben
                          </Button>
                        ) : null}
                      </div>
                    )}

                    <div
                      className={[
                        "grid w-full gap-2 md:ml-auto md:flex md:w-auto md:flex-wrap md:items-center",
                        onRepeatRun ? "grid-cols-2" : "grid-cols-1",
                      ].join(" ")}
                    >
                      <Button asChild className="w-full justify-center rounded-full md:w-auto">
                        <Link href="/module">Nächstes Modul</Link>
                      </Button>
                      {onRepeatRun ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-center rounded-full md:w-auto"
                          onClick={onRepeatRun}
                        >
                          Wiederholen
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Hinweis: Aktuell wird lokal gespeichert. Mit Backend (später) kann dieser Abschluss dauerhaft in deinem Konto hinterlegt werden.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {/* Eingaben: je nach Fragetyp */}
            {isStructuredText ? (
              <div className="space-y-2">
                <TextAnswerField
                  fields={((current as any)?.answer?.fields ?? (current as any)?.fields ?? [])}
                  value={textFields ?? {}}
                  onChange={onTextFieldsChange}
                  showWordCount
                />
              </div>
            ) : isChoiceLike ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Antwort</label>
                <div className="space-y-2">
                  {singleChoiceOptions.map((opt) => {
                    const selected = choiceValue === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onTextFieldsChange({ ...(textFields ?? {}), choice: opt.id })}
                        className={[
                          "w-full text-left rounded-xl border px-3 py-3 transition",
                          selected
                            ? "border-amber-500/60 bg-amber-100 shadow-sm dark:border-amber-400/60 dark:bg-amber-500/10"
                            : "border-border/75 bg-background/90 hover:bg-muted/55 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/7",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={[
                              "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold leading-none",
                              selected
                                ? "border-amber-500/70 bg-amber-200/70 text-amber-900 dark:border-amber-400/70 dark:bg-amber-500/20 dark:text-amber-200"
                                : "border-border/70 bg-muted/45 text-foreground/75 dark:border-white/15 dark:bg-white/5 dark:text-muted-foreground",
                            ].join(" ")}
                          >
                            {isScenarioDecision ? opt.id.toUpperCase() : String(Number(opt.id) + 1)}
                          </span>
                          <div className="text-sm leading-relaxed text-foreground/90">{opt.text}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Hinweis: Wähle die prüfungslogisch richtige Option.</p>
              </div>
            ) : isMultiSelect ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Wähle alle richtigen Aussagen</label>
                <div className="space-y-2">
                  {multiSelectOptions.map((opt) => {
                    const checked = multiSelected.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={[
                          "flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer transition",
                          checked
                            ? "border-amber-500/60 bg-amber-100 shadow-sm dark:border-amber-400/60 dark:bg-amber-500/10"
                            : "border-border/75 bg-background/90 hover:bg-muted/55 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/7",
                        ].join(" ")}
                      >
                        <input type="checkbox"
                          checked={checked}
                          onChange={(e: any) => {
                            const v = e.target.checked;
                            const next = new Set(multiSelected);
                            if (v) next.add(opt.id);
                            else next.delete(opt.id);
                            onTextFieldsChange({ ...(textFields ?? {}), multi: JSON.stringify(Array.from(next)) });
                          }}
                        />
                        <div className="text-sm leading-relaxed text-foreground/90">{opt.text}</div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Hinweis: Es können mehrere Aussagen richtig sein.</p>
              </div>
            ) : isOrder ? (
              <div className="space-y-3">
                <label className="text-sm font-medium">Bringe die Schritte in die richtige Reihenfolge</label>

                {(() => {
                  const n = orderItems.length;

                  function parseOrderIds(raw: any): string[] | null {
                    try {
                      if (Array.isArray(raw)) return raw.map(String);
                      const s = String(raw ?? "").trim();
                      if (!s) return null;
                      const v = JSON.parse(s);
                      if (Array.isArray(v)) return v.map(String);
                      return null;
                    } catch {
                      return null;
                    }
                  }

                  const raw = (textFields as any)?.order;
                  const parsed = parseOrderIds(raw);

                  const allIds = orderItems.map((it) => it.id);

                  // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Migration: falls alte Variante "Positionen" gespeichert war (["1","4","",...]),
                  // bauen wir daraus eine Reihenfolge (nur wenn sinnvoll).
                  function looksLikePositions(arr: string[]): boolean {
                    if (arr.length !== n) return false;
                    return arr.every((x) => x === "" || /^[0-9]+$/.test(x));
                  }

                  function positionsToOrder(arr: string[]): string[] {
                    const pairs = orderItems.map((it, idx) => ({ id: it.id, pos: arr[idx] ? Number(arr[idx]) : 9999, idx }));
                    pairs.sort((a, b) => (a.pos - b.pos) || (a.idx - b.idx));
                    return pairs.map((p) => p.id);
                  }

                  let orderIds: string[] = allIds;

                  if (Array.isArray(parsed) && parsed.length) {
                    if (parsed.length === n && parsed.every((x) => allIds.includes(x))) {
                      orderIds = parsed;
                    } else if (looksLikePositions(parsed)) {
                      orderIds = positionsToOrder(parsed);
                    }
                  }

                  function setOrder(nextIds: string[]) {
                    onTextFieldsChange({ ...(textFields ?? {}), order: JSON.stringify(nextIds) });
                  }

                  function move(id: string, dir: -1 | 1) {
                    const idx = orderIds.indexOf(id);
                    if (idx < 0) return;
                    const nextIdx = idx + dir;
                    if (nextIdx < 0 || nextIdx >= n) return;
                    const next = [...orderIds];
                    const tmp = next[idx];
                    next[idx] = next[nextIdx];
                    next[nextIdx] = tmp;
                    setOrder(next);
                  }

                  function OrderRow({ id, index }: { id: string; index: number }) {
                    const item = orderItems.find((x) => x.id === id);
                    const {
                      attributes,
                      listeners,
                      setNodeRef,
                      setActivatorNodeRef,
                      transform,
                      transition,
                      isDragging,
                      isOver,
                      isSorting,
                    } = useSortable({
                      id,
                      animateLayoutChanges: (args) => args.isSorting || args.wasDragging,
                    });

                    const style: React.CSSProperties = {
                      transform: CSS.Transform.toString(transform),
                      transition: isDragging ? "none" : transition,
                    };

                    return (
                      <div
                        ref={setNodeRef}
                        style={style}
                        {...attributes}
                        {...listeners}
                        tabIndex={0}
                        className={[
                          "grid grid-cols-[28px_1fr_auto] items-start gap-2 rounded-xl border px-2 py-2 outline-none",
                          "cursor-grab active:cursor-grabbing touch-none",
                          // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ WÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤hrend Drag nur ein Element ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾sichtbarÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ halten (Overlay) ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ reduziert Verwirrung
                          isDragging
                            ? "border-amber-400/40 bg-amber-500/5 opacity-20"
                            : "border-border/70 bg-background/90 dark:border-white/10 dark:bg-black/10",
                          // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Drop-Ziel dezent hervorheben
                          !isDragging && isOver ? "ring-2 ring-amber-400/25" : "",
                        ].join(" ")}
                      >
                        {/* Drag-Handle (nur am Griff) */}
                        <span
                          ref={setActivatorNodeRef}
                          className="place-self-center inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-muted/45 text-foreground/70 cursor-grab active:cursor-grabbing dark:border-white/10 dark:bg-white/5"
                          aria-label="Verschieben"
                          title="Ziehen zum Verschieben"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground">Position {index + 1}</div>
                          <div className="text-sm leading-relaxed text-foreground/90">{item?.text}</div>
                        </div>

                        {/* Pfeile (Fallback + praezise Steuerung) */}
                        <div className="place-self-center flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-muted/45 text-sm leading-none text-foreground/90 transition hover:bg-muted/65 disabled:opacity-35 disabled:cursor-not-allowed dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                            onClick={() => move(id, -1)}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={index === 0}
                            title="Nach oben"
                          >
                            <span aria-hidden>↑</span>
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-muted/45 text-sm leading-none text-foreground/90 transition hover:bg-muted/65 disabled:opacity-35 disabled:cursor-not-allowed dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                            onClick={() => move(id, 1)}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={index === n - 1}
                            title="Nach unten"
                          >
                            <span aria-hidden>↓</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  function DragCard({ id }: { id: string }) {
                    const item = orderItems.find((x) => x.id === id);
                    return (
                      <div className="grid grid-cols-[28px_1fr] items-start gap-2 rounded-xl border border-amber-400/60 bg-amber-500/10 px-2 py-2 shadow-xl">
                        <div className="place-self-center inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-muted/45 text-foreground/70 dark:border-white/10 dark:bg-white/5">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground">Verschieben...</div>
                          <div className="text-sm leading-relaxed text-foreground/90">{item?.text}</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="rounded-2xl border border-border/70 bg-background/90 dark:border-white/10 dark:bg-white/5">
                      <div className="p-3 space-y-2">
                        <DndContext
                          sensors={dndSensors}
                          collisionDetection={closestCenter}
                          onDragStart={(e) => setDndActiveId(String(e.active.id))}
                          onDragCancel={() => setDndActiveId(null)}
                          onDragEnd={(e) => {
                            const active = String(e.active.id);
                            const over = e.over ? String(e.over.id) : "";
                            setDndActiveId(null);
                            if (!over || active === over) return;
                            const from = orderIds.indexOf(active);
                            const to = orderIds.indexOf(over);
                            if (from < 0 || to < 0) return;
                            setOrder(arrayMove(orderIds, from, to));
                          }}
                        >
                          <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
                            {orderIds.map((id, idx) => (
                              <OrderRow key={id} id={id} index={idx} />
                            ))}
                          </SortableContext>

                          {typeof document !== "undefined"
                            ? createPortal(
                                <DragOverlay adjustScale={false}>
                                  {dndActiveId ? <DragCard id={dndActiveId} /> : null}
                                </DragOverlay>,
                                document.body
                              )
                            : null}
                        </DndContext>
                      </div>

                      <div className="px-3 pb-3">
                        <p className="text-xs text-muted-foreground">
                          Tipp: Du kannst die Zeilen am Griff <span className="font-semibold">::</span> ziehen (Mobile & Desktop) oder mit den Pfeilen verschieben.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : isMatch ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordne zu</label>
                <p className="text-xs text-muted-foreground">Hinweis: Dropdown-Paare sind mobilfreundlich und prüfungsnah (Zuordnung schriftlich).</p>
                <div className="rounded-2xl border border-border/70 bg-background/90 p-3 space-y-3 dark:border-white/10 dark:bg-white/5">
                  {(((current as any)?.answer?.left ?? []) as any[]).map((l: any) => {
                    const leftId = String(l?.id ?? "");
                    const leftText = String(l?.text ?? "");
                    const sel = matchSelectedPairs[leftId] ?? "";
                    const rights = ((current as any)?.answer?.right ?? []) as any[];
                    return (
                      <div key={leftId} className="grid gap-2 sm:grid-cols-[1fr_260px] items-start">
                        <div className="text-sm leading-relaxed text-foreground/90">{leftText}</div>
                        <select
                          value={sel}
                          onChange={(e) => {
                            const v = (e.target as HTMLSelectElement).value;
                            const next = { ...matchSelectedPairs, [leftId]: v };
                            onTextFieldsChange({ ...(textFields ?? {}), match: JSON.stringify(next) });
                          }}
                          className="w-full rounded-xl border border-border/70 bg-background/95 px-3 py-2 text-sm text-foreground/90 dark:border-white/10 dark:bg-black/10"
                        >
                          <option value="" disabled>
                            Zuordnen...
                          </option>
                          {rights.map((r: any) => {
                            const rid = String(r?.id ?? "");
                            const rtxt = String(r?.text ?? "");
                            return (
                              <option key={rid} value={rid}>
                                {rtxt}
                              </option>
                            );
                          })}
                        </select></div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Ergebnis</label>
                  <Input
                    ref={valueInputRef}
                    numeric
                    numericMode={inputSpec.mode}
                    allowNegative={inputSpec.allowNegative}
                    maxDecimals={inputSpec.mode === "decimal" ? inputSpec.maxDecimals : undefined}
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                    onFocus={() => {
                      if (!mobileResultInputActivated) {
                        setMobileResultInputActivated(true);
                      }
                    }}
                    placeholder={inputSpec.mode === "integer" ? "Ganze Zahl eingeben" : "Zahl eingeben"}
                    className="bg-muted/30"
                  />
                </div>

                <div className="space-y-1 md:max-w-[52%] md:min-w-[130px]">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Einheit</label>

                    {hasExpectedUnit ? (
                      <Input value={expectedUnitTrim} readOnly disabled className="bg-muted/30" />
                    ) : (
                      <Input
                        value={unit}
                        onChange={(e) => onUnitChange(e.target.value)}
                        placeholder="z. B. m/s"
                        className="bg-muted/30"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap transition-[border-color,background-color,box-shadow,color] duration-300",
                  solveStateBadgeClass,
                  solveFlashClass,
                ].join(" ")}
              >
                {currentSolveState.kind === "correct" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : currentSolveState.kind === "wrong" ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : currentSolveState.kind === "assisted" ? (
                  <HelpCircle className="h-3.5 w-3.5" />
                ) : (
                  <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                )}
                {currentSolveState.label}
              </span>
              <span
                className={[
                  "inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground transition-[border-color,background-color,color] duration-300",
                  resultFlash === "ok"
                    ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-100"
                    : resultFlash === "bad"
                    ? "border-rose-400/70 bg-rose-500/10 text-rose-100"
                    : resultFlash === "assist"
                    ? "border-amber-400/70 bg-amber-500/10 text-amber-100"
                    : "",
                ].join(" ")}
              >
                {index + 1}/{qs.length}
              </span>
            </div>

            {/* Buttons: Links (Zurück/Prüfen/Nächste) - Rechts (Lösung/Erklärung/Alle prüfen) */}
            <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between">
              {/* LINKS */}
              <div className="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:flex-wrap md:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center rounded-full md:w-auto"
                  onClick={() => handleGoTo(index - 1)}
                  disabled={index === 0}
                >
                  Zurück
                </Button>

                <Button
                  type="button"
                  className={[
                    "w-full justify-center rounded-full transition-[background-color,box-shadow,color] duration-300 md:w-auto",
                    checkButtonFlashClass,
                  ].join(" ")}
                  onPointerDown={keepMobileInputFocusOnActionPointerDown}
                  onMouseDown={keepMobileInputFocusOnActionMouseDown}
                  onClick={handleCheckOne}
                  title="Shift+Enter"
                >
                  Prüfen
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center rounded-full md:w-auto"
                  onPointerDown={keepMobileInputFocusOnActionPointerDown}
                  onMouseDown={keepMobileInputFocusOnActionMouseDown}
                  onClick={() => handleGoTo(index + 1, { alignTaskCard: true })}
                  disabled={index === qs.length - 1}
                  title="Enter = Nächste, Shift+Enter = Prüfen"
                >
                  Nächste
                </Button>
              </div>

              {/* RECHTS */}
              <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:flex-wrap md:items-center">
                <Button
                  type="button"
                  variant="secondary"
                  className="order-1 w-full justify-center rounded-full text-xs sm:text-sm md:order-1 md:w-auto"
                  onClick={onClickSolution}
                  disabled={!hasAnySolution || (!canToggleSolution && !hasTips)}
                  title={solutionButtonTitle}
                >
                  {solutionButtonLabel}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className={[
                    "relative order-3 col-span-2 w-full justify-center rounded-full gap-2 text-xs sm:text-sm md:order-2 md:col-span-1 md:w-auto",
                    !canUseExplain ? "opacity-50 cursor-not-allowed pr-12 sm:pr-4" : "",
                  ].join(" ")}
                  onClick={canUseExplain ? onExplain : undefined}
                  disabled={!canUseExplain}
                  title={
                    canUseExplain
                      ? "Konzeptionelle Hilfe: Vorgehen, Formelwahl, Einheitencheck - ohne Zahlen einzusetzen und ohne Endergebnis."
                      : "Diese Funktion ist nur in Pro verfügbar."
                  }
                >
                  <HelpCircle className="hidden h-4 w-4 text-muted-foreground sm:inline" />
                  <span className="text-xs sm:text-sm font-medium">Erklär mir das</span>
                  <span className="hidden sm:inline text-xs text-muted-foreground">ohne Lösung</span>

                  {!canUseExplain ? (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground sm:static sm:ml-1 sm:translate-y-0">
                      PRO
                    </span>
                  ) : null}
                </Button>

                <Button
                  type="button"
                  className={[
                    "order-2 w-full justify-center rounded-full text-xs sm:text-sm md:order-3 md:w-auto",
                    inWorkCount === 0 ? "opacity-60" : "opacity-95",
                  ].join(" ")}
                  onClick={onCheckAll}
                  disabled={inWorkCount === 0}
                  title={inWorkCount === 0 ? "Keine Aufgaben in Arbeit" : "Prüft alle Aufgaben, die noch in Arbeit sind"}
                >
                  Alle prüfen
                </Button>
              </div>
            </div>

            {/* Statuszeile */}
            {current?.id && (tipsRevealed || showSolution) ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {showSolution ? (
                  <span>
                    <span className="font-medium text-foreground/80">Hinweis:</span> Lösung wurde geöffnet.
                    Bei noch nicht korrekten Aufgaben wird das als
                    <span className="font-semibold"> Mit Hilfe</span> gewertet; bereits korrekte Aufgaben bleiben grün.
                  </span>
                ) : tipsRevealed ? (
                  <span>
                    <span className="font-medium text-foreground/80">Hinweis:</span> Tipps geöffnet - Lösung ist verfügbar.
                    Bei noch nicht korrekten Aufgaben wird die Lösung später als
                    <span className="font-semibold"> Mit Hilfe</span> gewertet; bereits korrekte Aufgaben bleiben grün.
                  </span>
                ) : null}
              </div>
            ) : null}

            {feedback ? (
              <Alert variant={feedback.kind === "bad" ? "destructive" : "default"}>
                <AlertTitle>{feedback.title}</AlertTitle>
                <AlertDescription>{feedback.text}</AlertDescription>
              </Alert>
            ) : null}

            {(feedback as any)?.examinerHints?.length ? (
              <div className="mt-3 rounded-md bg-muted/40 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Prüferhinweis:</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {(feedback as any).examinerHints.map((hint: string) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Erklärung */}
            {explainOpen && explainVm ? (
              <Card className="rounded-2xl border-white/10 bg-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-3">
                    <span>Erklärung</span>
                    <Button type="button" variant="ghost" className="rounded-full" onClick={() => setExplainOpen(false)}>
                      Schließen
                    </Button>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:space-y-0">
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-foreground/90">{explainVm.intro}</p>

                    {explainVm.meta.refusedSpoilerRequest ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                        Ich rechne nichts aus und setze keine Zahlen ein - ich zeige dir nur den Weg, wie du es selbst sicher loest.
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {explainVm.sections.map((sec, i) => (
                        <div key={`${sec.title}-${i}`} className="space-y-2">
                          <div className="text-sm font-semibold text-foreground/90">{sec.title}</div>

                          {sec.lead ? <div className="text-sm text-muted-foreground">{sec.lead}</div> : null}

                          {sec.formulaLatex ? (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <Markdown source={`$$\n${sec.formulaLatex}\n$$`} layout="bare" />
                            </div>
                          ) : null}

                          <ul className="list-disc pl-5 text-sm leading-relaxed text-foreground/85">
                            {sec.bullets.map((b, j) => (
                              <li key={`${i}-${j}`}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs font-semibold tracking-wide text-muted-foreground">QUICK-CHECK</div>
                      <ul className="mt-2 list-disc pl-5 text-sm leading-relaxed text-foreground/85">
                        {(explainVm.side.quickCheck ?? []).slice(0, 3).map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {explainVm.side.targetUnit ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold tracking-wide text-muted-foreground">ZIEL-EINHEIT</div>
                        <div className="mt-2 text-sm text-foreground/90">{explainVm.side.targetUnit}</div>
                      </div>
                    ) : null}

                    {explainVm.side.keyPitfall ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold tracking-wide text-muted-foreground">PRÜFUNGSFALLE</div>
                        <div className="mt-2 text-sm text-foreground/90">{explainVm.side.keyPitfall}</div>
                      </div>
                    ) : null}

                    {explainVm.followUp ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                        <div className="text-xs font-semibold tracking-wide text-muted-foreground">DENKANSTOß</div>
                        <div className="mt-2 text-foreground/90">{explainVm.followUp}</div>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {showSolution && hasAnySolution && (solutionUnlocked || derivedSolution.trim().length > 0) ? (
              <Card className="border-dashed rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base">Schritt-für-Schritt Lösung</CardTitle>
                </CardHeader>
                <CardContent>
                  <Markdown source={current.solution ?? derivedSolution} />
                </CardContent>
              </Card>
            ) : null}

            {/* Soft-Gate Dialog */}
            <AlertDialog open={solutionGateOpen} onOpenChange={setSolutionGateOpen}>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Lösung wirklich anzeigen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {hasTips ? (
                      <>
                        Empfohlen: Schau zuerst kurz in die Tipps (Formel/Umformung). Wenn die Aufgabe noch nicht korrekt gelöst ist,
                        wird sie beim Ansehen der Lösung als <span className="font-semibold">Mit Hilfe</span> gewertet.
                        Bereits korrekt gelöste Aufgaben bleiben grün.
                      </>
                    ) : (
                      <>
                        Wenn die Aufgabe noch nicht korrekt gelöst ist, wird sie beim Ansehen der Lösung als{" "}
                        <span className="font-semibold">Mit Hilfe</span> gewertet. Bereits korrekt gelöste Aufgaben bleiben grün.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Abbrechen</AlertDialogCancel>

                  {hasTips ? (
                    <AlertDialogAction
                      className="rounded-full"
                      onClick={() => {
                        revealTips();
                        setSolutionGateOpen(false);
                      }}
                    >
                      Tipps anzeigen
                    </AlertDialogAction>
                  ) : null}

                  <AlertDialogAction
                    className="rounded-full"
                    onClick={() => {
                      // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Direkt LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶sung = Hilfe ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ zuerst freischalten
                      revealTips();

                      // ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ dann LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶sung togglen
                      onToggleSolution();

                      setSolutionGateOpen(false);
                    }}
                  >
                    Direkt Lösung
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {isNumericTask ? (
              <p className="text-xs text-muted-foreground">
                Hinweis: Ergebnis kann mit Komma eingegeben werden (z. B. 10,5). - Enter = Nächste - Shift+Enter = Prüfen
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Hinweis: Kurz und prüfungstauglich schreiben. - Enter = Nächste - Shift+Enter = Prüfen
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            Lege Aufgaben in <code>questions.practice.json</code> an.
          </p>
        )}
      </CardContent>
    </Card>
  );
}


