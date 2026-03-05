import "dotenv/config";
import path from "node:path";

import OpenAI from "openai";

import {
  listModules,
  modulePath,
  readJson,
  readText,
  writeJson,
  writeText,
} from "./fs-tools.mjs";
import { dedupeQuestions } from "./dedupe.mjs";
import { validateQuestions, detectQuestionType } from "./schema.mjs";

function parseArgs(argv) {
  const args = {
    module: null,
    kind: "practice",
    count: 25,
    dryRun: false,
    model: null,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--module") args.module = argv[++i];
    else if (a === "--kind") args.kind = argv[++i];
    else if (a === "--count") args.count = Number(argv[++i]);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--model") args.model = argv[++i];
  }

  return args;
}

function safeReadOptionalText(p) {
  return readText(p).catch(() => "");
}

function nowIso() {
  return new Date().toISOString();
}

function promptOf(q) {
  return q?.prompt ?? q?.template?.prompt ?? "";
}

function summarizeTypes(questions) {
  const counts = {};
  for (const q of questions ?? []) {
    const t = detectQuestionType(q);
    counts[t] = (counts[t] ?? 0) + 1;
  }
  return counts;
}

function summarizeTopics(questions) {
  const counts = {};
  for (const q of questions ?? []) {
    const topic = q?.meta?.topic ? String(q.meta.topic) : "unknown";
    counts[topic] = (counts[topic] ?? 0) + 1;
  }
  return counts;
}

function toTopicBullets(counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, 8).map(([k, v]) => `- ${k}: ${v}`);
}

