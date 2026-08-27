---
name: instruction-sync
description: "Use ONLY when project instructions, AGENTS.md, or graphify graph are stale, or before starting any task in TypeMaster to ensure token-optimal workflow and auto-regeneration of knowledge graph."
---

# instruction-sync

Keeps TypeMaster's knowledge graph and agent instructions synchronized after every code change, enforcing token-optimal workflows.

## When to trigger

- Before ANY task: read `graphify-out/GRAPH_REPORT.md` instead of full codebase scan
- After ANY edit: queue `graphify --update` and regenerate `AGENTS.md` / `instructions/` if communities changed
- When `graphify-out/.graphify_labels.json` or `manifest.json` is out of date relative to git HEAD
- When user asks "update instructions" or "sync graph"

## What it does

1. **Token gate:** Requires agents to run `graphify query "<task>"` (budget capped) and read `GRAPH_REPORT.md:1` + `graph.html` communities before `grep`/`glob`/`read` on raw files. Full file reads are allowed only after scoped graph query returns ≤3 communities.
2. **Change detection:** Uses `graphify-out/manifest.json:1` + `git diff --name-only HEAD` to detect stale files; runs `graphify --update` (code-only fast path needs no LLM) if needed.
3. **Instruction regeneration:** If `GRAPH_REPORT.md` communities/god-nodes change >5% or `cost.json:1` token budget shifts, rewrite `AGENTS.md:1` and `instructions/project-map.md:1` via the template in `.opencode/skills/instruction-sync/templates/`.
4. **Hook install:** Ensures `graphify hook install` post-commit hook is present (`graphify hook status`) so future commits auto-rebuild without agent intervention.

## Usage

```
/instruction-sync                 # full sync check + update if stale
/instruction-sync --force         # regenerate graph and instructions even if not stale
/instruction-sync --check         # dry-run: report staleness without writing
```

## Files owned

- `AGENTS.md` (root) – primary instructions, lists token policy and graph entry points
- `instructions/` folder – detailed breakdowns (project-map, workflows, token policy)
- `.opencode/opencode.json:1` – wires `instructions` array and `skills.paths`
- `.opencode/plugins/auto-graphify.js:1` – plugin that triggers sync on `tool.execute.after` for edits

## Rules

- Never run full `graphify` rebuild when `graphify --update` suffices (saves 38.5k input tokens per run per `cost.json`).
- Never overwrite `.Jules/bolt.md:1`, `palette.md:1`, `sentinel.md:1` journals – append only.
- Keep `graphify-out/` gitignored but not instruction files.
- After sync, tell user to restart opencode (`quit` → `opencode`).
