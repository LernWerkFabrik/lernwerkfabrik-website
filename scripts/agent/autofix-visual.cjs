#!/usr/bin/env node
/**
 * LWF Visual Autofix Agent (Playwright -> Report -> Codex -> Re-test)
 *
 * Usage (PowerShell):
 *   node .\scripts\agent\autofix-visual.js
 *
 * Optional env:
 *   PW_CMD="npx playwright test"                  (default)
 *   PW_ARGS="--config=playwright.config.ts"       (default empty)
 *   PW_BASE_URL="http://localhost:3000"           (optional, for report)
 *   MAX_ITERS="2"                                 (default 2)
 *   CODEX_BIN="codex"                             (default)
 *   DRY_RUN="1"                                   (don’t call codex)
 *   KEEP_JSON="1"                                 (keep playwright json output)
 *
 * Notes:
 * - This script DOES NOT update snapshots automatically.
 * - It expects Playwright to be installed in the repo.
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = process.cwd();
const RUNS_DIR = path.join(REPO_ROOT, "scripts", "agent", "runs");

const PW_CMD = process.env.PW_CMD || "npx";
const PW_ARGS_STR = process.env.PW_ARGS || ""; // example: "playwright test -c playwright.config.ts"
const PW_BASE_URL = process.env.PW_BASE_URL || "";
const MAX_ITERS = parseInt(process.env.MAX_ITERS || "2", 10);
const CODEX_BIN = process.env.CODEX_BIN || "codex";
const DRY_RUN = process.env.DRY_RUN === "1";
const KEEP_JSON = process.env.KEEP_JSON === "1";

// --- helpers ---
function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    shell: process.platform === "win32",
    stdio: opts.capture ? "pipe" : "inherit",
    encoding: "utf8",
    env: { ...process.env, ...(opts.env || {}) },
  });
  return res;
}


function splitArgs(str) {
  // very small arg splitter (handles quotes minimally)
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && /\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function safeRel(p) {
  try {
    return path.relative(REPO_ROOT, p).replace(/\\/g, "/");
  } catch {
    return p;
  }
}

// --- Playwright JSON parsing ---
// We run Playwright with `--reporter=json` and parse stdout JSON.
function extractFailuresFromPwJson(pwJson) {
  const failures = [];
  const suites = pwJson?.suites || [];
  function walkSuite(suite, fileHint) {
    const file = suite?.location?.file || fileHint || "";
    const specs = suite?.specs || [];
    for (const spec of specs) {
      const titlePath = spec?.titlePath?.join(" > ") || spec?.title || "spec";
      const tests = spec?.tests || [];
      for (const t of tests) {
        const results = t?.results || [];
        for (const r of results) {
          if (r?.status === "failed") {
            failures.push({
              file,
              title: titlePath,
              project: t?.projectName || "",
              error: r?.error?.message || "",
              attachments: (r?.attachments || []).map((a) => ({
                name: a?.name || "",
                path: a?.path || "",
                contentType: a?.contentType || "",
              })),
            });
          }
        }
      }
    }
    for (const child of suite?.suites || []) walkSuite(child, file);
  }
  for (const s of suites) walkSuite(s, "");
  return failures;
}

function buildBugReportMarkdown({ iter, failures, runDir }) {
  const lines = [];
  lines.push(`# LWF Visual Autofix Report`);
  lines.push(``);
  lines.push(`- Iteration: ${iter}`);
  if (PW_BASE_URL) lines.push(`- Base URL: ${PW_BASE_URL}`);
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Repo: ${safeRel(REPO_ROOT)}`);
  lines.push(``);

  if (!failures.length) {
    lines.push(`✅ No failing visual tests detected.`);
    return lines.join("\n");
  }

  lines.push(`## Failing tests (${failures.length})`);
  lines.push(``);

  failures.forEach((f, idx) => {
    lines.push(`### ${idx + 1}) ${f.title}`);
    if (f.project) lines.push(`- Project: ${f.project}`);
    if (f.file) lines.push(`- File: \`${f.file}\``);

    if (f.error) {
      lines.push(`- Error:`);
      lines.push("```");
      lines.push(f.error.trim());
      lines.push("```");
    }

    const att = f.attachments || [];
    const useful = att.filter((a) => a.path && fs.existsSync(a.path));
    if (useful.length) {
      lines.push(`- Attachments:`);
      for (const a of useful) {
        const rel = safeRel(a.path);
        lines.push(`  - ${a.name || "attachment"}: \`${rel}\`${a.contentType ? ` (${a.contentType})` : ""}`);
      }
    } else {
      lines.push(`- Attachments: (none found)`);
    }

    lines.push(``);
  });

  // guidance for Codex
  lines.push(`## Constraints for Codex`);
  lines.push(`- Only minimal diffs. No refactors.`);
  lines.push(`- Do NOT update snapshots.`);
  lines.push(`- Fix root cause in layout/CSS/Tailwind/components.`);
  lines.push(`- Prefer adjusting wrappers (mx-auto / w-full / px-*) instead of deep changes.`);
  lines.push(`- Keep Desktop/Pro logic unchanged unless report shows Pro-specific regression.`);
  lines.push(``);

  lines.push(`## What to do`);
  lines.push(`- Open the referenced diff/actual images.`);
  lines.push(`- Identify the container/wrapper causing clipping/offset.`);
  lines.push(`- Apply smallest possible fix and re-run Playwright.`);
  lines.push(``);

  return lines.join("\n");
}

function codexPromptFromReport(reportRelPath) {
  return [
    `You are Codex working in a Next.js + TS + Tailwind repo (LWF).`,
    ``,
    `Task: Fix failing Playwright visual regression tests.`,
    `Read the bug report at: ${reportRelPath}`,
    ``,
    `Rules:`,
    `- Output and apply minimal diffs only.`,
    `- Do NOT update snapshots.`,
    `- Do NOT run repo-wide searches unless necessary.`,
    `- Prefer changing the immediate wrapper/container (e.g., mx-auto w-full max-w-md px-4).`,
    `- Do not change business logic (learn status, scoring, storage).`,
    ``,
    `After changes, ensure tests pass (the agent will re-run).`,
  ].join("\n");
}

// --- main loop ---
(function main() {
  ensureDir(RUNS_DIR);
  const runDir = path.join(RUNS_DIR, nowStamp());
  ensureDir(runDir);

  const logPath = path.join(runDir, "agent.log");
  const log = (msg) => {
    fs.appendFileSync(logPath, msg + "\n", "utf8");
    console.log(msg);
  };

  log(`== LWF Visual Autofix Agent ==`);
  log(`Run dir: ${safeRel(runDir)}`);
  log(`MAX_ITERS=${MAX_ITERS}`);
  if (DRY_RUN) log(`DRY_RUN=1 (Codex will not be called)`);

  // Precheck Codex availability
  if (!DRY_RUN) {
    const which = run(CODEX_BIN, ["--version"], { capture: true });
    if (which.status !== 0) {
      log(`ERROR: Codex CLI not found or not runnable. Tried: "${CODEX_BIN} --version"`);
      log(`Stdout: ${which.stdout || ""}`);
      log(`Stderr: ${which.stderr || ""}`);
      process.exit(2);
    }
    log(`Codex CLI OK: ${which.stdout?.trim() || "(version unknown)"}`);
  }

  const pwArgsBase = splitArgs(PW_ARGS_STR);
  // If user didn't pass full args, default to "playwright test"
  // Example: PW_CMD=npx, PW_ARGS="playwright test -c playwright.config.ts"
  if (pwArgsBase.length === 0) pwArgsBase.push("playwright", "test");

  for (let iter = 1; iter <= MAX_ITERS; iter++) {
    log(`\n--- Iteration ${iter}/${MAX_ITERS} ---`);

    // Run Playwright with JSON reporter to capture failures
    const jsonOutPath = path.join(runDir, `playwright.iter${iter}.json`);
    const pwArgs = [
      ...pwArgsBase,
      "--reporter=json",
    ];

    log(`Running: ${PW_CMD} ${pwArgs.join(" ")}`);

    const jsonPath = path.join(runDir, `playwright.iter${iter}.json`);

    const pwRes = run(PW_CMD, pwArgs, {
      capture: false,
      env: {
        PLAYWRIGHT_JSON_OUTPUT_NAME: jsonPath,
      },
    });

    // Jetzt JSON aus Datei lesen:
    if (!fs.existsSync(jsonPath)) {
      log(`ERROR: Playwright did not write JSON report to ${safeRel(jsonPath)}`);
      process.exit(3);
    }

    const pwJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const failures = extractFailuresFromPwJson(pwJson);


    // Some envs print non-json noise; try parse strictly first, fallback to find last JSON block.
    try {
      pwJson = JSON.parse(stdout);
    } catch {
      // fallback: try to locate last JSON object in stdout
      const lastBrace = stdout.lastIndexOf("{");
      if (lastBrace !== -1) {
        try {
          pwJson = JSON.parse(stdout.slice(lastBrace));
        } catch {}
      }
    }

    if (!pwJson) {
      writeFile(path.join(runDir, `playwright.iter${iter}.stdout.txt`), stdout);
      writeFile(path.join(runDir, `playwright.iter${iter}.stderr.txt`), stderr);
      log(`ERROR: Could not parse Playwright JSON output. Saved stdout/stderr in run dir.`);
      process.exit(3);
    }

    if (KEEP_JSON) writeFile(jsonOutPath, JSON.stringify(pwJson, null, 2));


    log(`Playwright exit=${pwRes.status} | failures=${failures.length}`);

    const reportPath = path.join(runDir, `bug_report.iter${iter}.md`);
    const reportMd = buildBugReportMarkdown({ iter, failures, runDir });
    writeFile(reportPath, reportMd);
    log(`Wrote report: ${safeRel(reportPath)}`);

    if (failures.length === 0) {
      log(`✅ All tests passing. Done.`);
      process.exit(0);
    }

    if (DRY_RUN) {
      log(`DRY_RUN: skipping Codex call. Exiting with failures.`);
      process.exit(1);
    }

    // Call Codex with the report
    const reportRel = safeRel(reportPath);
    const prompt = codexPromptFromReport(reportRel);

    const promptPath = path.join(runDir, `codex_prompt.iter${iter}.txt`);
    writeFile(promptPath, prompt);

    log(`Calling Codex...`);
    // We pass the prompt directly to codex exec. If your Codex CLI supports file input, you can adapt.
    const codexRes = run(CODEX_BIN, ["exec", prompt], { capture: false });

    if (codexRes.status !== 0) {
      log(`ERROR: Codex exec failed with exit=${codexRes.status}`);
      process.exit(4);
    }

    log(`Codex exec finished. Re-running tests...`);
    // Loop continues to next iteration
  }

  log(`❌ Reached MAX_ITERS=${MAX_ITERS} and tests still failing. See run dir logs.`);
  process.exit(1);
})();