function buildId(moduleId, idx) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${moduleId}-gen-${stamp}-${idx}`;
}

function ensureIds(questions, moduleId, existing) {
  const used = new Set((existing ?? []).map((q) => String(q?.id ?? "")));
  const out = [];
  let i = 1;

  for (const q of questions) {
    let id = String(q?.id ?? "").trim();
    if (!id || used.has(id)) {
      id = buildId(moduleId, i++);
      while (used.has(id)) id = buildId(moduleId, i++);
    }
    used.add(id);
    out.push({ ...q, id });
  }

  return out;
}

function extractJson(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const first = raw.indexOf("[");
    const last = raw.lastIndexOf("]");
    if (first >= 0 && last > first) {
      const slice = raw.slice(first, last + 1);
      return JSON.parse(slice);
    }
  }
  return null;
}

function buildSystemPrompt() {
  return [
    "Du bist ein Content-Agent für eine deutsche Lernplattform.",
    "Antworte ausschließlich mit gültigem JSON (kein Markdown, kein zusätzlicher Text).",
    "Halte dich strikt an das Format der vorhandenen Fragen.",
    "Keine Lösungsrechnung, keine Meta-Erklärung, keine Platzhalter.",
  ].join("\n");
}

function buildUserPrompt(ctx) {
  return [
    `Modul: ${ctx.moduleId}`,
    `Kind: ${ctx.kind}`,
    `Gewünschte Anzahl neuer Fragen: ${ctx.count}`,
    "",
    "Kontext (Auszug aus module.json):",
    ctx.moduleJson ? JSON.stringify(ctx.moduleJson, null, 2) : "N/A",
    "",
    "Erklärung (explanation.md, ggf. gekürzt):",
    ctx.explanation ? ctx.explanation.slice(0, 4000) : "N/A",
    "",
    "Beispiel (example.md, ggf. gekürzt):",
    ctx.example ? ctx.example.slice(0, 2000) : "N/A",
    "",
    "Vorhandene Fragen (Beispiele, gekürzt):",
    JSON.stringify(ctx.exampleQuestions, null, 2),
    "",
    "Type-Verteilung (bisher):",
    JSON.stringify(ctx.typeCounts),
    "",
    "Anforderungen:",
    "- Gib ein JSON-Array von Fragen zurück.",
    "- Format EXAKT wie in den Beispielen.",
    "- Verwende gemischte Aufgabentypen wie im Modul vorhanden.",
    "- Sprache: Deutsch.",
    "- Jede Frage muss eine eindeutige id haben.",
    "- Vermeide Duplikate zu bestehenden Fragen (insbesondere Prompt).",
    "- Gib keine Markdown-Texte aus.",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.module) {
    console.error("Missing --module <moduleId>");
    process.exit(1);
  }

  if (!["practice", "exam"].includes(args.kind)) {
    console.error("Invalid --kind (practice|exam)");
    process.exit(1);
  }

  const count = Number.isFinite(args.count) && args.count > 0 ? args.count : 25;
  const moduleId = args.module;

  const modules = await listModules();
  if (!modules.includes(moduleId)) {
    console.error(`Module not found: ${moduleId}`);
    console.error(`Available: ${modules.join(", ")}`);
    process.exit(1);
  }

  const moduleJsonPath = modulePath(moduleId, "module.json");
  const explanationPath = modulePath(moduleId, "explanation.md");
  const examplePath = modulePath(moduleId, "example.md");
  const questionsPath = modulePath(moduleId, `questions.${args.kind}.json`);

  const [moduleJson, explanation, example] = await Promise.all([
    readJson(moduleJsonPath).catch(() => null),
    safeReadOptionalText(explanationPath),
    safeReadOptionalText(examplePath),
  ]);

  const existingQuestions = await readJson(questionsPath).catch(() => []);
  const typeCounts = summarizeTypes(existingQuestions);
  const exampleQuestions = Array.isArray(existingQuestions) ? existingQuestions.slice(0, 3) : [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY in environment/.env");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const model = args.model ?? "gpt-4.1";

  const response = await client.responses.create({
    model,
    input: [
      { role: "system", content: buildSystemPrompt() },
      {
        role: "user",
        content: buildUserPrompt({
          moduleId,
          kind: args.kind,
          count,
          moduleJson,
          explanation,
          example,
          exampleQuestions,
          typeCounts,
        }),
      },
    ],
    temperature: 0.4,
  });

  const rawText = response.output_text ?? response.output?.[0]?.content?.[0]?.text ?? "";
  const parsed = extractJson(rawText);
  const generated = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : null;
  if (!generated) {
    console.error("Model response is not valid JSON array.");
    process.exit(1);
  }

  const withIds = ensureIds(generated, moduleId, existingQuestions);
  const validated = validateQuestions(withIds);
  if (!validated.ok) {
    console.error("Generated questions failed validation:");
    for (const e of validated.errors) console.error("-", e);
    process.exit(1);
  }

  const deduped = dedupeQuestions(existingQuestions, withIds);
  const merged = Array.isArray(existingQuestions)
    ? [...existingQuestions, ...deduped.kept]
    : [...deduped.kept];

  const mergedValidation = validateQuestions(merged);
  if (!mergedValidation.ok) {
    console.error("Merged questions failed validation:");
    for (const e of mergedValidation.errors) console.error("-", e);
    process.exit(1);
  }

  const reportPath = path.resolve(process.cwd(), "scripts", "agent", "generated-report.md");
  const topics = summarizeTopics(deduped.kept);

  const report = [
    `# Content-Agent Report`,
    ``,
    `- Modul: ${moduleId}`,
    `- Kind: ${args.kind}`,
    `- Erzeugt: ${deduped.stats.kept}`,
    `- Duplikate entfernt: ${deduped.stats.duplicatesRemoved}`,
    `- Zeitstempel: ${nowIso()}`,
    `- Dry-Run: ${args.dryRun ? "ja" : "nein"}`,
    ``,
    `## Themenabdeckung (neu, nach meta.topic)`,
    ...(Object.keys(topics).length ? toTopicBullets(topics) : ["- (keine meta.topic Angaben)"]),
    ``,
    `## Hinweise`,
    `- Format: wie bestehende questions.${args.kind}.json`,
    `- IDs: fehlende/duplizierte IDs wurden ersetzt`,
  ].join("\n");

  await writeText(reportPath, report + "\n");

  if (!args.dryRun) {
    await writeJson(questionsPath, merged);
  }

  console.log(`[agent] done. added=${deduped.stats.kept}, dupes=${deduped.stats.duplicatesRemoved}`);
  console.log(`[agent] report: ${reportPath}`);
  if (args.dryRun) console.log(`[agent] dry-run: questions file not modified`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
