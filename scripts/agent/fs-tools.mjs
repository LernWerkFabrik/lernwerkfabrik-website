import fs from "node:fs/promises";
import path from "node:path";

const CONTENT_ROOT = path.resolve(process.cwd(), "content", "modules");

export async function listModules() {
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

export function enforcePathGuard(targetPath) {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(CONTENT_ROOT + path.sep) && resolved !== CONTENT_ROOT) {
    throw new Error(`Path guard blocked access outside content/modules: ${resolved}`);
  }
  return resolved;
}

export async function readText(p) {
  return fs.readFile(p, "utf8");
}

export async function readJson(p) {
  const raw = await readText(p);
  return JSON.parse(raw);
}

export async function writeText(p, content) {
  await fs.writeFile(p, content, "utf8");
}

export async function writeJson(p, obj) {
  const json = JSON.stringify(obj, null, 2) + "\n";
  await writeText(p, json);
}

export function modulePath(moduleId, filename = "") {
  const modRoot = path.resolve(CONTENT_ROOT, moduleId);
  const target = filename ? path.join(modRoot, filename) : modRoot;
  enforcePathGuard(target);
  return target;
}

export function contentRoot() {
  return CONTENT_ROOT;
}
