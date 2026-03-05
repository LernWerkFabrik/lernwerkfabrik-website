// lib/content/index.ts

import fs from "fs";
import path from "path";
import { IM_CURRICULUM, type ExamRelevance } from "../curriculum";
import type { Module, ModuleMeta } from "./types";

/* ------------------------------------------------------------------ */
/* Paths                                                              */
/* ------------------------------------------------------------------ */

const CONTENT_ROOT = path.join(process.cwd(), "content", "modules");

const AP_MODULE_LEVEL: Record<string, "AP1" | "AP2"> = {
  "ap1-arbeitsaufgaben": "AP1",
  "ap1-rechen-fachaufgaben": "AP1",
  "ap2-situationsaufgaben": "AP2",
  "ap2-systemaufgaben": "AP2",
};

const AP_MODULE_IDS = new Set(Object.keys(AP_MODULE_LEVEL));

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readOptionalFile(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function resolveMaybeRelative(baseDir: string, p?: string): string | undefined {
  if (!p) return undefined;
  return path.isAbsolute(p) ? p : path.join(baseDir, p);
}

function normalizeQuestionArray(raw: any, filePath: string): any[] | null {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    const rootExamMeta =
      raw.examMeta && typeof raw.examMeta === "object"
        ? { ...(raw.examMeta as Record<string, unknown>) }
        : raw.meta && typeof raw.meta === "object"
        ? { ...(raw.meta as Record<string, unknown>) }
        : null;

    const attachRootExamMeta = (arr: any[]) => {
      if (!rootExamMeta) return arr;
      return arr.map((q) =>
        q && typeof q === "object"
          ? { ...q, examMeta: (q as any).examMeta ?? rootExamMeta }
          : q
      );
    };

    const blocks = (raw as any).blocks;
    if (Array.isArray(blocks)) {
      const flattened = blocks.flatMap((b: any) =>
        Array.isArray(b?.tasks) ? b.tasks : []
      );
      if (flattened.length > 0) return attachRootExamMeta(flattened);
    }

    // Allow single-question JSON object as fallback.
    if (
      typeof (raw as any).id === "string" &&
      typeof (raw as any).prompt === "string"
    ) {
      return [raw];
    }

    const candidate =
      (raw as any).questions ?? (raw as any).items ?? (raw as any).tasks;
    if (Array.isArray(candidate)) return attachRootExamMeta(candidate);
  }

  console.error(`Invalid questions format in ${filePath}`);
  return null;
}

function isPlaceholderQuestion(q: any): boolean {
  const prompt = String(q?.prompt ?? "").toLowerCase();
  const solution = String(q?.solution ?? "").toLowerCase();
  if (prompt.includes("platzhalter-aufgabe")) return true;
  if (solution.includes("platzhalter-l")) return true;
  return false;
}

function isNumericQuestion(q: any): boolean {
  return (
    typeof q?.answer?.value === "number" &&
    Number.isFinite(q.answer.value) &&
    typeof q?.answer?.unit === "string"
  );
}

function inferQuestionType(q: any): string {
  const t = String(q?.type ?? "").trim();
  if (t) return t;
  return isNumericQuestion(q) ? "numeric" : "unknown";
}

function isRelevantForApLevel(
  relevance: ExamRelevance | undefined,
  level: "AP1" | "AP2"
): boolean {
  if (!relevance) return false;
  if (relevance === "AP1_AP2") return true;
  return relevance === level;
}

/* ------------------------------------------------------------------ */
/* Meta loading / validation                                          */
/* ------------------------------------------------------------------ */

export function getModuleMeta(moduleId: string): ModuleMeta {
  const moduleDir = path.join(CONTENT_ROOT, moduleId);
  const metaPath = path.join(moduleDir, "module.json");

  assert(fs.existsSync(metaPath), `module.json fehlt für Modul ${moduleId}`);

  const meta = readJson<ModuleMeta>(metaPath);

  assert(meta.id === moduleId, `Modul-ID stimmt nicht: ${moduleId}`);
  assert(meta.title, `Modul ${moduleId} hat keinen Titel`);
  assert(meta.kind, `Modul ${moduleId} hat kein 'kind' (learn | prep | exam)`);

  if (meta.kind === "exam") {
    assert(
      meta.exam?.durationMinutes,
      `Exam-Modul ${moduleId} benötigt exam.durationMinutes`
    );
  }

  return meta;
}

