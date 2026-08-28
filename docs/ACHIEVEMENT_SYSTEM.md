# Achievement System

## Backend Routes

- `GET /api/v1/achievements` — list all achievements with unlock status (optional auth)
- `POST /api/v1/achievements/check` — check & award newly unlocked (manual fallback, idempotent via `skipDuplicates`)
- `GET /api/v1/achievements/stats` — aggregated stats + recent unlocks
- `GET /api/v1/achievements/progress` — per-achievement progress % + raw stats

## Persistence

- Achievement definitions: `Achievement` (20 entries seeded via `prisma/seed.ts:42`)
- User unlocks: `UserAchievement` (`@@unique([userId, achievementId])`, `skipDuplicates: true`)

## Achievements (20)

| # | Title | Type | Requirement | Points | Icon |
|---|-------|------|-------------|--------|------|
| 1 | First Steps | `firstSteps` | 1 test | 10 | target |
| 2 | First Lesson | `firstLesson` | 1 lesson | 10 | check |
| 3 | Early Bird | `earlyBird` | 5 tests | 15 | zap |
| 4 | Dedicated | `dedicated` | 10 tests | 20 | heart |
| 5 | Century Club | `centuryClub` | 25 tests | 30 | award |
| 6 | Committed | `committed` | 50 tests | 50 | flame |
| 7 | Unstoppable | `unstoppable` | 100 tests | 100 | trophy |
| 8 | Speed Demon | `speedDemon` | 50 WPM | 25 | zap |
| 9 | Lightning Fast | `lightningFast` | 80 WPM | 50 | flame |
| 10 | Typing Master | `typingMaster` | 100 WPM | 100 | trophy |
| 11 | Velocity 120 | `velocity120` | 120 WPM | 150 | crown |
| 12 | Perfectionist | `perfectionist` | 100% accuracy once | 30 | star |
| 13 | Sharpshooter | `sharpshooter` | 10×95%+ | 40 | target |
| 14 | Accuracy Ace | `accuracyAce` | 25×95%+ | 50 | star |
| 15 | Student | `student` | 5 lessons | 25 | check |
| 16 | Scholar | `scholar` | 20 lessons | 75 | award |
| 17 | Code Crafter | `codeCrafter` | 30 lessons | 40 | check |
| 18 | Graduate Typist | `graduateTypist` | all lessons | 150 | trophy |
| 19 | Hot Streak | `hotStreak` | 3 days/week | 30 | flame |
| 20 | Week Warrior | `weekWarrior` | 7 days/week | 50 | flame |

Points balanced: ~1050 total. Categories: `Intro` (firstSteps, firstLesson, earlyBird), `Speed` (speedDemon, lightningFast, typingMaster, velocity120), `Accuracy` (perfectionist, sharpshooter, accuracyAce), `Consistency` (dedicated, centuryClub, committed, unstoppable), `Learning` (student, scholar, codeCrafter, graduateTypist), `Streak` (hotStreak, weekWarrior).

Seeding: prod-safe via `findFirst({title})` + `create` (no destructive `deleteMany` when `NODE_ENV=production`). Dev still clears before seed.

## Frontend

- Primary route: `/achievements` (`apps/frontend/src/app/achievements/page.tsx:1`) — grouped by `TYPE_TO_CATEGORY`, shows progress % from `getAchievementProgress`
- Icons: `AchievementCard.tsx:1` (`ACHIEVEMENT_ICONS` includes `crown` for Velocity 120)
- Cache: `sessionStorage` 5min; `api.ts:189` scoped invalidation `achievements:*` on `saveTestResult` / `saveLessonProgress` + immediate `POST /check` call
- Providers: `AchievementContext` + `AchievementToast` / modals

## Trigger Points & Auto-Award Fix

- **Before fix:** only manual `POST /check` button; saving `TestResult` / `UserLessonProgress` did not award, cache stayed stale → progress 100% but locked.
- **After fix:** `awardAchievementsForUser()` helper extracted in `achievement.controller.ts:182`; called server-side after `TestResult.create` (`test.controller.ts:42`) and after `UserLessonProgress` upsert/update (`lesson.controller.ts:281`) — idempotent. Frontend also invalidates `achievements:*` and calls `checkAchievements()` via `testAPI.saveTestResult` and `lessonAPI.saveLessonProgress` (`api.ts:300,630`) and `ResultsScreen.tsx:40`. `POST /check` remains as fallback.
- `getAchievementProgress` now includes `firstSteps`, `firstLesson`, `perfectionist` + 6 expansion fields (`earlyBird`, `centuryClub`, `velocity120`, `accuracyAce`, `codeCrafter`, `hotStreak`) with `Math.min(...*100,100)`.
