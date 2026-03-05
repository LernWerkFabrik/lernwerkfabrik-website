/* scripts/migrate-module-kind.ts
 *
 * Migration für module.json:
 * - setzt kind für alle Module (learn|prep|exam)
 * - AP-Sonderlogik nach Projekt-Definition
 * - bei exam ergänzt exam-Regeln inkl. durationMinutes
 *
 * Usage:
 *   npx tsx scripts/migrate-module-kind.ts           # Dry-Run (nur Report)
 *   npx tsx scripts/migrate-module-kind.ts --write   # schreibt Änderungen
 */

import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------ */
/* Typen (lokal, absichtlich NICHT aus lib importieren) */
/* ------------------------------------------------------------------ */

type ModuleKind = "learn" | "prep" | "exam";
type PrepFocus = "strategy" | "traps" | "time" | "mixed";

type ModuleJson = {
  id: string;
  title?: string;
  description?: string;

  kind?: ModuleKind;

  prep?: {
    focus?: PrepFocus;
  };

  exam?: {
    durationMinutes: number;
    noHelp?: boolean;
    autoSubmit?: boolean;
  };

  // alles andere bleibt erhalten
  [k: string]: any;
};

/* ------------------------------------------------------------------ */
/* Config */
/* ------------------------------------------------------------------ */

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content", "modules");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");

/**
 * Verbindliche AP-Regeln (dein Zielbild):
 * - Lerncontent: 23 normale + 2 Prep
 * - Examcontent: 2 Exam (nur Prüfung)
 *
 * Hier die AP-Module:
 * - ap1-arbeitsaufgaben        => prep (mixed)
 * - ap2-situationsaufgaben     => prep (strategy)  ✅ wichtig!
 * - ap1-rechen-fachaufgaben    => exam (45)
 * - ap2-systemaufgaben         => exam (50)
 */
const AP_RULES: Record<
  string,
  { kind: ModuleKind; examDurationMinutes?: number; prepFocus?: PrepFocus }
> = {
  "ap1-arbeitsaufgaben": { kind: "prep", prepFocus: "mixed" },
  "ap2-situationsaufgaben": { kind: "prep", prepFocus: "strategy" },

  "ap1-rechen-fachaufgaben": { kind: "exam", examDurationMinutes: 45 },
  "ap2-systemaufgaben": { kind: "exam", examDurationMinutes: 50 },
};