/* ------------------------------------------------------------------ */
/* Backwards-compatible helpers                                       */
/* ------------------------------------------------------------------ */

export type MarkdownSlug =
  | "explanation"
  | "symbols"
  | "workflow"
  | "comparison"
  | "formulas"
  | "example";

export type QuestionSet = "practice" | "exam";

function getQuestionsFilePath(moduleId: string, which: QuestionSet): string | null {
  const meta = getModuleMeta(moduleId);
  const moduleDir = path.join(CONTENT_ROOT, moduleId);
  const files = (meta as any).files ?? {};

  const rawPath =
    which === "practice"
      ? files.practiceQuestions ?? "questions.practice.json"
      : files.examQuestions ?? "questions.exam.json";

  return resolveMaybeRelative(moduleDir, rawPath) ?? null;
}

function readQuestionsArrayForModule(
  moduleId: string,
  which: QuestionSet
): any[] | null {
  try {
    const filePath = getQuestionsFilePath(moduleId, which);
    if (!filePath || !fs.existsSync(filePath)) return null;

    const raw = readJson<any>(filePath);
    return normalizeQuestionArray(raw, filePath);
  } catch (error) {
    console.error(`Questions for module '${moduleId}' could not be read.`, error);
    return null;
  }
}

function getSupplementModuleIdsForAp(level: "AP1" | "AP2"): string[] {
  return Object.keys(IM_CURRICULUM.moduleMeta)
    .filter((moduleId) => !AP_MODULE_IDS.has(moduleId))
    .filter((moduleId) => {
      const rel = IM_CURRICULUM.moduleMeta[moduleId]?.exam;
      return isRelevantForApLevel(rel, level);
    })
    .sort((a, b) => a.localeCompare(b));
}

function withCentralMeta(
  q: any,
  sourceModuleId: string,
  level: "AP1" | "AP2",
  which: QuestionSet
): any {
  const baseMeta = q?.meta && typeof q.meta === "object" ? { ...q.meta } : {};

  return {
    ...q,
    meta: {
      ...baseMeta,
      ap: baseMeta.ap ?? level,
      apLevel: baseMeta.apLevel ?? level,
      module: baseMeta.module ?? sourceModuleId,
      sourceModuleId: baseMeta.sourceModuleId ?? sourceModuleId,
      questionType: baseMeta.questionType ?? inferQuestionType(q),
      competence: baseMeta.competence ?? baseMeta.topic ?? "mixed",
      bank: baseMeta.bank ?? "central",
      set: baseMeta.set ?? which,
    },
  };
}

function toExamQuestion(
  q: any,
  sourceModuleId: string,
  level: "AP1" | "AP2"
): any | null {
  if (!isNumericQuestion(q)) return null;
  if (isPlaceholderQuestion(q)) return null;

  const baseId = String(q?.id ?? "").trim();
  if (!baseId) return null;

  const prompt = String(q?.prompt ?? "").trim();
  if (!prompt) return null;

  const examQuestion = {
    id: baseId,
    practiceId: String(q?.practiceId ?? q?.id ?? "").trim() || baseId,
    prompt,
    answer: {
      value: Number(q.answer.value),
      unit: String(q.answer.unit ?? "").trim(),
    },
    tolerance: typeof q?.tolerance === "number" ? q.tolerance : undefined,
    input: q?.input && typeof q.input === "object" ? { ...q.input } : undefined,
    meta: q?.meta && typeof q.meta === "object" ? { ...q.meta } : undefined,
  };

  return withCentralMeta(examQuestion, sourceModuleId, level, "exam");
}

