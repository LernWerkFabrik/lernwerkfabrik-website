"use client";

import { useEffect, useMemo, useState } from "react";
import Markdown from "@/components/content/Markdown";
import { renderShapeInlineToken } from "@/components/content/mdShapes";
import { getBestScrollContainer } from "@/components/content/scroll";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ExampleKey =
  | "start"
  | "torque"
  | "pressure"
  | "force_from_pressure"
  | "weight_force"
  | "cylinder_volume"
  | "power_from_work"
  | "shaft_power"
  | "density"
  | "generic";

export type ExampleSignals = {
  key: ExampleKey;
  title: string;

  hasTorque: boolean;
  hasPressure: boolean;
  hasForceFromPressure: boolean;
  hasWeightForce: boolean;
  hasCylinder: boolean;
  hasVolume: boolean;
  hasPowerWorkTime: boolean;
  hasShaftPower: boolean;
  hasDensity: boolean;

  hasMm: boolean;
  hasCm2: boolean;
  hasMm3: boolean;
  hasCm3: boolean;
  hasM2: boolean;
  hasBar: boolean;
  hasPa: boolean;
  haskN: boolean;
  hasMinInv: boolean;
  hasSec: boolean;
  hasPi: boolean;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeTitle(t: string) {
  return t
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function keyFromHeadingTitle(title: string): ExampleKey {
  const t = normalizeTitle(title);

  if (t.includes("drehmoment")) return "torque";
  if (t.includes("druck") && (t.includes("umgestellt") || t.includes("kraft"))) return "force_from_pressure";
  if (t.includes("druck")) return "pressure";
  if (t.includes("gewichtskraft")) return "weight_force";
  if (t.includes("zylinder") && (t.includes("volumen") || t.includes("cm3") || t.includes("mm3")))
    return "cylinder_volume";
  if (t.includes("leistung") && (t.includes("arbeit") || t.includes("zeit"))) return "power_from_work";
  if (t.includes("rotierend") || t.includes("welle") || t.includes("wellenleistung")) return "shaft_power";
  if (t.includes("dichte")) return "density";
  if (t.includes("beispiele") || t.includes("beispiel")) return "start";

  return "generic";
}

function extractSignalsFromText(text: string) {
  const t = text.toLowerCase();
  const has = (re: RegExp) => re.test(t);

  const hasTorque = has(/drehmoment|hebelarm|\bn·m\b|n·m|n\*m|m\s*=\s*f/i);
  const hasPressure = has(/\bdruck\b|kraft auf fläche|p\s*=\s*f\s*\/\s*a/i);
  const hasForceFromPressure = has(/umgestellt|gesucht.*kraft|f\s*=\s*p\s*\*?\s*a/i);
  const hasWeightForce = has(/gewichtskraft|f_g|m\s*\*?\s*g|\bg\s*=\s*9/i);
  const hasCylinder = has(/zylinder|durchmesser|radius|r\s*=\s*d\s*\/\s*2/i);
  const hasVolume = has(/\bvolumen\b|\bmm3\b|\bcm3\b|\bm\^3\b|mm\^3|cm\^3/i);
  const hasPowerWorkTime = has(/\bleistung\b|arbeit|p\s*=\s*w\s*\/\s*t|w\s*=\s*p\s*\*?\s*t/i);
  const hasShaftPower = has(/welle|rotierend|2\s*\*?\s*pi|2\s*pi|\bn\s*=\s*\d|\/\s*60/i);
  const hasDensity = has(/\bdichte\b|rho|ρ|kg\/m3|g\/cm3/i);

  const hasMm = has(/\bmm\b|millimeter/);
  const hasCm2 = has(/cm2|cm\^2|cm²/);
  const hasM2 = has(/m2|m\^2|m²/);
  const hasMm3 = has(/mm3|mm\^3|mm³/);
  const hasCm3 = has(/cm3|cm\^3|cm³/);
  const hasBar = has(/\bbar\b/);
  const hasPa = has(/\bpa\b|pascal/);
  const haskN = has(/\bkn\b|kilonewton/);
  const hasMinInv = has(/1\/min|min\^-1|min⁻¹|min-1/);
  const hasSec = has(/\bs\b|\bsek\b|second/);
  const hasPi = has(/π|pi|3,1416|3\.1416/);

  return {
    hasTorque,
    hasPressure,
    hasForceFromPressure,
    hasWeightForce,
    hasCylinder,
    hasVolume,
    hasPowerWorkTime,
    hasShaftPower,
    hasDensity,

    hasMm,
    hasCm2,
    hasMm3,
    hasCm3,
    hasM2,
    hasBar,
    hasPa,
    haskN,
    hasMinInv,
    hasSec,
    hasPi,
  };
}

function getSectionText(activeHeading: HTMLElement) {
  const tag = activeHeading.tagName.toLowerCase();
  const sameLevel = tag === "h2" ? "h2" : tag === "h4" ? "h4" : "h3";

  const parts: string[] = [];
  let el: Element | null = activeHeading;

  while (el) {
    if (el !== activeHeading && el.tagName?.toLowerCase() === sameLevel) break;

    if (el !== activeHeading) {
      const txt = (el as HTMLElement).innerText?.trim?.() ?? "";
      if (txt) parts.push(txt);
    }

    el = el.nextElementSibling;
  }

  return parts.join("\n");
}

type ScrollHost = Window | HTMLElement;

function isWindow(x: any): x is Window {
  return typeof window !== "undefined" && x === window;
}

function headingYInScrollerViewport(h: HTMLElement, scroller: ScrollHost) {
  const hr = h.getBoundingClientRect();
  if (isWindow(scroller)) return hr.top;

  const sr = scroller.getBoundingClientRect();
  return hr.top - sr.top;
}

/* -------------------------------------------------------------------------- */
/* Hook: Auto Sidebar Signals                                                 */
/* -------------------------------------------------------------------------- */

export function useAutoExampleSidebar(exampleRootEl: HTMLElement | null, enabled: boolean) {
  const [signals, setSignals] = useState<ExampleSignals>(() => ({
    key: "start",
    title: "Beispiele",

    hasTorque: false,
    hasPressure: false,
    hasForceFromPressure: false,
    hasWeightForce: false,
    hasCylinder: false,
    hasVolume: false,
    hasPowerWorkTime: false,
    hasShaftPower: false,
    hasDensity: false,

    hasMm: false,
    hasCm2: false,
    hasMm3: false,
    hasCm3: false,
    hasM2: false,
    hasBar: false,
    hasPa: false,
    haskN: false,
    hasMinInv: false,
    hasSec: false,
    hasPi: false,
  }));

  useEffect(() => {
    if (!enabled) return;
    if (!exampleRootEl) return;

    const root = exampleRootEl;

    const sc = getBestScrollContainer(root as any) as any;
    const scroller: ScrollHost = sc === window ? window : (sc as HTMLElement);

    const getHeadings = () => {
      const h3 = Array.from(root.querySelectorAll<HTMLElement>("h3")).filter((h) => (h.textContent ?? "").trim());
      if (h3.length) return h3;

      const h2 = Array.from(root.querySelectorAll<HTMLElement>("h2")).filter((h) => (h.textContent ?? "").trim());
      if (h2.length) return h2;

      const h4 = Array.from(root.querySelectorAll<HTMLElement>("h4")).filter((h) => (h.textContent ?? "").trim());
      return h4;
    };

    const pickActive = () => {
      const headings = getHeadings();
      if (!headings.length) return;

      const topOffset = 110;

      let best: HTMLElement | null = null;
      let bestY = -Infinity;

      for (const h of headings) {
        const y = headingYInScrollerViewport(h, scroller);
        if (y <= topOffset + 8 && y > bestY) {
          best = h;
          bestY = y;
        }
      }

      const active = best ?? headings[0];
      const title = (active.textContent ?? "").trim();
      const keyFromTitle = keyFromHeadingTitle(title);

      const sectionText = getSectionText(active);
      const textSignals = extractSignalsFromText(`${title}\n${sectionText}`);

      let key: ExampleKey = keyFromTitle;
      if (key === "generic" || key === "start") {
        if (textSignals.hasTorque) key = "torque";
        else if (textSignals.hasForceFromPressure) key = "force_from_pressure";
        else if (textSignals.hasPressure) key = "pressure";
        else if (textSignals.hasWeightForce) key = "weight_force";
        else if (textSignals.hasCylinder && textSignals.hasVolume) key = "cylinder_volume";
        else if (textSignals.hasShaftPower) key = "shaft_power";
        else if (textSignals.hasPowerWorkTime) key = "power_from_work";
        else if (textSignals.hasDensity) key = "density";
      }

      setSignals({
        key,
        title: title || "Beispiel",

        hasTorque: textSignals.hasTorque,
        hasPressure: textSignals.hasPressure,
        hasForceFromPressure: textSignals.hasForceFromPressure,
        hasWeightForce: textSignals.hasWeightForce,
        hasCylinder: textSignals.hasCylinder,
        hasVolume: textSignals.hasVolume,
        hasPowerWorkTime: textSignals.hasPowerWorkTime,
        hasShaftPower: textSignals.hasShaftPower,
        hasDensity: textSignals.hasDensity,

        hasMm: textSignals.hasMm,
        hasCm2: textSignals.hasCm2,
        hasMm3: textSignals.hasMm3,
        hasCm3: textSignals.hasCm3,
        hasM2: textSignals.hasM2,
        hasBar: textSignals.hasBar,
        hasPa: textSignals.hasPa,
        haskN: textSignals.haskN,
        hasMinInv: textSignals.hasMinInv,
        hasSec: textSignals.hasSec,
        hasPi: textSignals.hasPi,
      });
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pickActive);
    };

    pickActive();

    if (isWindow(scroller)) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        cancelAnimationFrame(raf);
      };
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [exampleRootEl, enabled]);

  return signals;
}

/* -------------------------------------------------------------------------- */
/* UI                                                                         */
/* -------------------------------------------------------------------------- */

function SidebarCard({ title, md, shape }: { title: string; md: string; shape?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-transparent p-4 lp-card-grad-subtle">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {shape ? (
          <div className="shrink-0 rounded-xl border border-border/60 bg-transparent p-2 lp-card-grad-subtle">
            {renderShapeInlineToken(`[[shape:${shape}]]`, 84)}
          </div>
        ) : null}
      </div>
      <Markdown source={md} layout="bare" />
    </div>
  );
}

