function normalize(text) {
  const lower = String(text ?? "").toLowerCase().trim();
  const noPunct = lower.replace(/[^a-z0-9äöüß\s]/gi, " ");
  return noPunct.replace(/\s+/g, " ").trim();
}

function promptOf(q) {
  return q?.prompt ?? q?.template?.prompt ?? "";
}

export function dedupeQuestions(existing, generated) {
  const seen = new Set();
  const dupes = [];

  for (const q of existing ?? []) {
    const key = normalize(promptOf(q));
    if (key) seen.add(key);
  }

  const kept = [];
  const newSeen = new Set();
  for (const q of generated ?? []) {
    const key = normalize(promptOf(q));
    if (!key) {
      kept.push(q);
      continue;
    }
    if (seen.has(key) || newSeen.has(key)) {
      dupes.push(q);
      continue;
    }
    newSeen.add(key);
    kept.push(q);
  }

  return {
    kept,
    removed: dupes,
    stats: {
      existing: Array.isArray(existing) ? existing.length : 0,
      generated: Array.isArray(generated) ? generated.length : 0,
      duplicatesRemoved: dupes.length,
      kept: kept.length,
    },
  };
}

export { normalize };
