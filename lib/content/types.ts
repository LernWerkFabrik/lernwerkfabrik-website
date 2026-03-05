// lib/content/types.ts

/* ------------------------------------------------------------------ */
/* Grundtypen */
/* ------------------------------------------------------------------ */

export type ModuleKind = "learn" | "prep" | "exam";

export type ModuleDifficulty = "easy" | "medium" | "hard";

export type MarkdownKind =
  | "explanation"
  | "symbols"
  | "workflow"
  | "comparison"
  | "example"
  | "formulas";

export type PrepFocus = "strategy" | "traps" | "time" | "mixed";

/* ------------------------------------------------------------------ */
/* Modul-Metadaten (module.json) */
/* ------------------------------------------------------------------ */

export type ModuleMeta = {
  /** technische ID = Ordnername */
  id: string;

  /** Anzeigename */
  title: string;

  /** Kurzbeschreibung (Cards, Listen) */
  description?: string;

  /**
   * ✅ ZENTRAL:
   * - learn  → normaler Lerncontent (Erklären, Üben, Fehlertraining)
   * - prep   → Prüfungsvorbereitung (Strategie, Ablauf, Fallen)
   * - exam   → echte Prüfung (Zeit, keine Hilfe, Bewertung)
   */
  kind: ModuleKind;

  /** optionale Meta-Infos für UI / Sortierung */
  difficulty?: ModuleDifficulty;
  tags?: string[];
  estimatedMinutes?: number;

  /**
   * optionale explizite Dateireferenzen
   * (falls du dich vom Default-Naming lösen willst)
   */
  files?: {
    explanation?: string;
    symbols?: string;
    workflow?: string;
    comparison?: string;
    example?: string;
    formulas?: string;
    practiceQuestions?: string;
    examQuestions?: string;
  };

  /**
   * ✅ nur bei prep-Modulen sinnvoll
   * (keine Pflicht, aber semantisch sauber)
   */
  prep?: {
    focus?: PrepFocus;
  };

  /**
   * ✅ nur bei exam-Modulen erlaubt / erwartet
   */
  exam?: {
    durationMinutes: number; // z.B. 45 / 50 / 60
    noHelp?: boolean;        // default: true
    autoSubmit?: boolean;   // default: true
  };

  /**
   * optionale didaktische Einordnung
   * (wird nicht vom System erzwungen)
   */
  intro?: {
    why?: string;
    trains?: string[];
    traps?: string[];
  };
};

/* ------------------------------------------------------------------ */
/* Fragen-Typen */
/* ------------------------------------------------------------------ */

export type ExamQuestion = {
  id: string;

  /** Verknüpfung zum Übungs-/Fehlertraining */
  practiceId?: string;

  prompt: string;

  answer: {
    value: number;
    unit: string;
  };

  tolerance?: number;

  input?: {
    mode?: "decimal" | "integer";
    maxDecimals?: number;
    allowNegative?: boolean;
  };
};

export type PracticeQuestion = {
  id: string;

  prompt: string;

  answer: {
    value: number;
    unit: string;
  };

  tolerance?: number;

  solution?: string;
  hints?: string[];

  input?: {
    mode?: "decimal" | "integer";
    maxDecimals?: number;
    allowNegative?: boolean;
  };
};

/* ------------------------------------------------------------------ */
/* Voll geladenes Modul (zur Laufzeit) */
/* ------------------------------------------------------------------ */

export type Module = ModuleMeta & {
  explanation?: string;
  symbols?: string;
  workflow?: string;
  comparison?: string;
  example?: string;
  formulas?: string;

  questions?: {
    practice?: PracticeQuestion[];
    exam?: ExamQuestion[];
  };
};
