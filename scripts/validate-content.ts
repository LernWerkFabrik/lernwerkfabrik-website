// scripts/validate-content.ts
import fs from "node:fs/promises";
import path from "node:path";

// ✅ DIREKT das Curriculum importieren (kein Named Export-Fehler)
import { IM_CURRICULUM } from "../lib/curriculum";

/* -------------------- */
/* Helpers              */
/* -------------------- */

async function listDirs(p: string): Promise<string[]> {
  const entries = await fs.readdir(p, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/* -------------------- */
/* Main                 */
/* -------------------- */

async function main() {
  const contentRoot = path.join(process.cwd(), "content", "modules");

  if (!(await exists(contentRoot))) {
    console.error(`[validate] content/modules not found: ${contentRoot}`);
    process.exit(1);
  }

  // ✅ Curriculum-Module (Single Source of Truth)
  const curriculumModuleIds = new Set(
    Object.keys(IM_CURRICULUM.moduleToArea).sort()
  );

  // ✅ Content-Ordner
  const contentDirs = new Set((await listDirs(contentRoot)).sort());

  const missingInContent = [...curriculumModuleIds].filter(
    (id) => !contentDirs.has(id)
  );

  const notInCurriculum = [...contentDirs].filter(
    (id) => !curriculumModuleIds.has(id)
  );

  console.log("=".repeat(60));
  console.log("[validate] Curriculum modules:", curriculumModuleIds.size);
  console.log("[validate] Content module dirs:", contentDirs.size);
  console.log("=".repeat(60));

  if (missingInContent.length) {
    console.log("\n❌ Missing content dirs (curriculum → no folder):");
    for (const id of missingInContent) console.log(" -", id);
  } else {
    console.log("\n✅ No missing content dirs.");
  }

  if (notInCurriculum.length) {
    console.log("\n⚠️  Dirs not in curriculum (legacy/extra):");
    for (const id of notInCurriculum) console.log(" -", id);
  } else {
    console.log("\n✅ No extra dirs outside curriculum.");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
