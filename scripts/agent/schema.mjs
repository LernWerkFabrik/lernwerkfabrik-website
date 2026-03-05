function promptOf(q) {
  return q?.prompt ?? q?.template?.prompt ?? "";
}

function detectType(q) {
  if (q?.type) return String(q.type);
  if (q?.answer?.fields) return "structured_text";
  if (q?.answer?.choices && Array.isArray(q.answer.correctIndices)) return "multi_select";
  if (q?.answer?.choices && q.answer.correctIndex !== undefined) return "single_choice";
  if (Array.isArray(q?.items)) return "order";
  if (q?.template?.kind && q.template.kind !== "static") return "numeric";
  if (q?.answer?.value !== undefined) return "numeric";
  return "unknown";
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateQuestion(q) {
  const errors = [];
  if (!q || typeof q !== "object") {
    return { ok: false, errors: ["Question is not an object"] };
  }
  if (!isNonEmptyString(q.id)) errors.push("Missing id");

  const prompt = promptOf(q);
  if (!isNonEmptyString(prompt)) errors.push("Missing prompt (prompt or template.prompt)");

  const t = detectType(q);
  if (t === "single_choice") {
    if (!Array.isArray(q?.answer?.choices) || q.answer.choices.length < 2) errors.push("single_choice: choices missing");
    if (typeof q?.answer?.correctIndex !== "number") errors.push("single_choice: correctIndex missing");
  } else if (t === "multi_select") {
    if (!Array.isArray(q?.answer?.choices) || q.answer.choices.length < 2) errors.push("multi_select: choices missing");
    if (!Array.isArray(q?.answer?.correctIndices) || q.answer.correctIndices.length < 1) {
      errors.push("multi_select: correctIndices missing");
    }
  } else if (t === "order") {
    if (!Array.isArray(q?.items) || q.items.length < 2) errors.push("order: items missing");
    const hasOrder = Array.isArray(q?.answer?.correctOrder) || Array.isArray(q?.answer?.correctOrderIds);
    if (!hasOrder) errors.push("order: correctOrder/correctOrderIds missing");
  } else if (t === "structured_text") {
    if (!Array.isArray(q?.answer?.fields) || q.answer.fields.length < 2) errors.push("structured_text: fields missing");
  } else if (t === "numeric") {
    if (typeof q?.answer?.value !== "number") errors.push("numeric: answer.value missing");
    if (typeof q?.answer?.unit !== "string") errors.push("numeric: answer.unit missing");
    if (typeof q?.tolerance !== "number" && typeof q?.template?.tolerance !== "number") {
      errors.push("numeric: tolerance missing");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateQuestions(list) {
  const errors = [];
  if (!Array.isArray(list)) {
    return { ok: false, errors: ["Questions root is not an array"] };
  }
  list.forEach((q, idx) => {
    const res = validateQuestion(q);
    if (!res.ok) {
      for (const e of res.errors) errors.push(`q[${idx}]: ${e}`);
    }
  });
  return { ok: errors.length === 0, errors };
}

export function detectQuestionType(q) {
  return detectType(q);
}