function buildConversions(s: ExampleSignals) {
  const conv: string[] = [];
  if (s.haskN) conv.push(`- $1\\,\\mathrm{kN}=1000\\,\\mathrm{N}$`);
  if (s.hasBar || s.hasPa) conv.push(`- $1\\,\\mathrm{bar}=100\\,000\\,\\mathrm{Pa}$`);
  if (s.hasCm2 || s.hasM2) conv.push(`- $1\\,\\mathrm{cm^2}=10^{-4}\\,\\mathrm{m^2}$`);
  if (s.hasCm3 || s.hasMm3) conv.push(`- $1\\,\\mathrm{cm^3}=1000\\,\\mathrm{mm^3}$`);
  if (s.hasMinInv || s.hasSec) conv.push(`- $1\\,\\mathrm{min}=60\\,\\mathrm{s}$`);
  return conv;
}

function topicCards(s: ExampleSignals) {
  // Weniger Karten, dafür “passend” und prüfungsnah.
  switch (s.key) {
    case "torque":
      return [
        {
          title: "Kurz erklärt",
          md: `Du hast eine Kraft, die **im Abstand** zu einer Drehachse wirkt.\n\n- Hebelarm $r$ immer **in m**\n- Ergebnis $M$ in **N·m**`,
        },
        {
          title: "Formel",
          shape: "lever",
          md: `$$M=F\\cdot r$$\n\nUmstellen:\n- $F=\\frac{M}{r}$\n- $r=\\frac{M}{F}$`,
        },
        {
          title: "Typische Fallen",
          md: `- mm → m vergessen\n- Kraft in kN gegeben → erst in N\n- Runden erst am Ende`,
        },
      ];

    case "pressure":
      return [
        {
          title: "Kurz erklärt",
          md: `Druck ist **Kraft pro Fläche**.\n\n- $A$ muss in **m²** sein\n- $p$ in **Pa** (oder in bar, wenn verlangt)`,
        },
        {
          title: "Formel",
          shape: "pressure",
          md: `$$p=\\frac{F}{A}$$\n\nUmstellen:\n- $F=p\\cdot A$\n- $A=\\frac{F}{p}$`,
        },
        {
          title: "Typische Fallen",
          md: `- cm² → m² nicht umgerechnet\n- bar ↔ Pa verwechselt\n- Fläche bei Kreis: $A=\\pi r^2$`,
        },
      ];

    case "force_from_pressure":
      return [
        {
          title: "Kurz erklärt",
          md: `Hier ist meist **Kraft gesucht**.\n\n- erst $p$ in Pa\n- dann $A$ in m²\n- dann multiplizieren`,
        },
        {
          title: "Formel",
          shape: "pressure",
          md: `$$F=p\\cdot A$$`,
        },
        {
          title: "Typische Fallen",
          md: `- $p$ in bar eingesetzt ohne Umrechnung\n- $A$ in cm² eingesetzt\n- Ergebnis ohne Einheit`,
        },
      ];

    case "weight_force":
      return [
        {
          title: "Kurz erklärt",
          md: `Gewichtskraft ist Masse mal Erdbeschleunigung.\n\n- $m$ in **kg**\n- $g\\approx 9{,}81\\,\\mathrm{m/s^2}$ (manchmal 10)`,
        },
        {
          title: "Formel",
          shape: "weight_force",
          md: `$$F_G=m\\cdot g$$\n\nUmstellen:\n- $m=\\frac{F_G}{g}$`,
        },
        {
          title: "Typische Fallen",
          md: `- g statt kg\n- $g=10$ verwenden obwohl 9,81 gefordert\n- kN/N verwechseln`,
        },
      ];

    case "cylinder_volume":
      return [
        {
          title: "Kurz erklärt",
          md: `Volumen eines Zylinders = Grundfläche × Höhe.\n\n- aus Durchmesser: $r=\\frac{d}{2}$\n- Einheiten sauber halten (mm³ ↔ cm³)`,
        },
        {
          title: "Formel",
          shape: "cylinder",
          md: `$$V=\\pi r^2 h$$`,
        },
        {
          title: "Typische Fallen",
          md: `- $r$ statt $d$ benutzt\n- mm → cm nicht konsistent\n- $\\pi$ vergessen`,
        },
      ];

    case "power_from_work":
      return [
        {
          title: "Kurz erklärt",
          md: `Leistung ist Arbeit pro Zeit.\n\n- $W$ in J\n- $t$ in s\n- $P$ in W`,
        },
        {
          title: "Formel",
          shape: "power_time",
          md: `$$P=\\frac{W}{t}$$\n\nUmstellen:\n- $W=P\\cdot t$\n- $t=\\frac{W}{P}$`,
        },
        {
          title: "Typische Fallen",
          md: `- Minuten nicht in Sekunden umgerechnet\n- kW/W verwechselt\n- Arbeit mit Energieeinheit durcheinander`,
        },
      ];

    case "shaft_power":
      return [
        {
          title: "Kurz erklärt",
          md: `Bei rotierender Bewegung hängt Leistung von Drehmoment und Drehzahl ab.\n\n- $n$ oft in $\\mathrm{min^{-1}}$\n- deshalb kommt das $/60$`,
        },
        {
          title: "Formel",
          shape: "shaft_power",
          md: `$$P=\\frac{2\\pi\\,n\\,M}{60}$$\n\n(gilt für $n$ in $\\mathrm{min^{-1}}$)`,
        },
        {
          title: "Typische Fallen",
          md: `- $n$ schon in 1/s, aber trotzdem /60\n- $M$ in N·m vs. N·mm\n- kW ↔ W`,
        },
      ];

    case "density":
      return [
        {
          title: "Kurz erklärt",
          md: `Dichte ist Masse pro Volumen.\n\n- $m$ in kg\n- $V$ in m³ (oder cm³)\n- Einheit anpassen: kg/m³ oder g/cm³`,
        },
        {
          title: "Formel",
          shape: "unit_volume",
          md: `$$\\rho=\\frac{m}{V}$$\n\nUmstellen:\n- $m=\\rho\\cdot V$\n- $V=\\frac{m}{\\rho}$`,
        },
        {
          title: "Typische Fallen",
          md: `- cm³ ↔ m³ nicht umgerechnet\n- g ↔ kg\n- Ergebnis ohne Einheit`,
        },
      ];

    default:
      return [
        {
          title: "Hinweis",
          md: `Scroll in den Beispielen auf eine Überschrift (z.B. **Beispiel 1**, **Beispiel 2**), dann passt sich die Sidebar an.`,
        },
      ];
  }
}

export function AutoExampleSidebar({ s }: { s: ExampleSignals }) {
  const cards = useMemo(() => {
    const out: Array<{ title: string; md: string; shape?: string }> = [];

    // 1) Active (ohne “Meta-Erklärung”)
    out.push({
      title: "Aktueller Abschnitt",
      md: `**${s.title}**`,
    });

    // 2) Topic-spezifisch
    out.push(...topicCards(s));

    // 3) Umrechnungen (nur wenn relevant)
    const conv = buildConversions(s);
    if (conv.length) {
      out.push({
        title: "Umrechnungen",
        md: conv.join("\n"),
      });
    }

    // 4) Mini Prüfer-Check (knapp, ohne Extra-Boxen)
    out.push({
      title: "Prüfer-Check",
      md: `- Einheit am Ende **immer** dran\n- erst umrechnen, dann rechnen\n- erst zum Schluss runden`,
    });

    return out;
  }, [s]);

  return (
    <div className="space-y-4">
      {cards.map((c, i) => (
        <SidebarCard key={`${c.title}-${i}`} title={c.title} md={c.md} shape={c.shape} />
      ))}
    </div>
  );
}
