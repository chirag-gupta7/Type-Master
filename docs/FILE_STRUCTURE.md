# File Structure

## Root

- `apps/frontend` - Next.js application
- `apps/backend` - Express API + Prisma
- `docs` - project documentation
- `scripts` - utility scripts

## Frontend (`apps/frontend/src`)

- `app/` - route pages and App Router layout
- `components/` - UI + domain components
- `lib/` - API client, auth wiring, helpers
- `store/` - Zustand stores
- `context/` - React context providers
- `hooks/` - custom hooks
- `types/` - shared frontend types

## Backend (`apps/backend/src`)

- `index.ts` - server bootstrap + middleware + route mounts
- `routes/` - route grouping (`auth`, `tests`, `users`, `lessons`, `achievements`,
  `games`, `assessment`, `mistakes`, `ai`)
- `controllers/` - request handlers
- `config/achievements.ts` - single source for the 20 achievements
- `middleware/` - auth, rate limiting, error handling
- `utils/` - prisma client, logger

## Database (`apps/backend/prisma`)

- `schema.prisma` - data model and enums (13 models: User, Account, Session,
  VerificationToken, TestResult, Lesson, UserLessonProgress, Achievement,
  UserAchievement, GameScore, TypingMistake, UserWeakKeys, UserSkillAssessment)
- `migrations/` - migration history
- `seed.ts` + `comprehensive-seed.ts` (S1-S3: 24/36/41) +
  `seed-sections-4-6.ts` (S4-S6: 25 each) + `seed-coding-lessons.ts`
  (Python/Java/C++/C: 30 each) + `seed-new-lessons.ts` (S11-S13: 10 each) -
  data initialization (326 lessons total)
