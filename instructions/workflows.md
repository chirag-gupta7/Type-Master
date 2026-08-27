# Workflows — Graph-First Development

## Before Any Edit (Token-Optimized Discovery)

1. **Read `graphify-out/GRAPH_REPORT.md:1`** (summary + god nodes + communities).
2. **Run scoped graph query:**
   ```bash
   graphify query "How does getLearningStats aggregation work?" --budget 1500
   ```
   Output lists `source_file` + `source_location` + `community` + `cohesion`. Copy the cited paths.
3. **Read ≤3 files cited** — no broad `grep`/`glob`. Use `read` only on those files.
4. Consult journals for pattern guidance:
   - Perf → `.Jules/bolt.md:1` + `GRAPH_REPORT.md:168` hyperedge (Bolt rules)
   - Security → `.Jules/sentinel.md:1` + Community 30 + 50
   - A11y/UX → `.Jules/palette.md:1` + Community 62

> If graph can't answer (thin community, isolated 502 nodes in Report:454), then fall back to `grep` with tight `include` filter (e.g., `"*.ts"` on single `apps/backend/src/controllers`).

## During Edit

- Keep one `TodoWrite` `in_progress` at a time.
- Respect monorepo workspaces: `npm --workspace=apps/frontend` / `apps/backend` (per `package.json:6`).
- Preserve `"$schema"` in `.opencode/opencode.json:1` and `.opencode/skills/*/SKILL.md` frontmatter.
- For DB changes: run `prisma:generate` + `prisma:migrate` (see `apps/backend/package.json`).

## After Edit — Mandatory Validation & Graph Sync

```bash
npm run typecheck --workspaces   # or per-workspace
npm run lint --workspaces
npm run test:ci --workspaces     # Jest + RTL + Supertest per ci.yml:1
```

Then graph sync (saves tokens next task):

```bash
# Check staleness: manifest mtime vs git diff
graphify --update                # incremental: code-only path skips LLM, near-zero cost
# Or: python from graphify-out/.graphify_python -c "from graphify.detect import detect_incremental; ..."
```

If `GRAPH_REPORT.md` diff shows:
- New/deleted community, or nodes/edges delta >5%, or `cost.json` input_tokens shift >10% → update `AGENTS.md:1` + `instructions/project-map.md:1` (via `instruction-sync` skill).

## Commit & Push

- Post-commit hook (installed via `graphify hook install` per `.opencode/skills/graphify/references/hooks.md:1`) auto-runs AST rebuild after `git commit`. Verify via `graphify hook status`.
- Manual fallback if hook not installed: `npm run graphify:update` (add script `"graphify:update": "graphify --update"` to root `package.json`).
- Push after graph is rebuilt so remote `graphify-out` stays consistent for next agent session.

## Skills & Plugins Local Contract

- Skills scanned via `.opencode/opencode.json:10` `skills.paths: [".opencode/skills"]`.
- Local copies: `.opencode/skills/graphify/SKILL.md:1` (full pipeline) and `.opencode/skills/instruction-sync/SKILL.md:1` (auto-sync).
- Plugin: `.opencode/plugins/graphify.js:1` (injects graph reminder) and `.opencode/plugins/auto-graphify.js:1` (triggers instruction-sync on `edit` tool).
- Restart opencode after editing `.opencode/*` (config loaded once at startup).

## Watch Mode (Optional)

For active refactoring sprint: `graphify --watch` (no LLM, rebuilds on file save). `graphify-out/.graphify_root:1` remembers root.

## Anti-Patterns to Avoid

- `grep -r "something" --include="*.ts"` across repo without prior graph query — 6× token waste.
- Reading 10 files "to get context" — use `graphify query --budget` instead.
- Full `graphify .` rebuild when `graphify --update` suffices — see `references/update.md`.
- Overwriting `.Jules/*.md` journals — append new learnings as dated sections.

