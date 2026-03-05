// scripts/cleanup-legacy-modules.mjs
import fs from "node:fs/promises";
import path from "node:path";

const LEGACY = ["einheiten", "dreisatz", "kraft-gewicht", "drehmoment", "dichte-volumen", "toleranzen"];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function rmDir(p) {
  // Node 16+ / 18+ ok
  await fs.rm(p, { recursive: true, force: true });
}

async function main() {
  const root = path.join(process.cwd(), "content", "modules");
  let removed = 0;
  let missing = 0;

  for (const id of LEGACY) {
    const dir = path.join(root, id);
    if (!(await exists(dir))) {
      missing++;
      continue;
    }
    await rmDir(dir);
    removed++;
  }

  console.log(`[cleanup] removed=${removed}, missing=${missing}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