function buildApSupplements(targetModuleId: string, which: QuestionSet): any[] {
  const level = AP_MODULE_LEVEL[targetModuleId];
  if (!level) return [];

  const sourceIds = getSupplementModuleIdsForAp(level);
  const out: any[] = [];
  const seenSourceAndId = new Set<string>();

  if (which === "practice") {
    for (const sourceModuleId of sourceIds) {
      const sourceQuestions =
        readQuestionsArrayForModule(sourceModuleId, "practice") ?? [];

      for (const raw of sourceQuestions) {
        if (!raw || typeof raw !== "object") continue;
        if (isPlaceholderQuestion(raw)) continue;

        const rawId = String((raw as any).id ?? "").trim();
        if (!rawId) continue;

        const key = `${sourceModuleId}::${rawId}`;
        if (seenSourceAndId.has(key)) continue;
        seenSourceAndId.add(key);

        out.push(withCentralMeta({ ...(raw as any) }, sourceModuleId, level, which));
      }
    }

    return out;
  }

  // exam: prefer exam questions, then fallback to numeric practice questions.
  for (const sourceModuleId of sourceIds) {
    const sourceExam = readQuestionsArrayForModule(sourceModuleId, "exam") ?? [];
    for (const raw of sourceExam) {
      const candidate = toExamQuestion(raw, sourceModuleId, level);
      if (!candidate) continue;

      const key = `${sourceModuleId}::${candidate.id}`;
      if (seenSourceAndId.has(key)) continue;
      seenSourceAndId.add(key);

      out.push(candidate);
    }
  }

  for (const sourceModuleId of sourceIds) {
    const sourcePractice =
      readQuestionsArrayForModule(sourceModuleId, "practice") ?? [];

    for (const raw of sourcePractice) {
      const candidate = toExamQuestion(raw, sourceModuleId, level);
      if (!candidate) continue;

      const key = `${sourceModuleId}::${candidate.id}`;
      if (seenSourceAndId.has(key)) continue;
      seenSourceAndId.add(key);

      out.push(candidate);
    }
  }

  return out;
}

function mergeWithoutDeleting(base: any[], supplements: any[]): any[] {
  if (!supplements.length) return base;

  const merged = [...base];
  const usedIds = new Set(
    merged
      .map((q) => String((q as any)?.id ?? "").trim())
      .filter(Boolean)
  );

  for (const raw of supplements) {
    if (!raw || typeof raw !== "object") continue;

    const sourceModuleId = String((raw as any)?.meta?.sourceModuleId ?? "bank")
      .trim()
      .replace(/\s+/g, "-");

    const originalId = String((raw as any)?.id ?? "").trim() || "q";
    let nextId = originalId;

    if (usedIds.has(nextId)) {
      nextId = `${sourceModuleId}__${originalId}`;
    }

    let suffix = 2;
    while (usedIds.has(nextId)) {
      nextId = `${sourceModuleId}__${originalId}__${suffix}`;
      suffix += 1;
    }

    const next = { ...(raw as any), id: nextId };
    merged.push(next);
    usedIds.add(nextId);
  }

  return merged;
}

export async function getMarkdown(
  moduleId: string,
  slug: MarkdownSlug
): Promise<string | null> {
  const meta = getModuleMeta(moduleId);
  const moduleDir = path.join(CONTENT_ROOT, moduleId);

  const files = (meta as any).files ?? {};

  const rawPath =
    slug === "explanation"
      ? files.explanation ?? "explanation.md"
      : slug === "symbols"
      ? files.symbols ?? "symbols.md"
      : slug === "workflow"
      ? files.workflow ?? "workflow.md"
      : slug === "comparison"
      ? files.comparison ?? "comparison.md"
      : slug === "formulas"
      ? files.formulas ?? "formulas.md"
      : files.example ?? "example.md";

  const filePath = resolveMaybeRelative(moduleDir, rawPath)!;
  const md = readOptionalFile(filePath);
  return md ?? null;
}

