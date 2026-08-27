# TypeMaster — Agent Instructions (Token-Optimized)

> **MANDATORY FIRST STEP FOR EVERY TASK — ZERO EXCEPTIONS.**
> Before reading any source file, running `glob`/`grep`/`read` on raw code, or asking for clarification: **read `graphify-out/GRAPH_REPORT.md:1` and run a scoped `graphify query`**. This saves ~33k tokens per task (187 files, ~108k words → full scan = 38,500 input tokens per `graphify-out/cost.json:5`; graph report = ~5.7k tokens = 85% saving).

## 0. Token Gate (Do This Before Anything)

1. **Read `graphify-out/GRAPH_REPORT.md:1`** — 475 lines, 1222 nodes / 1810 edges / 140 communities. Contains community hubs, god nodes, surprising connections, suggested questions.
2. **Run `graphify query "<your task>" --budget 1500`** instead of `grep "**/*"` — BFS traversal returns scoped subgraph (often 5–30 nodes) vs scanning entire monorepo.
3. **Only after scoped query** do `read` on ≤3 files cited by `source_location` (e.g., `apps/backend/src/controllers/lesson.controller.ts:1050`).
4. **Never** default to `glob **/*.ts` + `grep` across workspace. Graph already encodes imports, communities, and cohesion.

```
graphify query "Where is lesson progress aggregation?" --budget 1500
graphify path "AuthRequest" "prisma"          # shortest path between concepts
graphify explain "getLearningDashboard"       # plain-language node explainer
graphify query "How does rate limiting work?" # hits Community 14 Auth Rate Limiting (0.17 cohesion)
```

Visual fallback: open `graphify-out/graph.html:1` (1MB interactive) or `graphify-out/graph.json:1` (1.2MB raw).

If `graphify-out/.graphify_labels.json:1` is missing or `manifest.json:1` shows stale `mtime` vs `git diff --name-only HEAD`, run `graphify --update` (incremental, code-only fast path needs no LLM).

---

## 1. Project Map (Derived from Graph Communities)

**Stack:** Next.js 14 App Router + Tailwind + Framer Motion (`apps/frontend`) | Express + Prisma + PostgreSQL (`apps/backend`) | NextAuth (credentials+Google) → Backend JWT bridge | Zustand + TanStack Query | Jest RTL Supertest

**Monorepo:** `package.json:6` workspaces `apps/frontend`, `apps/backend`, `packages/*`. Scripts `npm run dev` (concurrently), `build`, `test:ci`, `prisma:generate`, `prisma:migrate`.

**God Nodes (most connected):** `cn() (51 edges) → apps/frontend/src/lib/utils.ts:1`, `Button (24)`, `compilerOptions`, `prisma (17)`, `logger (13)` — changes here ripple widely; prefer targeted edits.

**Key Communities to Query First:**

| Task Area | Communities | Entry Files |
|-----------|-------------|-------------|
| Typing Test / Games | 0 Frontend Game Clients, 10 Typing Test Core, 31 Game Scores Leaderboards | `apps/frontend/src/components/TypingTest.tsx:1`, `apps/frontend/src/app/games/GamesClient.tsx:1`, `apps/backend/src/controllers/game.controller.ts:1` |
| Lessons / Learning | 6 Lesson Controller API (0.12), 22 Lesson Typing Interface, 26 Lesson Practice Pages, 29 Learn Page Content | `apps/backend/src/controllers/lesson.controller.ts:1`, `apps/frontend/src/app/learn/page.tsx:1` |
| Progress / Heatmap | 39 Progress Dashboard Charts, 43 PracticeHeatMap.tsx (0.36), 34 ChangeLog Concepts | `apps/frontend/src/components/PracticeHeatMap.tsx:1`, `WPMProgressChart.tsx:1` |
| Auth / Rate Limit | 8 Auth Session and API Base, 14 Auth Rate Limiting (0.17), 19 Middleware and Logger | `apps/frontend/src/lib/auth/authOptions.ts:1`, `apps/backend/src/middleware/rate-limiter.ts:1`, `apps/backend/src/middleware/auth.middleware.ts:1` |
| Achievements | 15 Achievement UI Context, 20 Achievements Page UI, 36 Achievement Award Logic (0.30) | `apps/backend/src/controllers/achievement.controller.ts:1`, `apps/frontend/src/context/AchievementContext.tsx:1` |
| AI Gemini Proxy | 30 AI Gemini Proxy Controller (0.29) | `apps/backend/src/controllers/ai.controller.ts:1` |
| Database | 21 Prisma Migrations, 41 schema.prisma (0.22), 24 Database Seed Scripts | `apps/backend/prisma/schema.prisma:1`, `seed*.ts` |
| UI Primitives | 27 UI Card Toast Primitives (0.27), 62 Tooltips, 35 App Layout Providers | `apps/frontend/src/components/ui/*` |
| Docs | 37 Documentation Hub Index | `docs/PROJECT_OVERVIEW.md:1`, `docs/API.md:1`, `docs/FILE_STRUCTURE.md:1` |
| Security Journals | Sentinel / Bolt / Palette | `.Jules/sentinel.md:1`, `.Jules/bolt.md:1`, `.Jules/palette.md:1` — do not overwrite, append only |

