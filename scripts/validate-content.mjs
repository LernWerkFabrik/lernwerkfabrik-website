// scripts/validate-content.mjs
import fs from "node:fs/promises";
import path from "node:path";

/**
 * This validator checks:
 * - every module id in curriculum.moduleToArea has a folder in content/modules/<id>
 * - no extra folders exist that are not in curriculum.moduleToArea
 *
 * It reads module IDs by parsing lib/curriculum.ts and extracting keys from `moduleToArea: { ... }`
 * to avoid TS/ESM import issues.
 */

function projectRoot() {
  return process.cwd();
}

function curriculumPath() {
  return path.join(projectRoot(), "lib", "curriculum.ts");
}

function modulesRoot() {
  return path.join(projectRoot(), "content", "modules");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function stripComments(input) {
  // remove /* ... */ and // ... comments (best-effort)
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function extractObjectBlockAfterKey(source, key) {
  const idx = source.indexOf(key);
  if (idx === -1) return null;

  // find first "{" after the key
  const braceStart = source.indexOf("{", idx);
  if (braceStart === -1) return null;

  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;

    if (depth === 0) {
      return source.slice(braceStart, i + 1);
    }
  }

  return null;
}

function extractQuotedKeysFromObjectBlock(objBlock) {
  // matches "some-key": or 'some-key':
  const keys = new Set();
  const re = /["']([a-z0-9][a-z0-9\-]*)["']\s*:/g;
  let m;
  while ((m = re.exec(objBlock))) {
    keys.add(m[1]);
  }
  return [...keys];
}

async function readCurriculumModuleIds() {
  const p = curriculumPath();
  if (!(await exists(p))) {
    throw new Error(`Curriculum file not found: ${p}`);
  }

  const raw = await fs.readFile(p, "utf8");
  const src = stripComments(raw);

  // We expect: moduleToArea: { ... }
  const block = extractObjectBlockAfterKey(src, "moduleToArea:");
  if (!block) {
    throw new Error(`moduleToArea block not found in lib/curriculum.ts`);
  }

  const ids = extractQuotedKeysFromObjectBlock(block);
  return ids.sort();
}

async function listModuleDirs() {
  const root = modulesRoot();
  if (!(await exists(root))) return [];

  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function printList(title, items) {
  console.log(title);
  console.log("=".repeat(title.length));
  for (const it of items) console.log(` - ${it}`);
  console.log("");
}

async function main() {
  console.log("=".repeat(60));

  const curriculumIds = await readCurriculumModuleIds();
  console.log(`[validate] Curriculum modules: ${curriculumIds.length}`);

  const dirIds = await listModuleDirs();
  console.log(`[validate] Content module dirs: ${dirIds.length}`);

  console.log("=".repeat(60));
  console.log("");

  const curriculumSet = new Set(curriculumIds);
  const dirSet = new Set(dirIds);

  const missing = curriculumIds.filter((id) => !dirSet.has(id));
  const extra = dirIds.filter((id) => !curriculumSet.has(id));

  if (missing.length > 0) {
    printList("❌ Missing content dirs (curriculum → no folder):", missing);
  } else {
    console.log("✅ No missing content dirs.\n");
  }

  if (extra.length > 0) {
    printList("❌ Extra content dirs (folder → not in curriculum):", extra);
  } else {
    console.log("✅ No extra dirs outside curriculum.\n");
  }

  console.log("Done.");
  process.exit(missing.length || extra.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
