"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { hydrateQuestions, type AnyQuestion, type HydratedQuestion } from "@/lib/questionGenerator";
import { getOrCreateRun, resetRun, type RunState } from "@/lib/runStorage";

import { consumeFreeRun, getFreeLimitInfo, isFreeAllowedLearnModule } from "@/lib/freeLimits";

import { learnKeys } from "./storage";
import { normalizeInputSpec, normalizeUnit, parseNumber } from "./utils";
import { evaluateStructuredTextTask, mapEvaluationToStatus } from "@/lib/learn/textEvaluation";
import type {
  AttemptsById,
  CheckedById,
  DirtyById,
  Draft,
  DraftById,
  FirstCorrectQualityById,
  HydratedLikeQuestion,
  InputSpec,
  LearnFeedback,
  SolutionSeenById,
  StatusById,
} from "./types";

type QuestionInputCarrier = AnyQuestion & { input?: InputSpec };

const PRACTICE_COUNT = 25;
const RUN_KEY_PREFIX = "lp:run:";
const CHECK_FEEDBACK_HOLD_MS = 1200;

export type AccessTier = "guest" | "free" | "pro";

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

function shuffleBySeed<T>(list: T[], seed: number): T[] {
  if (list.length <= 1) return list;
  const out = [...list];
  const rng = mulberry32(seed >>> 0);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function getExplicitDifficulty(q: unknown): number | null {
  const raw = (q as any)?.meta?.difficulty ?? (q as any)?.difficulty;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function getGeneratedDifficulty(q: unknown): number | null {
  const n = Number((q as any)?._difficulty);
  if (!Number.isFinite(n)) return null;
  return n;
}

function orderQuestionsForRun<T>(list: T[], seed: number): T[] {
  if (list.length <= 1) return list;

  const entries = list.map((q, idx) => ({
    q,
    idx,
    explicitDifficulty: getExplicitDifficulty(q),
    generatedDifficulty: getGeneratedDifficulty(q),
  }));

  const hasExplicitDifficulty = entries.some((e) => e.explicitDifficulty != null);
  if (hasExplicitDifficulty) {
    const rng = mulberry32(seed >>> 0);
    return entries
      .map((e) => ({
        ...e,
        bucket: e.explicitDifficulty ?? Number.MAX_SAFE_INTEGER,
        tie: rng(),
      }))
      .sort((a, b) => a.bucket - b.bucket || a.tie - b.tie || a.idx - b.idx)
      .map((e) => e.q);
  }

  const hasGeneratedDifficulty = entries.some((e) => e.generatedDifficulty != null);
  if (hasGeneratedDifficulty) {
    return entries
      .sort(
        (a, b) =>
          (a.generatedDifficulty ?? Number.MAX_SAFE_INTEGER) -
            (b.generatedDifficulty ?? Number.MAX_SAFE_INTEGER) ||
          a.idx - b.idx
      )
      .map((e) => e.q);
  }

  return shuffleBySeed(list, seed);
}

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

function hasExistingRun(moduleId: string): boolean {
  if (typeof window === "undefined") return true; // SSR: don't block
  try {
    return Boolean(localStorage.getItem(`${RUN_KEY_PREFIX}${moduleId}`));
  } catch {
    return true;
  }
}

function computeFreeGate(tier: AccessTier, moduleId: string) {
  const info = getFreeLimitInfo(moduleId);

  if (tier !== "free") {
    return {
      tier,
      active: false,
      blocked: false,
      reason: null as string | null,
      info,
    };
  }

  if (!info.allowed) {
    return {
      tier,
      active: true,
      blocked: true,
      reason: "Dieses Lernmodul ist im Free-Plan nicht freigeschaltet.",
      info,
    };
  }

  if (info.remaining <= 0) {
    return {
      tier,
      active: true,
      blocked: true,
      reason: "Dein Free-Limit fuer dieses Modul ist aufgebraucht.",
      info,
    };
  }

  return {
    tier,
    active: true,
    blocked: false,
    reason: null as string | null,
    info,
  };
}

export function useLearnController(args: {
  moduleId: string;
  questions: AnyQuestion[];
  filterIds?: string[] | null;
  autoNext?: boolean;
  nextErrorMode?: boolean;
  tier?: AccessTier;
}) {
  const {
    moduleId,
    questions,
    filterIds,
    autoNext = true,
    nextErrorMode = true,
    tier = "pro",
  } = args;

  const keys = learnKeys(moduleId);
  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Merkt sich, welche Aufgabe zuletzt aktiv war (fÃƒÆ’Ã‚Â¼r Refresh / "weiter machen")
  const activeScope = useMemo(() => {
    if (!filterIds?.length) return "all";
    return `f:${filterIds.join("|")}`;
  }, [filterIds]);
  const activeKey = useMemo(() => `lp:learn:active:${moduleId}:${activeScope}`, [moduleId, activeScope]);

  // ---------------------------
  // Free limit gate
  // ---------------------------
  const [freeGate, setFreeGate] = useState(() => computeFreeGate(tier, moduleId));

  useEffect(() => {
    setFreeGate(computeFreeGate(tier, moduleId));
  }, [tier, moduleId]);

  // ---------------------------
  // Run/seed & question hydration
  // ---------------------------
  const [run, setRun] = useState<RunState>(() => ({
    seed: 0,
    createdAt: 0,
    updatedAt: 0,
  }));

  useEffect(() => {
    setRun(getOrCreateRun(moduleId));
  }, [moduleId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (tier !== "free") return;

    if (!isFreeAllowedLearnModule(moduleId)) {
      setFreeGate(computeFreeGate(tier, moduleId));
      return;
    }

    const existed = hasExistingRun(moduleId);
    if (existed) return;

    const consumed = consumeFreeRun(moduleId);
    setFreeGate(computeFreeGate(tier, moduleId));
    void consumed;
  }, [tier, moduleId]);

  const hydrated = useMemo(() => {
    const inputCarriers = (questions as QuestionInputCarrier[]).map((q) => {
      const spec = normalizeInputSpec(q.input);
      return { ...q, input: spec };
    });

    const out = hydrateQuestions(inputCarriers, run.seed) as HydratedQuestion[];

    return out.map((q) => {
      const carrier = inputCarriers.find((x) => x.id === q.id);
      const input = carrier?.input ? normalizeInputSpec(carrier.input) : normalizeInputSpec(undefined);

      return {
        ...q,
        tolerance: typeof (q as any).tolerance === "number" ? (q as any).tolerance : undefined,
        solution: (q as any).solution,
        input,
      } as HydratedLikeQuestion;
    });
  }, [questions, run.seed]);

  const orderedHydrated = useMemo(() => orderQuestionsForRun(hydrated, run.seed), [hydrated, run.seed]);
  const capped = useMemo(() => orderedHydrated.slice(0, PRACTICE_COUNT), [orderedHydrated]);

  const isFiltered = Boolean(filterIds?.length);
  const qs = useMemo(() => {
    if (!filterIds?.length) return capped;
    const set = new Set(filterIds);
    return capped.filter((q) => set.has(q.id));
  }, [capped, filterIds]);

  const qIds = useMemo(() => qs.map((q) => q.id), [qs]);

  // ---------------------------
  // Persistent state
  // ---------------------------
  const [statusById, setStatusById] = useState<StatusById>(() => safeRead(keys.progress, {}));
  const [draftById, setDraftById] = useState<DraftById>(() => safeRead(keys.drafts, {}));
  const [checkedById, setCheckedById] = useState<CheckedById>(() => safeRead(keys.checked, {}));
  const [dirtyById, setDirtyById] = useState<DirtyById>(() => safeRead(keys.dirty, {}));
  const [attemptsById, setAttemptsById] = useState<AttemptsById>(() => safeRead(keys.attempts, {}));
  const [solutionSeenById, setSolutionSeenById] = useState<SolutionSeenById>(() => safeRead(keys.solutionSeen, {}));
  const [firstCorrectQualityById, setFirstCorrectQualityById] = useState<FirstCorrectQualityById>(() =>
    safeRead(keys.firstCorrectQuality, {})
  );

  const tipsSeenKey = (keys as any).tipsSeen ?? `lp:learn:tipsSeen:${moduleId}`;
  const [tipsSeenById, setTipsSeenById] = useState<Record<string, boolean>>(() => safeRead(tipsSeenKey, {}));

  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Prep-Metadaten: Fehlermuster pro Aufgabe (rein additiv, kein Einfluss auf Status/Punkte)
  const errorTagsKey = `lp:learn:errorTags:${moduleId}`;
  const [errorTagsById, setErrorTagsById] = useState<Record<string, string[]>>(() => safeRead(errorTagsKey, {}));

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(activeKey);
      const parsed = raw ? Number(raw) : 0;
      if (!Number.isFinite(parsed)) return;
      const maxIndex = Math.max(0, qs.length - 1);
      const next = Math.max(0, Math.min(maxIndex, parsed));
      setIndex((prev) => (prev === next ? prev : next));
    } catch {
      // ignore
    }
  }, [activeKey, qs.length]);

  const current = qs[index] ?? null;
  const activeId = current?.id ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(activeKey, String(index));
    } catch {
      // ignore
    }
  }, [activeKey, index]);

  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(current?.answer?.unit ?? "");
    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ FÃƒÆ’Ã‚Â¼r structured_text (Vorbereitung): mehrere Textfelder
  const [textFields, setTextFields] = useState<Record<string, string>>({});
  const textFieldsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    textFieldsRef.current = textFields;
  }, [textFields]);

  const [feedback, setFeedback] = useState<LearnFeedback>(null);
  const [showSolution, setShowSolution] = useState(false);

  const valueRef = useRef<string>("");
  const unitRef = useRef<string>("");
  const activeIdRef = useRef<string | null>(null);
  const draftRef = useRef<DraftById>(draftById);
  const isSyncingRef = useRef(false);
  const pendingAutoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearPendingAutoNext() {
    if (!pendingAutoNextTimerRef.current) return;
    clearTimeout(pendingAutoNextTimerRef.current);
    pendingAutoNextTimerRef.current = null;
  }

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    return () => {
      clearPendingAutoNext();
    };
  }, []);


  useEffect(() => {
    draftRef.current = draftById;
  }, [draftById]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    unitRef.current = unit;
  }, [unit]);

  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Beim Laden: Draft und Default-Unit sauber mergen (Default darf nicht verschwinden)
  useEffect(() => {
    if (!current) return;

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ wÃƒÆ’Ã‚Â¤hrend wir state/refs fÃƒÆ’Ã‚Â¼r die neue Aufgabe setzen,
    // ignorieren wir alle onChange Events aus UI-Komponenten
    isSyncingRef.current = true;

    const d = draftById[current.id];
    const nextValue = d?.value ?? "";

    const defaultUnitRaw = (current?.answer?.unit ?? "").trim();
    const draftUnitRaw = (d?.unit ?? "").trim();

    // Bei fester Soll-Einheit immer die Soll-Einheit verwenden (kein versteckter Draft).
    const nextUnit = defaultUnitRaw.length > 0 ? defaultUnitRaw : draftUnitRaw;

    setValue(nextValue);
    setUnit(nextUnit);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ refs sofort synchron setzen (damit Equality-Guards funktionieren)
    valueRef.current = nextValue;
    unitRef.current = nextUnit;

        // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Draft-Textfelder laden:
    // - structured_text: nur definierte Keys mergen (stabil gegen Content-ÃƒÆ’Ã¢â‚¬Å¾nderungen)
    // - alle anderen non-numeric: Draft vollstÃƒÆ’Ã‚Â¤ndig ÃƒÆ’Ã‚Â¼bernehmen (choice/multi/order/match etc.)
    const nextTextFields = (() => {
      const prev = ((d as any)?.textFields ?? {}) as Record<string, string>;
      const fields = (current as any)?.answer?.fields;

      if (!Array.isArray(fields)) return prev;

      const out: Record<string, string> = {};
      for (const f of fields) {
        out[f.key] = String(prev?.[f.key] ?? "");
      }
      return out;
    })();

    setTextFields(nextTextFields);
    textFieldsRef.current = nextTextFields;


    setFeedback(null);
    setShowSolution(false);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Sync-Phase erst nach dem Render beenden
    // (sonst kÃƒÆ’Ã‚Â¶nnen Controls beim Mount sofort onChange feuern)
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, [current?.id, current?.answer?.unit, run.seed]); // eslint-disable-line react-hooks/exhaustive-deps


  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Repair: Wenn Aufgaben "checked" sind, aber der Status nach Reload fehlt,
  // rekonstruieren wir ihn aus Draft (value/unit) + Default-Unit.
  // Dadurch bleibt alles wie verlassen ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ ohne "Falsch" GeisterzÃƒÆ’Ã‚Â¤hlung.
  const repairedForRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (!run.createdAt) return;
    if (isFiltered) return;
    if (!qs.length) return;

    const runKey = `${moduleId}:${run.seed}`;
    if (repairedForRunRef.current === runKey) return;

    let changed = false;
    const nextStatus: StatusById = { ...statusById };
    const nextChecked: CheckedById = { ...checkedById };

    for (const q of qs) {
      const id = q.id;
      if (!nextChecked[id]) continue;

      // wenn status bereits korrekt ist: nichts tun
      if (nextStatus[id] === "correct") continue;

      const d = draftById[id];
      const valueTrim = (d?.value ?? "").trim();

      // Unit: wenn Draft keine Unit speichert, nehmen wir Default aus der Aufgabe
      const unitRaw = (d?.unit ?? "").trim();
      const unitMerged = (q.answer.unit ?? "").trim().length > 0 ? (q.answer.unit ?? "") : unitRaw;

      // Wenn gar kein Wert eingetragen ist, war das ein "Geister-Check" ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ checked entfernen
      if (valueTrim.length === 0 && (attemptsById[id] ?? 0) <= 0) {
        delete nextChecked[id];
        changed = true;
        continue;
      }

      // Re-evaluate: ist die gespeicherte Eingabe korrekt?
      const num = parseNumber(valueTrim);
      const expectedUnitNorm = normalizeUnit((q as any)?.answer?.unit ?? "");
      const unitNorm = normalizeUnit(unitMerged);
      const unitOk = expectedUnitNorm.length === 0 ? true : unitNorm === expectedUnitNorm;

      const tolerance = typeof (q as any).tolerance === "number" ? (q as any).tolerance : 0;
      const valueOk = Number.isFinite(num) && Math.abs(num - q.answer.value) <= tolerance;

      if (valueOk && unitOk) {
        nextStatus[id] = "correct";
        changed = true;
        continue;
      }

      // Checked + nicht korrekt => mindestens "attempted" setzen.
      // Das stabilisiert Reloads auch bei ÃƒÆ’Ã‚Â¤lteren/inkonsistenten Storage-StÃƒÆ’Ã‚Â¤nden.
      if (nextStatus[id] !== "attempted") {
        nextStatus[id] = "attempted";
        changed = true;
      }
    }

    repairedForRunRef.current = runKey;

    if (changed) {
      setCheckedById(nextChecked);
      setStatusById(nextStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, run.createdAt, run.seed, qs.length, isFiltered]);

  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Einmalige Bereinigung: "checked" ohne sinnvollen Input (Geister-FalschzÃƒÆ’Ã‚Â¤hlungen)
  // Wir lÃƒÆ’Ã‚Â¶schen NICHT deinen echten Fortschritt, sondern nur unplausible EintrÃƒÆ’Ã‚Â¤ge,
  // die durch frÃƒÆ’Ã‚Â¼here Auto-Unit/Batch-Checks entstehen konnten.
  const ghostCleanupForRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (!run.createdAt) return;
    if (isFiltered) return;
    if (!qs.length) return;

    const runKey = `${moduleId}:${run.seed}`;
    if (ghostCleanupForRunRef.current === runKey) return;

    let changed = false;

    const nextChecked = { ...checkedById };
    const nextAttempts = { ...attemptsById };
    const nextStatus = { ...statusById };
    const nextDirty = { ...dirtyById };

    for (const q of qs) {
      const id = q.id;
      if (!nextChecked[id]) continue;

      const d = draftRef.current[id] ?? draftById[id];
      const valueTrim = (d?.value ?? "").trim();

      const expectedUnitNorm = normalizeUnit((q as any)?.answer?.unit ?? "");
      const unitNorm = normalizeUnit(d?.unit ?? "");

      const hasMeaningfulUnit = expectedUnitNorm.length === 0 ? unitNorm.length > 0 : false;

      const hasMeaningfulInput = valueTrim.length > 0 || hasMeaningfulUnit;

      // Nur entfernen, wenn nicht "correct" (korrekte Aufgaben lassen wir unangetastet)
      if (!hasMeaningfulInput && nextStatus[id] !== "correct" && (nextAttempts[id] ?? 0) <= 0) {
        delete nextChecked[id];
        delete nextAttempts[id];
        delete nextDirty[id];
        delete nextStatus[id];
        changed = true;
      }
    }

    ghostCleanupForRunRef.current = runKey;

    if (changed) {
      setCheckedById(nextChecked);
      setAttemptsById(nextAttempts);
      setDirtyById(nextDirty);
      setStatusById(nextStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, run.createdAt, run.seed, qs.length, isFiltered]);

  useEffect(() => safeWrite(keys.progress, statusById), [keys.progress, statusById]);
  useEffect(() => safeWrite(keys.drafts, draftById), [keys.drafts, draftById]);
  useEffect(() => safeWrite(keys.checked, checkedById), [keys.checked, checkedById]);
  useEffect(() => safeWrite(keys.dirty, dirtyById), [keys.dirty, dirtyById]);
  useEffect(() => safeWrite(keys.attempts, attemptsById), [keys.attempts, attemptsById]);
  useEffect(() => safeWrite(keys.solutionSeen, solutionSeenById), [keys.solutionSeen, solutionSeenById]);
  useEffect(() => safeWrite(keys.firstCorrectQuality, firstCorrectQualityById), [
    keys.firstCorrectQuality,
    firstCorrectQualityById,
  ]);
  useEffect(() => safeWrite(tipsSeenKey, tipsSeenById), [tipsSeenKey, tipsSeenById]);
  useEffect(() => safeWrite(errorTagsKey, errorTagsById), [errorTagsKey, errorTagsById]);

  // ---------------------------
  // Derived
  // ---------------------------
  const solutionUnlocked = useMemo(() => {
    return Boolean(current?.solution);
  }, [current?.solution]);

  const redCheckedWrongCount = useMemo(() => {
    const ids = new Set(qIds);
    return Object.entries(checkedById).filter(([id, checked]) => {
      if (!checked) return false;
      if (!ids.has(id)) return false;
      return statusById[id] !== "correct";
    }).length;
  }, [checkedById, statusById, qIds]);

  const checkedCount = useMemo(() => {
    const ids = new Set(qIds);
    return Object.entries(checkedById).filter(([id, checked]) => checked && ids.has(id)).length;
  }, [checkedById, qIds]);

  const correctCount = useMemo(() => {
    const ids = new Set(qIds);
    return Object.entries(statusById).filter(([id, s]) => s === "correct" && ids.has(id)).length;
  }, [statusById, qIds]);

  const attemptedNotCheckedCount = useMemo(() => {
    const ids = new Set(qIds);
    return qIds.filter((id) => ids.has(id) && statusById[id] === "attempted" && !checkedById[id]).length;
  }, [qIds, statusById, checkedById]);

  const isAllCorrect = useMemo(() => correctCount >= qs.length && qs.length > 0, [correctCount, qs.length]);

  // ---------------------------
  // Helpers/actions
  // ---------------------------
  function persistDraft(id: string, v: string, u: string) {
    const q = qs.find((x) => x.id === id);

    const valueTrim = (v ?? "").trim();
    const unitRaw = (u ?? "").trim();

    const expectedUnitNorm = normalizeUnit(q?.answer?.unit ?? "");

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Default-Unit nicht als Draft speichern (sonst entstehen "Geister-Bearbeitungen")
    // Feste Soll-Einheit wird nicht im Draft gespeichert (UI ist read-only).
    const unitToStore = expectedUnitNorm.length > 0 ? "" : unitRaw;

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Wenn beides leer ist: Draft entfernen (damit Reload wirklich "wie verlassen" ist)
    if (valueTrim.length === 0 && unitToStore.length === 0) {
      draftRef.current = { ...draftRef.current };
      delete draftRef.current[id];

      setDraftById((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });

      return;
    }

        const prevDraft = (draftRef.current[id] as any) ?? {};
    const nextDraft: Draft = { ...prevDraft, value: v ?? "", unit: unitToStore } as any;


    draftRef.current = { ...draftRef.current, [id]: nextDraft };
    setDraftById((prev) => ({ ...prev, [id]: nextDraft }));
  }

  function persistTextFieldsDraft(id: string, fields: Record<string, string>) {
    const q = qs.find((x) => x.id === id);

    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields ?? {})) cleaned[k] = String(v ?? "");

    const hasAnyText = Object.values(cleaned).some((v) => v.trim().length > 0);

    const prevDraft = (draftRef.current[id] as any) ?? {};
    const valueTrim = String(prevDraft?.value ?? "").trim();
    const unitTrim = String(prevDraft?.unit ?? "").trim();

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Wenn wirklich gar nichts vorhanden ist: Draft entfernen
    if (!hasAnyText && valueTrim.length === 0 && unitTrim.length === 0) {
      draftRef.current = { ...draftRef.current };
      delete (draftRef.current as any)[id];

      setDraftById((prev) => {
        if (!(prev as any)[id]) return prev;
        const next = { ...(prev as any) };
        delete (next as any)[id];
        return next;
      });

      return;
    }

    const nextDraft: Draft = { ...prevDraft, textFields: cleaned } as any;

    draftRef.current = { ...draftRef.current, [id]: nextDraft };
    setDraftById((prev) => ({ ...prev, [id]: nextDraft }));
  }

  function isMeaningfulText(fields: Record<string, string>) {
    return Object.values(fields ?? {}).some((v) => String(v ?? "").trim().length > 0);
  }



  function markDirty(id: string) {
    setDirtyById((prev) => ({ ...prev, [id]: true }));
  }

  function clearDirty(id: string) {
    setDirtyById((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function finalizeOnLeave(id?: string | null) {
    if (!id) return;

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Navigation darf niemals korrekte Aufgaben ÃƒÆ’Ã‚Â¤ndern
    if (statusById[id] === "correct") {
      clearDirty(id);
      return;
    }

    const q = qs.find((x) => x.id === id);
    if (!q) return;

    // Wir prÃƒÆ’Ã‚Â¼fen NUR den gespeicherten Draft dieser Aufgabe (nicht valueRef/unitRef),
    // weil refs beim Rumklicken sonst "falschen Input" vortÃƒÆ’Ã‚Â¤uschen kÃƒÆ’Ã‚Â¶nnen.
    const d = draftRef.current[id];

    const valueTrim = (d?.value ?? "").trim();
    const draftUnitRaw = (d?.unit ?? "").trim();

    const expectedUnitNorm = normalizeUnit((q as any)?.answer?.unit ?? "");
    const unitNorm = normalizeUnit(draftUnitRaw);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ "Meaningful input" = Wert eingetippt ODER Unit wirklich abweichend von Default
    const hasMeaningfulUnit = expectedUnitNorm.length === 0 ? unitNorm.length > 0 : false;

    const hasAnyInput = valueTrim.length > 0 || hasMeaningfulUnit;

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Nur dann "attempted" setzen.
    if (hasAnyInput) {
      setStatusById((prev) => {
        if (prev[id] === "correct") return prev;
        return { ...prev, [id]: "attempted" };
      });
    }

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ dirty ist nur ein UI-Editing-Flag ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ beim Verlassen immer lÃƒÆ’Ã‚Â¶schen
    clearDirty(id);
  }

  function isCorrect(id: string) {
    return statusById[id] === "correct";
  }

  function markCorrect(id: string) {
    setStatusById((prev) => ({ ...prev, [id]: "correct" }));
    clearDirty(id);
  }

  function markChecked(id: string) {
    setCheckedById((prev) => ({ ...prev, [id]: true }));
  }

  function incAttempt(id: string) {
    setAttemptsById((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function ensureFirstCorrectQuality(id: string, attemptsAfterCheck: number) {
    setFirstCorrectQualityById((prev) => {
      // "first correct" bleibt stabil: wenn bereits gesetzt, nie ÃƒÆ’Ã‚Â¼berschreiben
      if (prev[id]) return prev;
      const usedHelp = Boolean(tipsSeenById[id] || solutionSeenById[id]);

      if (usedHelp) {
        return { ...prev, [id]: "assisted" };
      }

      const quality = attemptsAfterCheck <= 1 ? "clean" : "assisted";
      return { ...prev, [id]: quality };
    });
  }

  


  function hasMeaningfulDraft(id: string) {
    const q = qs.find((x) => x.id === id);
    if (!q) return false;

    const d = draftRef.current[id];
    const valueTrim = (d?.value ?? "").trim();

    const expectedUnitNorm = normalizeUnit((q as any)?.answer?.unit ?? "");
    const unitNorm = normalizeUnit(d?.unit ?? "");

    const hasMeaningfulUnit = expectedUnitNorm.length === 0 ? unitNorm.length > 0 : false;

    return valueTrim.length > 0 || hasMeaningfulUnit;
  }

  // lib/learn/useLearnController.ts

  function buildStandSummary(
    ids: string[],
    overrides?: {
      statusById?: StatusById;
      checkedById?: CheckedById;
      firstCorrectQualityById?: FirstCorrectQualityById;
    }
  ) {
    const sMap = overrides?.statusById ?? statusById;
    const cMap = overrides?.checkedById ?? checkedById;
    const qMap = overrides?.firstCorrectQualityById ?? firstCorrectQualityById;

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Regelwerk (final):
    // - status === "correct" => immer korrekt (unabhÃƒÆ’Ã‚Â¤ngig von checked)
    // - checked && !correct  => falsch
    // - attempted && !checked => in Arbeit
    const correctIds = ids.filter((id) => sMap[id] === "correct");

    const wrong = ids.filter((id) => Boolean(cMap[id]) && sMap[id] !== "correct").length;

    const inWork = ids.filter((id) => sMap[id] === "attempted" && !cMap[id]).length;

    const assisted = correctIds.filter((id) => qMap[id] === "assisted").length;
    const clean = correctIds.length - assisted;

    return {
      clean,
      assisted,
      wrong,
      inWork,
      checkedCount: correctIds.length + wrong,
    };
  }







  function goTo(nextIndex: number) {
    if (!qs.length) return;
    clearPendingAutoNext();

    const clamped = Math.max(0, Math.min(qs.length - 1, nextIndex));

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ WICHTIG: Wenn man den aktuell aktiven Dot anklickt,
    // darf NICHT finalisiert / gespeichert / neu berechnet werden.
    if (clamped === index) return;

    finalizeOnLeave(activeId);

    setIndex(clamped);
  }

  function nextIndexNormal(start: number) {
    if (!qs.length) return 0;
    const idx = start % qs.length;
    return idx < 0 ? idx + qs.length : idx;
  }

  function nextOpenFrom(start: number, assumeCorrectId?: string) {
    if (!qs.length) return 0;
    for (let i = start; i < qs.length; i++) {
      const id = qs[i].id;
      if (assumeCorrectId && id === assumeCorrectId) continue;
      if (!isCorrect(id)) return i;
    }
    for (let i = 0; i < start; i++) {
      const id = qs[i].id;
      if (assumeCorrectId && id === assumeCorrectId) continue;
      if (!isCorrect(id)) return i;
    }
    return index;
  }

    function evaluateAnswer(
      q: HydratedLikeQuestion,
      input: { value: string; unit: string; textFields?: Record<string, string> }
    ) {
      const qType = String((q as any)?.type ?? "").trim();

      // --- Structured Text (Prep) ---
      const structuredFields = (q as any)?.answer?.fields ?? (q as any)?.fields;
      const isStructured = Array.isArray(structuredFields);

      if (qType === "structured_text" || isStructured) {
        const evaluation = evaluateStructuredTextTask(q as any, input.textFields ?? {});
        return {
          mode: "text" as const,
          correct: evaluation.passed,
          evaluation,
        };
      }

      // --- Single Choice (AP1/AP2 Theorie) ---
      if (qType === "single_choice") {
        const chosen = String(input.textFields?.choice ?? "");
        const correctIndex = Number((q as any)?.answer?.correctIndex ?? (q as any)?.grading?.correctIndex);
        const ok = chosen !== "" && Number.isFinite(correctIndex) && Number(chosen) === correctIndex;
        return { mode: "choice" as const, correct: ok };
      }

      // --- Multi Select (mehrere richtige) ---
      if (qType === "multi_select") {
        // Erwartet: answer.correctIds / answer.correctIndices (oder grading.correctIds / grading.correctIndices)
        const raw = String(input.textFields?.multi ?? "").trim();
        let selected: string[] = [];
        try {
          const v = raw ? JSON.parse(raw) : [];
          if (Array.isArray(v)) selected = v.map((x) => String(x));
        } catch {
          selected = [];
        }

        const correctIds: string[] = Array.isArray((q as any)?.answer?.correctIds)
          ? (q as any).answer.correctIds.map(String)
          : Array.isArray((q as any)?.grading?.correctIds)
          ? (q as any).grading.correctIds.map(String)
          : [];

        const correctIndices: number[] = Array.isArray((q as any)?.answer?.correctIndices)
          ? (q as any).answer.correctIndices.map((n: any) => Number(n))
          : Array.isArray((q as any)?.grading?.correctIndices)
          ? (q as any).grading.correctIndices.map((n: any) => Number(n))
          : [];

        let correctSet: Set<string>;
        if (correctIds.length > 0) {
          correctSet = new Set(correctIds);
        } else {
          correctSet = new Set(correctIndices.map((n) => String(n)));
        }

        const selSet = new Set(selected);
        let ok = selSet.size === correctSet.size;
        if (ok) {
          for (const id of correctSet) if (!selSet.has(id)) ok = false;
        }
        return { mode: "multi" as const, correct: ok };
      }

      // --- Order (Reihenfolge) ---
      if (qType === "order") {
        // Content: items: string[]; answer.correctOrder or answer: number[] (Reihenfolge als Item-Indizes)
        const raw = String(input.textFields?.order ?? "").trim();
        let positions: string[] = [];
        try {
          const v = raw ? JSON.parse(raw) : [];
          if (Array.isArray(v)) positions = v.map((x) => String(x));
        } catch {
          positions = [];
        }

        const correctOrderIds: string[] = Array.isArray((q as any)?.answer?.correctOrderIds)
          ? (q as any).answer.correctOrderIds.map(String)
          : [];

        const correctOrderSource = Array.isArray((q as any)?.answer?.correctOrder)
          ? (q as any).answer.correctOrder
          : Array.isArray((q as any)?.answer)
          ? (q as any).answer
          : [];
        const correctOrder: number[] = correctOrderSource.map((n: any) => Number(n));
        const itemCount = Array.isArray((q as any)?.items) ? (q as any).items.length : positions.length;

        if (itemCount <= 0 || (correctOrderIds.length === 0 && correctOrder.length !== itemCount)) {
          return { mode: "order" as const, correct: false };
        }

        const allIds = Array.from({ length: itemCount }, (_, i) => String(i));

        // If no order stored yet, assume current UI order (default list)
        if (positions.length === 0) {
          const items = Array.isArray((q as any)?.items) ? (q as any).items : [];
          const itemsHaveIds = items.some((it: any) => it && typeof it === "object" && "id" in it);
          positions = itemsHaveIds ? items.map((it: any, i: number) => String(it?.id ?? i)) : allIds;
        }

        // New UI stores order as list of item ids (e.g. ["0","1","2",...])
        const isOrderIds =
          positions.length === itemCount && positions.every((x) => allIds.includes(String(x)));

        if (isOrderIds) {
          const expectedIds = correctOrderIds.length > 0 ? correctOrderIds : correctOrder.map((n) => String(n));
          let ok = positions.length === expectedIds.length;
          if (ok) {
            for (let i = 0; i < expectedIds.length; i++) {
              if (String(positions[i]) !== String(expectedIds[i])) {
                ok = false;
                break;
              }
            }
          }
          return { mode: "order" as const, correct: ok };
        }

        // FÃƒÆ’Ã‚Â¼r jedes Item i ist die korrekte Position = indexOf(i) + 1
        const posForItem = new Map<number, number>();
        for (let p = 0; p < correctOrder.length; p++) posForItem.set(correctOrder[p], p + 1);

        let ok = true;
        for (let i = 0; i < itemCount; i++) {
          const expectedPos = posForItem.get(i);
          const got = Number(positions[i]);
          if (!expectedPos || got !== expectedPos) {
            ok = false;
            break;
          }
        }
        return { mode: "order" as const, correct: ok };
      }

      // --- Match (Zuordnung) ---
      if (qType === "match") {
        const raw = String(input.textFields?.match ?? "").trim();
        let pairs: Record<string, string> = {};
        try {
          const v = raw ? JSON.parse(raw) : {};
          if (v && typeof v === "object") pairs = v as Record<string, string>;
        } catch {
          pairs = {};
        }

        const correctMap = ((q as any)?.answer?.correctMap ?? (q as any)?.correctMap) as Record<string, string> | undefined;
        if (!correctMap || typeof correctMap !== "object") return { mode: "match" as const, correct: false };

        const keys = Object.keys(correctMap);
        let ok = keys.length > 0;
        for (const k of keys) {
          if (String(pairs[k] ?? "") !== String(correctMap[k] ?? "")) {
            ok = false;
            break;
          }
        }
        return { mode: "match" as const, correct: ok };
      }

      // --- Free Text (Kurzantwort, 1 Feld) ---
      // Wenn Content eine TextlÃƒÆ’Ã‚Â¶sung hinterlegt (answer.text), werten wir "sinnvolle Eingabe" als bestanden.
      // (Keine KI-Bewertung; prÃƒÆ’Ã‚Â¼fungsnah: hier zÃƒÆ’Ã‚Â¤hlt das Formulieren/Denken.)
      const expectedText = (q as any)?.answer?.text;
      if (qType === "text" || (typeof expectedText === "string" && expectedText.trim().length > 0)) {
        const txt = String(input.textFields?.text ?? input.value ?? "").trim();
        const ok = txt.length >= 3;
        return { mode: "free_text" as const, correct: ok };
      }

      // --- Numeric (bestehendes Verhalten) ---
      const vTrim = (input.value ?? "").trim();
      const expectedUnitRaw = String((q as any)?.answer?.unit ?? "");
      const expectedUnitNorm = normalizeUnit(expectedUnitRaw);

      // Bei fester Soll-Einheit ist das Unit-Feld in der UI read-only.
      // Deshalb darf ein ggf. veralteter interner unit-State die Bewertung nie verfÃƒÆ’Ã‚Â¤lschen.
      const effectiveUnitRaw = expectedUnitNorm.length > 0 ? expectedUnitRaw : String(input.unit ?? "");
      const uNorm = normalizeUnit(effectiveUnitRaw);

      const unitOk = expectedUnitNorm.length === 0 ? true : uNorm === expectedUnitNorm;

      const num = parseNumber(vTrim);
      const tolerance = typeof (q as any).tolerance === "number" ? (q as any).tolerance : 0;

      if (!Number.isFinite(num)) {
        return { mode: "number" as const, correct: false, valueOk: false, unitOk };
      }

      const expected = (q as any)?.answer?.value;
      if (typeof expected !== "number") {
        // keine erwartete Zahl hinterlegt -> nicht numeric
        return { mode: "number" as const, correct: false, valueOk: false, unitOk };
      }

      const diff = Math.abs(num - expected);
      const valueOk = diff <= tolerance;

      return { mode: "number" as const, correct: valueOk && unitOk, valueOk, unitOk };
    }


  // ---------------------------
  // AP1-Prep: Konsistenz-Hinweise (ohne Abwertung)
  // ---------------------------
    function ap1DetectConsistencyHint(args: {
      currentId: string;
      currentTextFields?: Record<string, string>;
    }): { title: string; text: string } | null {
      // Only for the AP1 prep module "Arbeitsaufgaben"
      if (moduleId !== "ap1-arbeitsaufgaben") return null;

      // We check a single high-impact consistency: chosen PrÃƒÆ’Ã‚Â¼fmittel (t-05a) should not contradict later situative Antwort (t-07)
      if (args.currentId !== "t-07") return null;

      const prev = (draftRef.current as any)?.["t-05a"]?.textFields ?? {};
      const prevDecision = String(prev?.decision ?? "").toLowerCase();

      const nowDecision = String(args.currentTextFields?.decision ?? "").toLowerCase();

      const tools = [
        { key: "messschieber", label: "Messschieber" },
        { key: "buegelmessschraube", label: "Buegelmessschraube" },
        { key: "messuhr", label: "Messuhr" },
        { key: "lehre", label: "Lehre" },
        { key: "grenzlehre", label: "Grenzlehre" },
      ];

      const prevTool = tools.find((t) => prevDecision.includes(t.key));
      const nowTool = tools.find((t) => nowDecision.includes(t.key));

      // If earlier decision had a specific tool, and current mentions a different one (or none), warn.
      if (prevTool && (!nowTool || nowTool.key !== prevTool.key)) {
        return {
          title: "Prüfungshinweis",
          text: `Deine Prüfmittel-Entscheidung wirkt inkonsistent: vorher "${prevTool.label}", hier ${
            nowTool ? `"${nowTool.label}"` : "kein konkretes Prüfmittel"
          }. In der Prüfung kostet so etwas oft Punkte (Nachvollziehbarkeit).`,
        };
      }

      return null;
    }

  function checkOne() {
    if (!current) return;
    clearPendingAutoNext();

    markChecked(current.id);
    clearDirty(current.id);

    const attemptsAfterCheck = (attemptsById[current.id] ?? 0) + 1;
    incAttempt(current.id);

    const res = evaluateAnswer(current, {
      value: valueRef.current,
      unit:
        String((current as any)?.answer?.unit ?? "").trim().length > 0
          ? String((current as any)?.answer?.unit ?? "")
          : unitRef.current,
      textFields: textFieldsRef.current,
    });

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Rein additiv: Fehlermuster aus strukturierter Text-Bewertung merken (fÃƒÆ’Ã‚Â¼r Dashboard/Risikoanalyse)
    if ((res as any).mode === "text") {
      const ev = (res as any).evaluation;
      const tags = ev?.errorTagsDetected;
      if (Array.isArray(tags) && tags.length > 0) {
        setErrorTagsById((prev) => ({ ...prev, [current.id]: tags as string[] }));
      } else {
        // Wenn keine Tags mehr erkannt werden, lassen wir ggf. alte Tags stehen (historisch nÃƒÆ’Ã‚Â¼tzlich)
        // -> bewusst keine LÃƒÆ’Ã‚Â¶schung, um Lernverlauf nicht zu verwÃƒÆ’Ã‚Â¤ssern.
      }
    }



    if (res.correct) {
      markCorrect(current.id);
      ensureFirstCorrectQuality(current.id, attemptsAfterCheck);

      setFeedback({
        kind: "ok",
        title: "Richtig",
        text: "Sehr gut! Das Ergebnis stimmt.",
      });

      // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ AP1-Prep: optionaler PrÃƒÆ’Ã‚Â¼fer-Hinweis (keine Abwertung)
      if ((res as any).mode === "text") {
        const hint = ap1DetectConsistencyHint({
          currentId: current.id,
          currentTextFields: textFieldsRef.current,
        });
        if (hint) {
          setFeedback({
            kind: "warn",
            title: hint.title,
            text: hint.text,
          });
        }
      }


      if (autoNext) {
        const checkedId = current.id;
        const next = nextErrorMode ? nextOpenFrom(index + 1, current.id) : nextIndexNormal(index + 1);
        if (next !== index) {
          pendingAutoNextTimerRef.current = setTimeout(() => {
            if (activeIdRef.current !== checkedId) {
              pendingAutoNextTimerRef.current = null;
              return;
            }
            setIndex(next);
            pendingAutoNextTimerRef.current = null;
          }, CHECK_FEEDBACK_HOLD_MS);
        }
      }
    } else {
      setStatusById((prev) => {
        if (prev[current.id] === "correct") return prev;
        return { ...prev, [current.id]: "attempted" };
      });

      if ((res as any).mode === "text") {
        const ev = (res as any).evaluation;
        const hint = ev?.missingChecklist?.[0];
        setFeedback({
          kind: "bad",
          title: "Noch nicht vollständig",
          text: hint ? hint : "Deine Antwort ist noch nicht vollständig. Prüfe Struktur und Kernpunkte.",
        });
      } else {
        const mode = String((res as any).mode ?? "");

        // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Non-numeric: niemals Numeric-Feedback (Wert/Einheit) zeigen
        if (mode === "choice" || mode === "multi" || mode === "order" || mode === "match") {
          setFeedback({
            kind: "bad",
            title: "Nicht korrekt",
            text: "Die Auswahl stimmt noch nicht. Prüfe die Aufgabenstellung und wähle die passende Option(en).",
          });
        } else {
          // numeric
          setFeedback({
            kind: "bad",
            title: "Nicht korrekt",
            text:
              !(res as any).valueOk && !(res as any).unitOk
                ? "Wert und Einheit stimmen noch nicht."
                : !(res as any).valueOk
                ? "Der Wert stimmt noch nicht."
                : "Die Einheit stimmt noch nicht.",
          });
        }
      }

    }
  }

  function checkAllYellow() {
    const ids = qs.map((q) => q.id);
    const yellowIds = qIds.filter((id) => statusById[id] === "attempted" && !checkedById[id]);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Unterschied: nichts zu prÃƒÆ’Ã‚Â¼fen ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â  nichts korrekt gelÃƒÆ’Ã‚Â¶st
    if (yellowIds.length === 0) {
      const s = buildStandSummary(ids);
      setFeedback({
        kind: "warn",
        title: "Alle prüfen",
        text: `Es gibt aktuell keine Aufgaben "In Arbeit" zum Prüfen. Stand: ${s.clean} eigenständig - ${s.assisted} mit Hilfe - ${s.wrong} falsch - ${s.inWork} in Arbeit`,
      });
      return;
    }

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Local "Next"-Snapshots bauen (damit Feedback NICHT auf stale React-State zÃƒÆ’Ã‚Â¤hlt)
    const nextChecked: CheckedById = { ...checkedById };
    for (const id of yellowIds) nextChecked[id] = true;

    const nextAttempts: AttemptsById = { ...attemptsById };
    for (const id of yellowIds) nextAttempts[id] = (nextAttempts[id] ?? 0) + 1;

    const nextStatus: StatusById = { ...statusById };

    let newlyCorrect = 0;
    const becameCorrectIds: string[] = [];

    for (const id of yellowIds) {
      const q = qs.find((x) => x.id === id);
      if (!q) continue;

      const d = draftRef.current[id];

      // Unit mergen: falls Draft keine Unit speichert, Default nehmen
      const mergedUnit = (q.answer.unit ?? "").trim().length > 0 ? (q.answer.unit ?? "") : ((d?.unit ?? "").trim());
      const mergedValue = d?.value ?? "";

      const mergedTextFields = ((d as any)?.textFields ?? {}) as Record<string, string>;

      const res = evaluateAnswer(q, {
        value: mergedValue,
        unit: mergedUnit,
        textFields: mergedTextFields,
      });


      if (res.correct) {
        nextStatus[id] = "correct";
        newlyCorrect += 1;
        becameCorrectIds.push(id);
      } else {
        // bleibt attempted (aber jetzt checked => wird als "falsch" gezÃƒÆ’Ã‚Â¤hlt)
        nextStatus[id] = "attempted";
      }
    }

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ QualitÃƒÆ’Ã‚Â¤t: fÃƒÆ’Ã‚Â¼r alle, die in diesem Batch korrekt wurden, setzen
    // Hilfe (Tipps/LÃƒÆ’Ã‚Â¶sung/KI) klebt immer als assisted.
    let nextQuality: FirstCorrectQualityById | null = null;
    if (becameCorrectIds.length > 0) {
      nextQuality = { ...firstCorrectQualityById };

      for (const id of becameCorrectIds) {
        // assisted klebt immer
        if (nextQuality[id] === "assisted") continue;

        const usedHelp = Boolean(tipsSeenById[id] || solutionSeenById[id]);
        if (usedHelp) {
          nextQuality[id] = "assisted";
          continue;
        }

        const attemptsAfterCheck = nextAttempts[id] ?? 0;
        nextQuality[id] = attemptsAfterCheck <= 1 ? "clean" : "assisted";
      }
    }

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Jetzt erst States committen
    setCheckedById(nextChecked);
    setAttemptsById(nextAttempts);
    setStatusById(nextStatus);
    if (nextQuality) setFirstCorrectQualityById(nextQuality);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Stand-Zusammenfassung MUSS auf "next" basieren
    const s = buildStandSummary(ids, {
      statusById: nextStatus,
      checkedById: nextChecked,
      firstCorrectQualityById: nextQuality ?? firstCorrectQualityById,
    });

    setFeedback({
      kind: newlyCorrect > 0 ? "ok" : "warn",
      title: "Alle prüfen",
      text:
        (newlyCorrect > 0 ? `${newlyCorrect} Aufgabe(n) neu korrekt. ` : `Keine neue Aufgabe korrekt. `) +
        `Stand: ${s.clean} eigenständig - ${s.assisted} mit Hilfe - ${s.wrong} falsch - ${s.inWork} in Arbeit`,
    });
  }



  function toggleSolution() {
    if (!current?.id) return;
    const id = current.id;

    setShowSolution((v) => {
      const next = !v;

      // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Nur beim ÃƒÆ’Ã¢â‚¬â€œffnen als Hilfe werten
      if (next) {
        setSolutionSeenById((prev) => ({ ...prev, [id]: true }));

        // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Hilfe gilt nur, solange die Aufgabe noch nicht korrekt gelÃƒÆ’Ã‚Â¶st ist.
        // Bereits korrekt (grÃƒÆ’Ã‚Â¼n) bleibt unverÃƒÆ’Ã‚Â¤ndert.
        forceAssisted(id);
      }

      return next;
    });
  }


  function forceAssisted(id: string) {
    setFirstCorrectQualityById((prev) => {
      // First-correct QualitÃƒÆ’Ã‚Â¤t ist bereits festgelegt -> nicht ÃƒÆ’Ã‚Â¤ndern.
      if (prev[id]) return prev;
      // Bereits korrekt gelÃƒÆ’Ã‚Â¶st -> grÃƒÆ’Ã‚Â¼n bleibt bestehen.
      if (statusById[id] === "correct") return prev;
      return { ...prev, [id]: "assisted" };
    });
  }

  function revealTips() {
    if (!current?.id) return;
    const id = current.id;

    setTipsSeenById((prev) => ({ ...prev, [id]: true }));

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Sobald Tipps genutzt werden: Aufgabe gilt als "mit Hilfe" (klebt)
    forceAssisted(id);
  }


  function resetAfterEditIfChecked(id: string) {
    setCheckedById((prev) => {
      if (!prev[id]) return prev;
      return { ...prev, [id]: false };
    });

    setStatusById((prev) => {
      if (prev[id] !== "correct") return prev;
      return { ...prev, [id]: "attempted" };
    });

    setFeedback(null);
    setShowSolution(false);
  }

  function isMeaningfulInputFor(id: string, valueStr: string, unitStr: string) {
    const q = qs.find((x) => x.id === id);
    if (!q) return false;

    const valueTrim = (valueStr ?? "").trim();

    const expectedUnitNorm = normalizeUnit((q as any)?.answer?.unit ?? "");
    const unitNorm = normalizeUnit(unitStr ?? "");

    const hasMeaningfulUnit = expectedUnitNorm.length === 0 ? unitNorm.length > 0 : false;

    return valueTrim.length > 0 || hasMeaningfulUnit;
  }


  function onValueChange(v: string) {
    if (!activeId) return;
    clearPendingAutoNext();

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ WÃƒÆ’Ã‚Â¤hrend Aufgabenwechsel / Hydration: alles ignorieren
    if (isSyncingRef.current) return;

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ No-op bei identischem Wert (verhindert Mount-/Controlled-Noise)
    if (v === valueRef.current) return;

    valueRef.current = v;

    // Draft persistieren (lÃƒÆ’Ã‚Â¶scht Draft automatisch, wenn leer)
    persistDraft(activeId, v, unitRef.current);

    const meaningful = isMeaningfulInputFor(activeId, v, unitRef.current);

    // ÃƒÂ¢Ã‚ÂÃ¢â‚¬â€ KEIN Input ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ KEIN attempted, KEIN reset, KEIN gelb
    if (!meaningful) {
      setValue(v);

      // alte fehlerhafte attempted-ZustÃƒÆ’Ã‚Â¤nde bereinigen
      setStatusById((prev) => {
        if (prev[activeId] !== "attempted") return prev;
        if (checkedById[activeId]) return prev;
        const next = { ...prev };
        delete next[activeId];
        return next;
      });

      clearDirty(activeId);
      return;
    }

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Nur echte ÃƒÆ’Ã¢â‚¬Å¾nderungen dÃƒÆ’Ã‚Â¼rfen correct/checked resetten
    if (checkedById[activeId]) {
      resetAfterEditIfChecked(activeId);
    }

    setValue(v);
    markDirty(activeId);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Jetzt (und nur jetzt) darf attempted gesetzt werden
    setStatusById((prev) => {
      if (prev[activeId] === "correct") return prev;
      return { ...prev, [activeId]: "attempted" };
    });
  }



  function onUnitChange(u: string) {
    if (!activeId) return;
    clearPendingAutoNext();

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ WÃƒÆ’Ã‚Â¤hrend Aufgabenwechsel / Hydration: alles ignorieren
    if (isSyncingRef.current) return;

    const nextUnitRaw = (u ?? "").trim();
    const nextUnitNorm = normalizeUnit(nextUnitRaw);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ No-op bei effektiver Gleichheit (Mount-/Preset-Noise)
    if (nextUnitNorm === normalizeUnit(unitRef.current)) return;

    unitRef.current = nextUnitRaw;
    setUnit(nextUnitRaw);

    // Draft persistieren
    persistDraft(activeId, valueRef.current, nextUnitRaw);

    const meaningful = isMeaningfulInputFor(activeId, valueRef.current, nextUnitRaw);

    // ÃƒÂ¢Ã‚ÂÃ¢â‚¬â€ Default-Unit allein zÃƒÆ’Ã‚Â¤hlt NICHT als Eingabe
    if (!meaningful) {
      setStatusById((prev) => {
        if (prev[activeId] !== "attempted") return prev;
        if (checkedById[activeId]) return prev;
        const next = { ...prev };
        delete next[activeId];
        return next;
      });

      clearDirty(activeId);
      return;
    }

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Nur echte ÃƒÆ’Ã¢â‚¬Å¾nderungen dÃƒÆ’Ã‚Â¼rfen correct/checked resetten
    if (checkedById[activeId]) {
      resetAfterEditIfChecked(activeId);
    }

    markDirty(activeId);

    setStatusById((prev) => {
      if (prev[activeId] === "correct") return prev;
      return { ...prev, [activeId]: "attempted" };
    });
  }


  function onTextFieldsChange(next: Record<string, string>) {
    if (!activeId) return;
    clearPendingAutoNext();

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ WÃƒÆ’Ã‚Â¤hrend Aufgabenwechsel / Hydration: alles ignorieren
    if (isSyncingRef.current) return;

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ No-op bei identischem Inhalt
    const prev = textFieldsRef.current ?? {};
    const keys = new Set([...Object.keys(prev), ...Object.keys(next ?? {})]);
    let same = true;
    for (const k of keys) {
      if (String(prev[k] ?? "") !== String((next as any)?.[k] ?? "")) {
        same = false;
        break;
      }
    }
    if (same) return;

    textFieldsRef.current = next;
    persistTextFieldsDraft(activeId, next);

    const meaningful = isMeaningfulText(next);

    // ÃƒÂ¢Ã‚ÂÃ¢â‚¬â€ KEIN Input ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ KEIN attempted, KEIN reset, KEIN gelb
    if (!meaningful) {
      setTextFields(next);

      // alte fehlerhafte attempted-ZustÃƒÆ’Ã‚Â¤nde bereinigen
      setStatusById((prevStatus) => {
        if (prevStatus[activeId] !== "attempted") return prevStatus;
        if (checkedById[activeId]) return prevStatus;
        const ns = { ...prevStatus };
        delete ns[activeId];
        return ns;
      });

      clearDirty(activeId);
      return;
    }

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Nur echte ÃƒÆ’Ã¢â‚¬Å¾nderungen dÃƒÆ’Ã‚Â¼rfen correct/checked resetten
    if (checkedById[activeId]) {
      resetAfterEditIfChecked(activeId);
    }

    setTextFields(next);
    markDirty(activeId);

    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Jetzt (und nur jetzt) darf attempted gesetzt werden
    setStatusById((prevStatus) => {
      if (prevStatus[activeId] === "correct") return prevStatus;
      return { ...prevStatus, [activeId]: "attempted" };
    });
  }


  function resetProgressLocalOnly() {
    clearPendingAutoNext();
    setStatusById({});
    setCheckedById({});
    setDraftById({});
    draftRef.current = {};
    setDirtyById({});
    setAttemptsById({});
    setSolutionSeenById({});
    setTipsSeenById({});
    setFirstCorrectQualityById({});
    setValue("");
    setUnit("");
    setTextFields({});
    textFieldsRef.current = {};
    setFeedback(null);
    setShowSolution(false);

    valueRef.current = "";
    unitRef.current = "";
  }

function newRun() {
  const gateNow = computeFreeGate(tier, moduleId);
  setFreeGate(gateNow);

  if (gateNow.active && gateNow.blocked) {
    setFeedback({
      kind: "bad",
      title: "Free-Limit erreicht",
      text: gateNow.reason ?? "Dieses Modul ist im Free-Plan nicht verfügbar.",
    });
    return;
  }

  if (tier === "free") {
    const consumed = consumeFreeRun(moduleId);
    setFreeGate(computeFreeGate(tier, moduleId));

    if (!consumed.ok) {
      setFeedback({
        kind: "bad",
        title: "Free-Limit erreicht",
        text: "Du hast keine Durchgaenge mehr frei. Upgrade auf Pro, um unbegrenzt weiterzumachen.",
      });
      return;
    }
  }

  resetProgressLocalOnly();

  resetRun(moduleId);
  const next = getOrCreateRun(moduleId);
  setRun(next);
  setIndex(0);
}

function repeatRun() {
  // Wiederholen = gleicher Run/Seed, nur Lernfortschritt zurücksetzen.
  resetProgressLocalOnly();
  setIndex(0);
}

function clearDraftsForIds(ids: string[]) {
  const unique = Array.from(new Set((ids ?? []).map((id) => String(id).trim()).filter(Boolean)));
  if (!unique.length) return;

  const removeSet = new Set(unique);
  clearPendingAutoNext();

  const nextDraft: DraftById = { ...draftRef.current };
  const nextStatus: StatusById = { ...statusById };
  const nextChecked: CheckedById = { ...checkedById };
  const nextDirty: DirtyById = { ...dirtyById };
  const nextAttempts: AttemptsById = { ...attemptsById };
  const nextSolutionSeen: SolutionSeenById = { ...solutionSeenById };
  const nextTipsSeen: Record<string, boolean> = { ...tipsSeenById };
  const nextFirstCorrectQuality: FirstCorrectQualityById = { ...firstCorrectQualityById };
  const nextErrorTags: Record<string, string[]> = { ...errorTagsById };

  let draftChanged = false;
  let statusChanged = false;
  let checkedChanged = false;
  let dirtyChanged = false;
  let attemptsChanged = false;
  let solutionSeenChanged = false;
  let tipsSeenChanged = false;
  let firstCorrectQualityChanged = false;
  let errorTagsChanged = false;

  for (const id of removeSet) {
    if (id in nextDraft) {
      delete nextDraft[id];
      draftChanged = true;
    }
    if (id in nextStatus) {
      delete nextStatus[id];
      statusChanged = true;
    }
    if (id in nextChecked) {
      delete nextChecked[id];
      checkedChanged = true;
    }
    if (id in nextDirty) {
      delete nextDirty[id];
      dirtyChanged = true;
    }
    if (id in nextAttempts) {
      delete nextAttempts[id];
      attemptsChanged = true;
    }
    if (id in nextSolutionSeen) {
      delete nextSolutionSeen[id];
      solutionSeenChanged = true;
    }
    if (id in nextTipsSeen) {
      delete nextTipsSeen[id];
      tipsSeenChanged = true;
    }
    if (id in nextFirstCorrectQuality) {
      delete nextFirstCorrectQuality[id];
      firstCorrectQualityChanged = true;
    }
    if (id in nextErrorTags) {
      delete nextErrorTags[id];
      errorTagsChanged = true;
    }
  }

  if (draftChanged) {
    draftRef.current = nextDraft;
    setDraftById(nextDraft);
  }
  if (statusChanged) setStatusById(nextStatus);
  if (checkedChanged) setCheckedById(nextChecked);
  if (dirtyChanged) setDirtyById(nextDirty);
  if (attemptsChanged) setAttemptsById(nextAttempts);
  if (solutionSeenChanged) setSolutionSeenById(nextSolutionSeen);
  if (tipsSeenChanged) setTipsSeenById(nextTipsSeen);
  if (firstCorrectQualityChanged) setFirstCorrectQualityById(nextFirstCorrectQuality);
  if (errorTagsChanged) setErrorTagsById(nextErrorTags);

  // Wenn die aktuell sichtbare Aufgabe dazugehÃƒÂ¶rt, UI sofort leeren.
  if (activeId && removeSet.has(activeId)) {
    const defaultUnitRaw = String(current?.answer?.unit ?? "").trim();
    const nextUnit = defaultUnitRaw.length > 0 ? defaultUnitRaw : "";

    setValue("");
    setUnit(nextUnit);
    valueRef.current = "";
    unitRef.current = nextUnit;

    setTextFields({});
    textFieldsRef.current = {};

    clearDirty(activeId);
    setFeedback(null);
    setShowSolution(false);
  }
}

// ---------------------------
// Public API
// ---------------------------
return {
  moduleId,
  tier,
  freeGate,
  isFiltered,

  qs,
  index,
  current,
  activeId,

  value,
  unit,

  statusById,
  checkedById,
  dirtyById,
  attemptsById,
  solutionSeenById,
  tipsSeenById,
  firstCorrectQualityById,

  errorTagsById,

  feedback,
  showSolution,
  solutionUnlocked,

  checkedCount,
  correctCount,
  redCheckedWrongCount,
  attemptedNotCheckedCount,
  isAllCorrect,

  goTo,
  checkOne,
  checkAllYellow,
  toggleSolution,
  revealTips,

  onValueChange,
  onUnitChange,
  textFields,
  onTextFieldsChange,


  newRun,
  repeatRun,

  resetProgressLocalOnly,
  clearDraftsForIds,

  // helpers for UI
  hasMeaningfulDraft,
};

}
