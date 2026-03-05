// lib/curriculum.ts
import type { ProfessionId } from "@/lib/profile";

/* -------------------- */
/* Types                */
/* -------------------- */

export type PlanId = "free" | "pro";

export type AreaId =
  | "grundlagen-metalltechnik"
  | "fertigen-montieren"
  | "instandhalten-warten"
  | "steuerung-automatisierung"
  | "qualitaet-prozesse"
  | "pruefungsvorbereitung";

export type ExamRelevance = "AP1" | "AP2" | "AP1_AP2";

export type ModuleRelevance = {
  exam: ExamRelevance;
  lehrjahre: Array<1 | 2 | 3 | 4>;
  lernfelder: number[];
};

export type AreaDef = {
  id: AreaId;
  title: string;
  description: string;
  requiresPlan?: PlanId;
};

type ProfessionCurriculum = {
  professionId: ProfessionId;
  areas: AreaDef[];
  moduleToArea: Record<string, AreaId>;
  moduleMeta: Record<string, ModuleRelevance>;
};

/* -------------------- */
/* Curriculum: Industriemechaniker */
/* -------------------- */

export const IM_CURRICULUM: ProfessionCurriculum = {
  professionId: "industriemechaniker",

  /* -------- Bereiche (Ebene 1) -------- */

  areas: [
    {
      id: "grundlagen-metalltechnik",
      title: "Grundlagen Metalltechnik",
      description: "Mathematische, physikalische und technische Grundlagen für alle weiteren Inhalte.",
    },
    {
      id: "fertigen-montieren",
      title: "Fertigen & Montieren",
      description: "Bauteile und Baugruppen nach Zeichnung fertigen, montieren und prüfen.",
    },
    {
      id: "instandhalten-warten",
      title: "Instandhalten & Warten",
      description: "Störungen erkennen, Wartungen planen und Instandhaltungsmaßnahmen durchführen.",
    },
    {
      id: "steuerung-automatisierung",
      title: "Steuerungs- & Automatisierungstechnik",
      description: "Technische Systeme steuern, überwachen und Fehler systematisch eingrenzen.",
    },
    {
      id: "qualitaet-prozesse",
      title: "Qualität, Organisation & Prozesse",
      description: "Qualität sichern, Arbeitsabläufe planen und betriebliche Prozesse verstehen.",
    },
    {
      id: "pruefungsvorbereitung",
      title: "Prüfungsvorbereitung",
      description: "Gezielte Vorbereitung auf AP Teil 1 und AP Teil 2 mit prüfungsnahen Aufgaben.",
      requiresPlan: "pro",
    },
  ],

  /* -------- Modul → Bereich -------- */

  moduleToArea: {
    // Grundlagen Metalltechnik (6)
    "technische-berechnungen": "grundlagen-metalltechnik",
    "stoffwerte-bauteilauswahl": "grundlagen-metalltechnik",
    "kraefte-drehmomente": "grundlagen-metalltechnik",
    "technische-zeichnungen": "grundlagen-metalltechnik",
    "sicherheit-umwelt": "grundlagen-metalltechnik",
    "werkstoffeigenschaften": "grundlagen-metalltechnik",

    // Fertigen & Montieren (5)
    "bauteile-fertigen": "fertigen-montieren",
    "fertigungsverfahren": "fertigen-montieren",
    "baugruppen-montieren": "fertigen-montieren",
    "toleranzen-fertigung": "fertigen-montieren",
    "werkzeuge-maschinen": "fertigen-montieren",

    // Instandhalten & Warten (4)
    "wartung-planen": "instandhalten-warten",
    "stoerungen-eingrenzen": "instandhalten-warten",
    "mechanische-schaeden": "instandhalten-warten",
    "instandhaltung-dokumentieren": "instandhalten-warten",

    // Steuerung & Automatisierung (4)
    "systeme-steuern": "steuerung-automatisierung",
    "schaltplaene-lesen": "steuerung-automatisierung",
    "elektrische-baugruppen": "steuerung-automatisierung",
    "fehler-steuerungen": "steuerung-automatisierung",

    // Qualität & Prozesse (4)
    "masse-toleranzen-pruefen": "qualitaet-prozesse",
    "pruefmittel-einsetzen": "qualitaet-prozesse",
    "qualitaetsmaengel": "qualitaet-prozesse",
    "arbeitsablaeufe-planen": "qualitaet-prozesse",

    // Prüfungsvorbereitung (4)
    "ap1-arbeitsaufgaben": "pruefungsvorbereitung",
    "ap1-rechen-fachaufgaben": "pruefungsvorbereitung",
    "ap2-systemaufgaben": "pruefungsvorbereitung",
    "ap2-situationsaufgaben": "pruefungsvorbereitung",
  },

  /* -------- Modul-Metadaten (IHK-relevant) -------- */

  moduleMeta: {
    "technische-berechnungen": { exam: "AP1_AP2", lehrjahre: [1, 2], lernfelder: [1, 2, 3] },
    "stoffwerte-bauteilauswahl": { exam: "AP1_AP2", lehrjahre: [1, 2], lernfelder: [1, 3, 4] },
    "kraefte-drehmomente": { exam: "AP1_AP2", lehrjahre: [1, 2], lernfelder: [3, 7, 10] },
    "technische-zeichnungen": { exam: "AP1_AP2", lehrjahre: [1, 2], lernfelder: [2, 5, 7] },
    "sicherheit-umwelt": { exam: "AP1_AP2", lehrjahre: [1, 2, 3], lernfelder: [1, 12] },
    "werkstoffeigenschaften": { exam: "AP1_AP2", lehrjahre: [1, 2], lernfelder: [1, 4] },

    "bauteile-fertigen": { exam: "AP1", lehrjahre: [1, 2], lernfelder: [2, 3, 5] },
    "fertigungsverfahren": { exam: "AP1_AP2", lehrjahre: [1, 2], lernfelder: [5, 7] },
    "baugruppen-montieren": { exam: "AP1_AP2", lehrjahre: [1, 2], lernfelder: [7, 10] },
    "toleranzen-fertigung": { exam: "AP1_AP2", lehrjahre: [2], lernfelder: [5, 11] },
    "werkzeuge-maschinen": { exam: "AP1", lehrjahre: [1], lernfelder: [2] },

    "wartung-planen": { exam: "AP2", lehrjahre: [2, 3], lernfelder: [9, 12] },
    "stoerungen-eingrenzen": { exam: "AP2", lehrjahre: [3], lernfelder: [12, 15] },
    "mechanische-schaeden": { exam: "AP2", lehrjahre: [2, 3], lernfelder: [9, 12] },
    "instandhaltung-dokumentieren": { exam: "AP2", lehrjahre: [2, 3], lernfelder: [14, 15] },

    "systeme-steuern": { exam: "AP2", lehrjahre: [3, 4], lernfelder: [13, 17] },
    "schaltplaene-lesen": { exam: "AP2", lehrjahre: [3], lernfelder: [13] },
    "elektrische-baugruppen": { exam: "AP2", lehrjahre: [3], lernfelder: [13] },
    "fehler-steuerungen": { exam: "AP2", lehrjahre: [3, 4], lernfelder: [17] },

    "masse-toleranzen-pruefen": { exam: "AP2", lehrjahre: [2, 3], lernfelder: [11] },
    "pruefmittel-einsetzen": { exam: "AP2", lehrjahre: [2, 3], lernfelder: [11] },
    "qualitaetsmaengel": { exam: "AP2", lehrjahre: [3], lernfelder: [14] },
    "arbeitsablaeufe-planen": { exam: "AP2", lehrjahre: [2, 3, 4], lernfelder: [14, 15] },

    "ap1-arbeitsaufgaben": { exam: "AP1", lehrjahre: [2], lernfelder: [] },
    "ap1-rechen-fachaufgaben": { exam: "AP1", lehrjahre: [2], lernfelder: [] },
    "ap2-systemaufgaben": { exam: "AP2", lehrjahre: [4], lernfelder: [] },
    "ap2-situationsaufgaben": { exam: "AP2", lehrjahre: [4], lernfelder: [] },
  },
};

