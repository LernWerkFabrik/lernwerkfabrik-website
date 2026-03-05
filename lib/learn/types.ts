export type InputSpec = {
  mode?: "decimal" | "integer";
  maxDecimals?: number;
  allowNegative?: boolean;
};

export type ModuleMeta = {
  id: string;
  title: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  estimatedMinutes?: number;
};

export type Draft = {
  value: string;
  unit: string;

  /**
   * Für strukturierte Textaufgaben (Vorbereitung):
   * z. B. Zweck / Ablauf / Kontrolle
   */
  textFields?: Record<string, string>;
};


export type DraftById = Record<string, Draft>;

export type Status = "correct" | "attempted";
export type StatusById = Record<string, Status>;

export type CheckedById = Record<string, boolean>;
export type DirtyById = Record<string, boolean>;

/**
 * Number of check attempts per question (how often the user pressed "Prüfen" / "Alle prüfen").
 * Used for progress/evaluation rules (e.g. assisted after N attempts).
 */
export type AttemptsById = Record<string, number>;

export type SolutionSeenById = Record<string, boolean>;

export type FirstCorrectQuality = "clean" | "assisted";
export type FirstCorrectQualityById = Record<string, FirstCorrectQuality>;

export type LearnFeedback =
  | null
  | { kind: "ok" | "warn" | "bad"; title: string; text: string };

export type NormalizedInputSpec = Required<Pick<InputSpec, "mode" | "allowNegative">> &
  Pick<InputSpec, "maxDecimals">;

export type HydratedLikeQuestion = {
  id: string;
  prompt: string;
  answer: { value: number; unit: string };
  tolerance?: number;
  solution?: string;
  input?: NormalizedInputSpec;
};