/* ------------------------------------------------------------------ */
/* Utils */
/* ------------------------------------------------------------------ */

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJsonPretty(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function listModuleDirs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function migrateOne(dirName: string) {
  const moduleDir = path.join(CONTENT_DIR, dirName);
  const moduleJsonPath = path.join(moduleDir, "module.json");

  if (!fs.existsSync(moduleJsonPath)) {
    return { skipped: true as const, reason: "no module.json", dirName };
  }

  let raw: ModuleJson;
  try {
    raw = readJson<ModuleJson>(moduleJsonPath);
  } catch (e) {
    return {
      skipped: true as const,
      reason: `invalid JSON in module.json (${String(e)})`,
      dirName,
    };
  }

  if (!raw?.id || typeof raw.id !== "string") {
    return { skipped: true as const, reason: "missing id in module.json", dirName };
  }

  const beforeKind = raw.kind;

  // Ziel-kind bestimmen (AP-Regeln > vorhandenes kind > default learn)
  const rule = AP_RULES[raw.id];
  const desiredKind: ModuleKind = rule?.kind ?? raw.kind ?? "learn";

  // next = raw preserving all keys
  const next: ModuleJson = { ...raw, kind: desiredKind };

  // prep defaults
  if (desiredKind === "prep") {
    if (!next.prep) next.prep = {};
    if (!next.prep.focus && rule?.prepFocus) next.prep.focus = rule.prepFocus;
    // exam-block wird nicht automatisch gelöscht (keine Daten zerstören)
  }

  // exam defaults
  if (desiredKind === "exam") {
    const duration =
      rule?.examDurationMinutes ??
      (typeof next.exam?.durationMinutes === "number" ? next.exam.durationMinutes : undefined);

    if (!duration) {
      return {
        skipped: true as const,
        reason: `exam module without durationMinutes (id=${raw.id})`,
        dirName,
      };
    }

    next.exam = {
      durationMinutes: duration,
      noHelp: next.exam?.noHelp ?? true,
      autoSubmit: next.exam?.autoSubmit ?? true,
    };
  }

  // Änderungen feststellen
  const changed =
    beforeKind !== next.kind ||
    JSON.stringify(raw.prep ?? null) !== JSON.stringify(next.prep ?? null) ||
    JSON.stringify(raw.exam ?? null) !== JSON.stringify(next.exam ?? null);

  return {
    skipped: false as const,
    id: raw.id,
    file: moduleJsonPath,
    before: beforeKind ?? "(missing)",
    after: next.kind,
    changed,
    next,
  };
}

/* ------------------------------------------------------------------ */
/* Main */
/* ------------------------------------------------------------------ */

function main() {
  // Debug: hilft genau bei "keine Ausgabe" / falscher Pfad
  console.log("CWD:", process.cwd());
  console.log("CONTENT_DIR:", CONTENT_DIR);

  const dirs = listModuleDirs();
  console.log("DIRS_FOUND:", dirs.length);

  if (dirs.length === 0) {
    console.error(`❌ Keine Modulordner gefunden. Prüfe Pfad: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const header = WRITE ? "MIGRATION (WRITE MODE)" : "MIGRATION (DRY RUN)";
  console.log(`\n=== ${header} ===\n`);

  let changedCount = 0;
  let skippedCount = 0;

    const reportRows: Array<{
    id: string;
    kindBefore?: string;
    kindAfter?: string;
    status: "OK" | "WOULD" | "WROTE" | "SKIP";
    note?: string;
    }> = [];


  for (const dir of dirs) {
    const r = migrateOne(dir);

    if (r.skipped) {
      skippedCount += 1;
      // wir reporten nur sinnvolle Skips (keine module.json ist oft ok)
      if (r.reason !== "no module.json") {
        reportRows.push({
          id: dir,
          kindBefore: "-",
          kindAfter: "-",
          status: "SKIP",
          note: r.reason,
        });
      }
      continue;
    }

    if (r.changed) {
      changedCount += 1;
      if (WRITE) {
        try {
          writeJsonPretty(r.file, r.next);
          reportRows.push({
            id: r.id,
            kindBefore: r.before,
            kindAfter: r.after,
            status: "WROTE",
          });
        } catch (e) {
          reportRows.push({
            id: r.id,
            kindBefore: r.before,
            kindAfter: r.after,
            status: "SKIP",
            note: `write failed: ${String(e)}`,
          });
        }
      } else {
        reportRows.push({
          id: r.id,
          kindBefore: r.before,
          kindAfter: r.after,
          status: "WOULD",
        });
      }
    } else {
      reportRows.push({
        id: r.id,
        kindBefore: r.before,
        kindAfter: r.after,
        status: "OK",
      });
    }
  }

  console.log(`Modules scanned: ${dirs.length}`);
  console.log(`Changed: ${changedCount}`);
  console.log(`Skipped: ${skippedCount}\n`);

  // Ausgabe sortiert
  reportRows
    .sort((a, b) => a.id.localeCompare(b.id, "de"))
    .forEach((row) => {
      const note = row.note ? ` | ${row.note}` : "";
      console.log(
        `${row.status.padEnd(5)} ${row.id.padEnd(28)} kind: ${row.kindBefore} -> ${row.kindAfter}${note}`
      );
    });

  console.log("");
  if (!WRITE) {
    console.log("Dry-run only. Re-run with --write to apply changes:");
    console.log("  npx tsx scripts/migrate-module-kind.ts --write");
  }
}

main();
