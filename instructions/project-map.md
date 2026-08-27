# TypeMaster — Project Map (Graph-Derived)

Source: `graphify-out/GRAPH_REPORT.md:176` communities + `graphify-out/.graphify_labels.json:1` (140 labels), `graphify-out/graph.json:1` (1222 nodes / 1810 edges).

## Stack at a Glance

- **Frontend:** Next.js 14 App Router, React 18, TS (`apps/frontend`) — Tailwind + Radix UI + Framer Motion + Recharts + Zustand + TanStack Query
- **Backend:** Express + Prisma + PostgreSQL (`apps/backend`) — JWT + NextAuth bridge, Helmet, express-rate-limit, Zod
- **DB:** 7 migrations (`apps/backend/prisma/migrations/*:1`), 10 models (`schema.prisma:10`), seed scripts `seed.ts`, `seed-new-lessons.ts:1`, `seed-sections-4-6.ts:1`
- **Auth:** NextAuth credentials+Google (`apps/frontend/src/lib/auth/authOptions.ts:1`, `next-auth.d.ts:1`) → `/api/v1/auth/token` (secured via `INTERNAL_API_SECRET` per `.Jules/sentinel.md:9`, `Community 50:0.33`)
- **Deploy:** Frontend Vercel `typemaster-chirag.vercel.app`, Backend Render — frontend rewrites `/api/v1/*` via `apps/frontend/next.config.js:1`

## Community Hubs → Files (Query These First)

| Community (Cohesion) | Nodes | Entry File(s) | When to Query |
|---|---|---|---|
| 0 Frontend Game Clients (0.06) | 43: GamesClient, PromptDash, WordBlitz, StoryChain | `apps/frontend/src/app/games/GamesClient.tsx:1`, `.../components/games/*:1` | game logic |
| 6 Lesson Controller API (0.12) | 28: getLearningDashboard, getLearningStats, buildLessonsWithUnlockState | `apps/backend/src/controllers/lesson.controller.ts:1` | lesson progress perf |
| 8 Auth Session and API Base (0.11) | 22: API_BASE_URL, getApiBaseUrl, SessionUserWithId | `apps/frontend/src/lib/api.ts:1`, `lib/auth/*:1` | auth wiring |
| 10 Typing Test Core (0.11) | 19: TypingTest, generateTestText, Word | `apps/frontend/src/components/TypingTest.tsx:1` | test core |
| 14 Auth Rate Limiting (0.17) | 18: generateAccessToken, loginSchema, ensureUniqueUsername | `apps/backend/src/middleware/rate-limiter.ts:1`, `auth.controller.ts:1` | auth security |
| 15 Achievement UI Context (0.11) | 17: AchievementContext, AchievementToast | `apps/frontend/src/context/AchievementContext.tsx:1` | achievements |
| 30 AI Gemini Proxy (0.29) | 11: callGemini, getTypingFeedback, storyResponseSchema | `apps/backend/src/controllers/ai.controller.ts:1` | AI proxy |
| 31 Game Scores Leaderboards (0.30) | 11: getLeaderboard, getUserHighScores, parseGameType | `apps/backend/src/controllers/game.controller.ts:1` | game leaderboards |
| 32 Prisma Client Test API (0.23) | 9: createTestResult, getUserStats, getTestById | `apps/backend/src/controllers/test.controller.ts:1` | test persistence |
| 36 Achievement Award Logic (0.30) | 9: checkAndAwardAchievements, fetchUserMetrics | `apps/backend/src/controllers/achievement.controller.ts:1` | award flow |
| 39 Progress Dashboard Charts (0.24) | 6: LearningProgressDashboard, WPMProgressChart | `apps/frontend/src/components/{WPMProgressChart,PracticeHeatMap}.tsx:1` | charts |
| 43 PracticeHeatMap (0.36) | 9: calculateCurrentStreak, getLast365Days | `apps/frontend/src/components/PracticeHeatMap.tsx:1` | heatmap memoization |
| 41 schema.prisma (0.22) | 10: Project Layout, Runtime | `apps/backend/prisma/schema.prisma:1` | DB changes |

Full list: 140 communities, cohesion 0.04–0.67 — see `GRAPH_REPORT.md:176` + `graph.html` cluster view.

## God Nodes (Change with Care — High Fan-Out)

1. `cn()` 51 edges → `apps/frontend/src/lib/utils.ts:1` (Tailwind merge)
2. `compilerOptions` 25/22/20 edges → each `tsconfig.json:1`
3. `Button` 24 edges → `apps/frontend/src/components/ui/button.tsx:1`
4. `prisma` 17 edges → `apps/backend/src/utils/prisma.ts:1`
5. `logger` 13 edges → `apps/backend/src/utils/logger.ts:1`
6. `scripts` 15 edges → `package.json:6`

Edits to god nodes affect 10–50 dependents; prefer narrow, scoped changes.

## Hyperedges (Cross-Community Concepts)

- **AI Proxy Security Hardening** (`sentinel.md`): 4 nodes linked
- **NextAuth→JWT Bridge Security** (`AUTH_SETUP_GUIDE.md`): dual-auth + token provisioning + `INTERNAL_API_SECRET`
- **DB Performance Optimization** (`bolt.md`): `Promise.all` + `aggregate/groupBy` + O(L) skill-tree + in-memory derivation
- **Deployed Feature Set** (`FEATURES.md`): 6 features (typing test, learning, games, achievements, progress, auth)

See `GRAPH_REPORT.md:168` hyperedges.

## API Mounts

All under `/api/v1` per `apps/backend/src/index.ts:1`:

`/auth`, `/tests`, `/users`, `/lessons`, `/achievements`, `/games`, `/assessment`, `/mistakes` — see `docs/API.md:1` (80 lines).

## Surprising Connections (Worth Knowing)

- `PostgreSQL Service` ↔ `Postgres Test Service Container in CI` (semantically similar: `docker-compose.yml` → `ci.yml`)
- `Client-Side AI Key Exposure` ↔ `Gemini API Key Consumption Risk` (`sentinel.md` → `CODEBASE_AUDIT.md`)
- `Zod Validation` ↔ `API Controller Structure` (`sentinel.md` → `CONTRIBUTING.md`)

Full list `GRAPH_REPORT.md:153`.

## Frontend Routes (`apps/frontend/src/app`)

`layout.tsx:1`, `page.tsx:1`, `dashboard/page.tsx`, `learn/[id]/page.tsx`, `learn/assessment/page.tsx`, `games/page.tsx`, `achievements/page.tsx`, `progress/page.tsx`, `leaderboard/page.tsx`, `history/page.tsx`, `auth/*`.

Backend routes per `docs/FILE_STRUCTURE.md:20`: `index.ts` bootstraps middleware (`auth`, `rate-limiter`, `error-handler`, `cors`) then mounts `routes/*`.

## When to Add New Community

If you add a top-level feature (e.g., `apps/backend/src/controllers/notification.controller.ts`), expect a new community after next `graphify --update`. Update this file and `AGENTS.md` community table accordingly (automated via `.opencode/skills/instruction-sync/SKILL.md:1`).