**API Mounts (all under `/api/v1` per `apps/backend/src/index.ts:1`):** `/auth`, `/tests`, `/users`, `/lessons`, `/achievements`, `/games`, `/assessment`, `/mistakes`. See `docs/API.md:1` for full contract.

**DB Models (`schema.prisma:10`):** `User`, `TestResult`, `Lesson`, `UserLessonProgress`, `Achievement`, `UserAchievement`, `GameScore`, `TypingMistake`, `UserWeakKeys`, `UserSkillAssessment`.

**Frontend Routes (`apps/frontend/src/app`):** `layout.tsx`, `page.tsx`, `dashboard/`, `learn/[id]/`, `learn/assessment/`, `games/`, `achievements/`, `progress/`, `leaderboard/`, `history/`, `auth/*`.

---

## 2. Workflows (Use Graph, Then Act)

**Before edit:**
- `graphify query` → identify 1–2 communities → read only those files via `read`.
- Respect `.Jules/*.md` learnings: Bolt = `Promise.all` for parallel DB reads, DB aggregation via `prisma.aggregate`/`groupBy`, O(L) skill-tree with `Map/Set`; Sentinel = Zod `.max()` bounds, `z.string().uuid()`, timeout via `AbortController`; Palette = `aria-label` + `Tooltip asChild` + `focus-visible:ring`.

**During edit:** keep one `TodoWrite` in_progress, mark completed after verification. Preserve `"$schema": "https://opencode.ai/config.json"` in `.opencode/opencode.json:1`.

**After edit (MANDATORY):**
1. Run `npm run typecheck` / `npm run lint` / `npm run test:ci` for touched workspace.
2. Run `graphify --update` if you touched code (`graphify-out/.graphify_python:1` stores interpreter) — code-only update is free (no LLM).
3. If `GRAPH_REPORT.md` communities changed or nodes/edges delta >5%, update this file and `instructions/project-map.md:1` (handled by `.opencode/skills/instruction-sync/SKILL.md:1`).
4. Commit; post-commit hook (`graphify hook`) auto-rebuilds graph. Then `git push`.

**Skills locally installed:** `.opencode/skills/graphify/SKILL.md:1` (copy of global) + `.opencode/skills/instruction-sync/SKILL.md:1`. Registered via `.opencode/opencode.json:10` `skills.paths: [".opencode/skills"]`.

---

## 3. Where to Look Instead of Grepping

- Architecture question → `GRAPH_REPORT.md:1` Communities + `graphify query`
- Perf question → `GRAPH_REPORT.md:168` Hyperedges (Database Performance Patterns) + `.Jules/bolt.md:1`
- Security question → `.Jules/sentinel.md:1` + Community 30 + 50 (`INTERNAL_API_SECRET`)
- UX/A11y → `.Jules/palette.md:1` + Community 62
- Feature inventory → `docs/FEATURES.md:1`, `docs/PROJECT_OVERVIEW.md:1`
- Agent config → `.opencode/opencode.json:1` (schema = `https://opencode.ai/config.json`)

> **Rule of thumb:** if answer exists in `GRAPH_REPORT.md` or via `graphify query`, NEVER read >3 raw source files. Cited `source_location` (e.g., `L1050`) in query output is authoritative.

---

## 4. Hook & Watch

- Post-commit hook: `graphify hook status` / `graphify hook install` (see `.opencode/skills/graphify/references/hooks.md:1`). Auto-runs AST extraction on changed code after every `git commit`.
- Watch mode: `graphify --watch` (no LLM) for live rebuilds.
- Fallback: `npm run graphify:update` if you add script.

Restart opencode after changing `.opencode/opencode.json` or agent/skill/plugin files (`opencode.json: loaded once at startup, not hot-reloaded`).

