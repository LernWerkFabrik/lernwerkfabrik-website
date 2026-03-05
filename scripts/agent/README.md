# Content Agent (Local)

Generates new questions for a given module and writes them into the existing
`content/modules/<moduleId>/questions.<kind>.json` file.

## Setup

Install dependencies:

```
npm i openai dotenv
```

Ensure `.env` contains:

```
OPENAI_API_KEY=...
```

## Usage

```
node scripts/agent/content-agent.mjs --module masse-toleranzen-pruefen --kind practice --count 25
```

Dry run (no overwrite, report only):

```
node scripts/agent/content-agent.mjs --module masse-toleranzen-pruefen --kind practice --count 10 --dry-run
```

## Guardrails / Validation

- Writes only inside `content/modules/<moduleId>/`.
- Dedupe by normalized prompt.
- Minimal schema validation to prevent broken output.
- Report written to `scripts/agent/generated-report.md`.
