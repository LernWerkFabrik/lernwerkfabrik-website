// lib/learn/textEvaluation.ts
// NOTE: This file is intentionally deterministic (no AI grading).
// Any new fields are added in a backward-compatible way.

export type HelpCost = "assisted" | "none";

export type StructuredTextField = {
  key: string;
  label: string;
  minWords?: number;
  maxWords?: number;
};

export type StructuredTextRubricItem = {
  id: string;
  label: string;
  points: number;

  // Simple "any of these keywords" matcher (case-insensitive)
  keywordsAny?: string[];

  // Groups of synonyms; count groups matched
  keywordsGroups?: string[][];
  minGroupsMatched?: number;

  // Optionally require a specific field to be non-empty
  requiresFieldKey?: string;
};

export type StructuredTextTask = {
  id: string;
  type: "structured_text";
  points?: number;
  prompt: string;

  answer: {
    fields: StructuredTextField[];
    keywords?: Record<string, string[]>;
  };

  grading?: {
    rubric?: StructuredTextRubricItem[];
    auto?: {
      minWordsTotal?: number;
      caseInsensitive?: boolean;
      requiredConcepts?: string[];
    };
  };

  // Prep-only: allow tasks to suggest which error categories this task trains.
  // We NEVER depend on this existing (optional).
  errorTags?: string[];

  help?: {
    reveal?: { label: string; cost: HelpCost };
  };

  feedback?: {
    checklist?: string[];
    modelStructure?: Record<string, string>;
  };
};

export type StructuredTextUserAnswer = Record<string, string>;

export type RubricResult = {
  id: string;
  label: string;
  pointsPossible: number;
  pointsEarned: number;
  details?: string;
};

export type StructuredTextEvaluation = {
  pointsPossible: number;
  pointsEarned: number;
  rubric: RubricResult[];
  wordCountTotal: number;
  fieldWordCounts: Record<string, number>;
  groupsMatchedByRubric: Record<string, number>; // rubricId -> groupsMatched
  passed: boolean;

  // For UI feedback
  missingChecklist: string[];

  // ---- Additive fields (safe for existing callers) ----
  errorTagsDetected?: string[]; // deterministic categories derived from the answer
  examinerHints?: string[]; // short, prüfernahe Hinweise (derived from errorTagsDetected)
  conceptCoverage?: {
    required: number;
    matched: number;
    ratio: number;
    missing: string[];
  };
};

const PRUEFER_TEXTE: Record<string, string> = {
  planning: "Der Arbeitsablauf ist nicht ausreichend strukturiert dargestellt.",
  decision: "Die fachliche Entscheidung ist nicht eindeutig begründet.",
  justification: "Eine prüfungsgerechte Begründung fehlt oder ist zu allgemein.",
  measurement: "Der Prüfschritt zur Sicherung der Maßhaltigkeit fehlt.",
  tolerance: "Die Toleranzgrenzen wurden nicht korrekt berücksichtigt.",
  calculation: "Der Rechenweg ist nicht vollständig oder nicht nachvollziehbar dargestellt.",
  unit: "Die Einheit fehlt oder ist nicht korrekt angegeben.",
  documentation: "Die Dokumentation ist für die Bewertung nicht nachvollziehbar.",
};

const TAG_PRIORITY: string[] = [
  "unit",
  "justification",
  "documentation",
  "tolerance",
  "measurement",
  "calculation",
  "decision",
  "planning",
];

function normalize(s: string, caseInsensitive: boolean) {
  let t = String(s ?? "").normalize("NFKC").trim();
  t = t
    .replace(/[\u00E4\u00C4]/g, "ae")
    .replace(/[\u00F6\u00D6]/g, "oe")
    .replace(/[\u00FC\u00DC]/g, "ue")
    .replace(/\u00DF/g, "ss")
    .replace(/\s+/g, " ");
  return caseInsensitive ? t.toLowerCase() : t;
}