export async function getQuestions(
  moduleId: string,
  which: QuestionSet
): Promise<any[] | null> {
  const own = readQuestionsArrayForModule(moduleId, which);
  if (!own) return null;

  const supplements = buildApSupplements(moduleId, which);
  const isApModule = Boolean(AP_MODULE_LEVEL[moduleId]);

  // AP1 Arbeitsaufgaben keeps own fixed pools:
  // - practice: 25 guided tasks
  // - exam: competency-check set
  // Do not auto-extend with cross-module supplements.
  if (moduleId === "ap1-arbeitsaufgaben") {
    const nonPlaceholder = own.filter((q) => !isPlaceholderQuestion(q));
    const placeholders = own.filter((q) => isPlaceholderQuestion(q));
    return [...nonPlaceholder, ...placeholders];
  }

  // Exam simulators should stay realistic in length.
  if (which === "exam" && isApModule) {
    const minTarget = 20;
    const effectiveOwnCount = own.filter((q) => !isPlaceholderQuestion(q)).length;
    const needed = Math.max(0, minTarget - effectiveOwnCount);
    const limitedSupplements = needed > 0 ? supplements.slice(0, needed) : [];
    const merged = mergeWithoutDeleting(own, limitedSupplements);
    const nonPlaceholder = merged.filter((q) => !isPlaceholderQuestion(q));
    const placeholders = merged.filter((q) => isPlaceholderQuestion(q));
    return [...nonPlaceholder, ...placeholders];
  }

  if (which === "practice" && isApModule) {
    // Keep AP practice payload bounded, but still add many matching questions.
    const maxTarget = 90;
    const effectiveOwnCount = own.filter((q) => !isPlaceholderQuestion(q)).length;
    const needed = Math.max(0, maxTarget - effectiveOwnCount);
    const limitedSupplements = needed > 0 ? supplements.slice(0, needed) : [];
    const merged = mergeWithoutDeleting(own, limitedSupplements);
    const nonPlaceholder = merged.filter((q) => !isPlaceholderQuestion(q));
    const placeholders = merged.filter((q) => isPlaceholderQuestion(q));
    return [...nonPlaceholder, ...placeholders];
  }

  const merged = mergeWithoutDeleting(own, supplements);
  if (!isApModule) return merged;

  const nonPlaceholder = merged.filter((q) => !isPlaceholderQuestion(q));
  const placeholders = merged.filter((q) => isPlaceholderQuestion(q));
  return [...nonPlaceholder, ...placeholders];
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export async function listModules(): Promise<ModuleMeta[]> {
  const entries = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });

  const modules: ModuleMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    try {
      const meta = getModuleMeta(entry.name);
      modules.push(meta);
    } catch (err) {
      console.error(`Modul ${entry.name} ignoriert:`, err);
    }
  }

  return modules;
}

export async function loadModule(moduleId: string): Promise<Module> {
  const meta = getModuleMeta(moduleId);
  const moduleDir = path.join(CONTENT_ROOT, moduleId);

  const files = meta.files ?? {};

  const explanationPath =
    files.explanation ?? path.join(moduleDir, "explanation.md");

  const symbolsPath = files.symbols ?? path.join(moduleDir, "symbols.md");

  const workflowPath = files.workflow ?? path.join(moduleDir, "workflow.md");

  const comparisonPath =
    files.comparison ?? path.join(moduleDir, "comparison.md");

  const examplePath = files.example ?? path.join(moduleDir, "example.md");

  const formulasPath = files.formulas ?? path.join(moduleDir, "formulas.md");

  const [practiceQuestions, examQuestions] = await Promise.all([
    getQuestions(moduleId, "practice"),
    getQuestions(moduleId, "exam"),
  ]);

  const module: Module = {
    ...meta,

    explanation: readOptionalFile(explanationPath),
    symbols: readOptionalFile(symbolsPath),
    workflow: readOptionalFile(workflowPath),
    comparison: readOptionalFile(comparisonPath),
    example: readOptionalFile(examplePath),
    formulas: readOptionalFile(formulasPath),

    questions: {
      practice: practiceQuestions ?? undefined,
      exam: examQuestions ?? undefined,
    },
  };

  if (meta.kind === "exam") {
    assert(
      module.questions?.exam && module.questions.exam.length > 0,
      `Exam-Modul ${moduleId} hat keine Prüfungsfragen`
    );
  }

  return module;
}