/* -------------------- */
/* Internal selector    */
/* -------------------- */

function getProfessionCurriculum(professionId: ProfessionId): ProfessionCurriculum {
  if (professionId === "industriemechaniker") return IM_CURRICULUM;
  return IM_CURRICULUM;
}

/* -------------------- */
/* Public API           */
/* -------------------- */

export function getAreasForProfession(professionId: ProfessionId): AreaDef[] {
  return getProfessionCurriculum(professionId).areas;
}

export function getAllowedModuleIdsForProfession(professionId: ProfessionId): string[] {
  return Object.keys(getProfessionCurriculum(professionId).moduleToArea);
}

export function getAreaIdForModule(professionId: ProfessionId, moduleId: string): AreaId | null {
  return getProfessionCurriculum(professionId).moduleToArea[moduleId] ?? null;
}

export function getModuleRelevanceForModule(professionId: ProfessionId, moduleId: string): ModuleRelevance | null {
  return getProfessionCurriculum(professionId).moduleMeta[moduleId] ?? null;
}

export function getAreaById(areas: AreaDef[], id?: string | null): AreaDef | null {
  if (!id) return null;
  return areas.find((a) => a.id === id) ?? null;
}


// ---- Type Guard: ProfessionId ----
// Erlaubt typsichere Checks (Dashboard, Onboarding, etc.)
const KNOWN_PROFESSION_IDS = [IM_CURRICULUM.professionId] as const;

export function isProfessionId(id: string): id is ProfessionId {
  return (KNOWN_PROFESSION_IDS as readonly string[]).includes(id);
}