function wordCount(text: string): number {
  const t = (text ?? "").trim();
  if (!t) return 0;
  // Split on whitespace; robust for German too.
  return t.split(/\s+/).filter(Boolean).length;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesKeyword(haystack: string, needle: string): boolean {
  // Keep phrase matching, but use token boundaries for simple words.
  // This prevents false positives for short tokens like "ok".
  const h = String(haystack ?? "").trim();
  const n = String(needle ?? "").trim();
  if (!h || !n) return false;

  if (/^[a-z0-9]+$/.test(n)) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(n)}(?=[^a-z0-9]|$)`);
    return re.test(h);
  }
  return h.includes(n);
}

function normalizeConceptToken(token: string): string {
  return normalize(token, true);
}

function hasConcept(textNorm: string, concept: string): boolean {
  return includesKeyword(textNorm, normalizeConceptToken(concept));
}

function countGroupsMatched(haystack: string, groups: string[][]): number {
  let matched = 0;
  for (const group of groups) {
    if (group.some((kw) => includesKeyword(haystack, kw))) matched += 1;
  }
  return matched;
}

function normalizeRubric(task: StructuredTextTask): StructuredTextRubricItem[] {
  const configured = Array.isArray(task.grading?.rubric) ? task.grading.rubric : [];
  if (configured.length > 0) return configured;

  // Backward compatibility: allow compact tasks without grading block.
  const fields = Array.isArray(task.answer?.fields) ? task.answer.fields : [];
  const rawKeywords = task.answer?.keywords && typeof task.answer.keywords === "object" ? task.answer.keywords : {};

  const fallback: StructuredTextRubricItem[] = [];
  for (const f of fields) {
    const kwRaw = (rawKeywords as Record<string, unknown>)[f.key];
    const keywordsAny = Array.isArray(kwRaw)
      ? kwRaw.map((v) => String(v ?? "").trim()).filter(Boolean)
      : [];
    const keywordGroups = keywordsAny.map((kw) => [kw]);
    const minGroupsMatched =
      keywordGroups.length > 0
        ? Math.min(keywordGroups.length, Math.max(2, Math.ceil(keywordGroups.length * 0.35)))
        : undefined;

    fallback.push({
      id: `field-${f.key}`,
      label: f.label || f.key,
      points: 1,
      requiresFieldKey: f.key,
      ...(keywordGroups.length > 0 ? { keywordsGroups: keywordGroups, minGroupsMatched } : {}),
    });
  }

  return fallback;
}

function detectErrorTags(args: {
  task: StructuredTextTask;
  userAnswer: StructuredTextUserAnswer;
  wordCountTotal: number;
  fieldWordCounts: Record<string, number>;
  pointsPossible: number;
  pointsEarned: number;
  missingChecklist: string[];
}): string[] {
  const { task, userAnswer, wordCountTotal, fieldWordCounts, pointsPossible, pointsEarned, missingChecklist } = args;

  const tags = new Set<string>();

  // 1) Structural requirements: commonly used in AP1 Prep (decision/reason/check)
  const keys = new Set(task.answer.fields.map((f) => f.key));
  const hasDecision = keys.has("decision");
  const hasReason = keys.has("reason");
  const hasCheck = keys.has("check");

  if (hasDecision && String(userAnswer?.["decision"] ?? "").trim().length === 0) tags.add("decision");
  if (hasReason && String(userAnswer?.["reason"] ?? "").trim().length === 0) tags.add("justification");
  if (hasCheck && String(userAnswer?.["check"] ?? "").trim().length === 0) tags.add("measurement");

  // 2) If any required field is very short, treat as justification/documentation weakness
  if (hasReason) {
    const wc = fieldWordCounts["reason"] ?? 0;
    if (wc > 0 && wc < 6) tags.add("justification");
  }
  if (hasCheck) {
    const wc = fieldWordCounts["check"] ?? 0;
    if (wc > 0 && wc < 4) tags.add("measurement");
  }

  // 3) Too short overall → usually insufficient justification for AP1
  const minWordsTotal = task.grading?.auto?.minWordsTotal;
  if (typeof minWordsTotal === "number" && wordCountTotal < minWordsTotal) {
    tags.add("justification");
  }

  // 4) Low score ratio → decision/structure likely off (keep deterministic and conservative)
  const ratio = pointsPossible > 0 ? pointsEarned / pointsPossible : 0;
  if (ratio < 0.7) {
    // If we already have a more specific tag, keep that; otherwise mark decision as generic.
    if (tags.size === 0) tags.add("decision");
  }

  // 5) Parse any explicit cues from missingChecklist text (future-proof, even if you add more checks later)
  const miss = (missingChecklist ?? []).join(" ").toLowerCase();
  if (miss.includes("einheit")) tags.add("unit");
  if (miss.includes("toleranz")) tags.add("tolerance");
  if (miss.includes("rechen")) tags.add("calculation");
  if (miss.includes("dokument")) tags.add("documentation");
  if (miss.includes("prüf") || miss.includes("kontroll")) tags.add("measurement");
  if (miss.includes("ablauf") || miss.includes("struktur")) tags.add("planning");

  // Keep tags only from our known set + any task-provided tags (optional) for future use.
  // We do NOT add task.errorTags automatically to detected tags; it's informational only.
  return Array.from(tags);
}

function buildExaminerHints(errorTagsDetected: string[] | undefined): string[] | undefined {
  if (!errorTagsDetected || errorTagsDetected.length === 0) return undefined;

  const uniq = Array.from(new Set(errorTagsDetected.map((t) => String(t).trim().toLowerCase()).filter(Boolean)));
  const ordered = uniq.sort((a, b) => {
    const ia = TAG_PRIORITY.indexOf(a);
    const ib = TAG_PRIORITY.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const hints: string[] = [];
  for (const tag of ordered) {
    const t = PRUEFER_TEXTE[tag];
    if (t) hints.push(t);
    if (hints.length >= 2) break; // keep it short
  }

  return hints.length ? hints : undefined;
}

export function evaluateStructuredTextTask(
  task: StructuredTextTask,
  userAnswer: StructuredTextUserAnswer
): StructuredTextEvaluation {
  const caseInsensitive = task.grading?.auto?.caseInsensitive ?? true;
  const rubric = normalizeRubric(task);
  const rubricPointsPossible = rubric.reduce((sum, r) => {
    const n = Number(r?.points);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  // Build full text + per-field counts
  const fieldWordCounts: Record<string, number> = {};
  const fieldTextByKey: Record<string, string> = {};
  let combined = "";
  for (const f of task.answer.fields) {
    const v = String(userAnswer?.[f.key] ?? "");
    const c = wordCount(v);
    fieldWordCounts[f.key] = c;
    fieldTextByKey[f.key] = v;
    combined += `\n${v}`;
  }

  const combinedNorm = normalize(combined, caseInsensitive);
  const fieldNormByKey: Record<string, string> = {};
  for (const [key, value] of Object.entries(fieldTextByKey)) {
    fieldNormByKey[key] = normalize(value, caseInsensitive);
  }
  const wordCountTotal = wordCount(combined);

  const rubricResults: RubricResult[] = [];
  const groupsMatchedByRubric: Record<string, number> = {};

  let pointsEarned = 0;
  const configuredPoints = Number(task.points);
  const pointsPossible =
    rubricPointsPossible > 0
      ? rubricPointsPossible
      : Number.isFinite(configuredPoints) && configuredPoints > 0
      ? configuredPoints
      : 1;

  // Evaluate rubric line by line
  for (const r of rubric) {
    let earned = 0;
    const hasKeywordAny = Array.isArray(r.keywordsAny) && r.keywordsAny.length > 0;
    const hasKeywordGroups = Array.isArray(r.keywordsGroups) && r.keywordsGroups.length > 0;
    const keywordsAny = hasKeywordAny ? (r.keywordsAny as string[]) : [];
    const keywordsGroups = hasKeywordGroups ? (r.keywordsGroups as string[][]) : [];
    const scopeNorm = r.requiresFieldKey ? String(fieldNormByKey[r.requiresFieldKey] ?? "") : combinedNorm;

    // Field requirement (if configured)
    if (r.requiresFieldKey) {
      const v = String(userAnswer?.[r.requiresFieldKey] ?? "");
      if (v.trim().length === 0) {
        rubricResults.push({
          id: r.id,
          label: r.label,
          pointsPossible: r.points,
          pointsEarned: 0,
          details: `Feld "${r.requiresFieldKey}" ist leer.`,
        });
        continue;
      }
      if (!hasKeywordAny && !hasKeywordGroups) {
        earned = r.points;
      }
    }

    // keywordsAny matcher
    if (hasKeywordAny) {
      const anyHit = keywordsAny.some((kw) =>
        includesKeyword(scopeNorm, normalize(kw, caseInsensitive))
      );
      if (anyHit) earned = r.points;
    }

    // keywordsGroups matcher (overrides any-only if present)
    if (hasKeywordGroups) {
      const groups = keywordsGroups.map((g) => g.map((kw) => normalize(kw, caseInsensitive)));
      const matched = countGroupsMatched(scopeNorm, groups);
      groupsMatchedByRubric[r.id] = matched;

      const min = r.minGroupsMatched ?? Math.min(1, groups.length);
      if (matched >= min) earned = r.points;
      else earned = 0;
    }

    rubricResults.push({
      id: r.id,
      label: r.label,
      pointsPossible: r.points,
      pointsEarned: earned,
      details:
        r.keywordsGroups && r.keywordsGroups.length > 0
          ? `Treffergruppen: ${groupsMatchedByRubric[r.id] ?? 0}/${r.keywordsGroups.length}`
          : undefined,
    });

    pointsEarned += earned;
  }

  // Auto checks (word count / minimal structure)
  const missingChecklist: string[] = [];

  const minWordsTotal = task.grading?.auto?.minWordsTotal;
  if (typeof minWordsTotal === "number" && wordCountTotal < minWordsTotal) {
    missingChecklist.push(
      `Antwort ist zu kurz (${wordCountTotal} W\u00f6rter, empfohlen mindestens ${minWordsTotal}).`
    );
  }

  // Field-level minWords checks
  let hasFieldMinWordsViolation = false;
  for (const f of task.answer.fields) {
    if (typeof f.minWords === "number") {
      const c = fieldWordCounts[f.key] ?? 0;
      if (c < f.minWords) {
        hasFieldMinWordsViolation = true;
        missingChecklist.push(
          `"${f.label}" ist zu kurz (${c} W\u00f6rter, empfohlen mindestens ${f.minWords}).`
        );
      }
    }
  }

  const requiredConceptsRaw = Array.isArray(task.grading?.auto?.requiredConcepts)
    ? task.grading?.auto?.requiredConcepts ?? []
    : [];
  const requiredConcepts = requiredConceptsRaw
    .map((c) => String(c ?? "").trim())
    .filter(Boolean);

  let conceptCoverage:
    | {
        required: number;
        matched: number;
        ratio: number;
        missing: string[];
      }
    | undefined;

  let ratio = pointsPossible > 0 ? pointsEarned / pointsPossible : 0;

  // AP1-prep weighted auto-grading when requiredConcepts are configured:
  // - min words: 30%
  // - keyword/rubric hit rate: 50%
  // - process concepts coverage: 20%
  if (requiredConcepts.length > 0) {
    const missingConcepts = requiredConcepts.filter((c) => !hasConcept(combinedNorm, c));
    const matchedConcepts = requiredConcepts.length - missingConcepts.length;
    const conceptRatio = requiredConcepts.length > 0 ? matchedConcepts / requiredConcepts.length : 1;

    conceptCoverage = {
      required: requiredConcepts.length,
      matched: matchedConcepts,
      ratio: conceptRatio,
      missing: missingConcepts,
    };

    const wordsRatio =
      typeof minWordsTotal === "number"
        ? wordCountTotal >= minWordsTotal
          ? 1
          : 0
        : 1;
    const keywordRatio = pointsPossible > 0 ? pointsEarned / pointsPossible : 0;

    const weightedRatio = 0.3 * wordsRatio + 0.5 * keywordRatio + 0.2 * conceptRatio;
    ratio = weightedRatio;
    pointsEarned = Math.round(pointsPossible * weightedRatio * 100) / 100;

    if (missingConcepts.length > 0) {
      missingChecklist.push(
        `Fehlende Kernbegriffe: ${missingConcepts.slice(0, 5).join(", ")}.`
      );
    }
  }

  // Passed: AP1 weighted mode >=60%; legacy mode >=70%.
  const passed =
    (requiredConcepts.length > 0 ? ratio >= 0.6 : ratio >= 0.7) &&
    !(typeof minWordsTotal === "number" && wordCountTotal < minWordsTotal) &&
    !hasFieldMinWordsViolation;

  const errorTagsDetected = detectErrorTags({
    task,
    userAnswer,
    wordCountTotal,
    fieldWordCounts,
    pointsPossible,
    pointsEarned,
    missingChecklist,
  });

  const examinerHints = buildExaminerHints(errorTagsDetected);

  return {
    pointsPossible,
    pointsEarned,
    rubric: rubricResults,
    wordCountTotal,
    fieldWordCounts,
    groupsMatchedByRubric,
    passed,
    missingChecklist,
    errorTagsDetected: errorTagsDetected.length ? errorTagsDetected : undefined,
    examinerHints,
    conceptCoverage,
  };
}

/**
 * Converts evaluation + hint usage into your learning statuses.
 * You can map this to your existing progress storage (correct / assisted / wrong / inProgress).
 */
export function mapEvaluationToStatus(args: {
  hasAnyInput: boolean;
  passed: boolean;
  usedHelp: boolean;
}): "correct" | "assisted" | "wrong" | "inProgress" {
  const { hasAnyInput, passed, usedHelp } = args;

  if (!hasAnyInput) return "inProgress";
  if (passed) return usedHelp ? "assisted" : "correct";
  return "wrong";
}
