# Project Overview

## What TypeMaster Is

TypeMaster is a monorepo typing platform with:

- real-time typing tests (`/dashboard`)
- progressive lesson flow (`/learn`)
- minigames (`/games`)
- achievements and progress analytics (`/achievements`, `/progress`)

## Architecture

- Frontend: Next.js App Router (`apps/frontend`)
- Backend: Express API (`apps/backend/src/index.ts`)
- ORM: Prisma (`apps/backend/prisma/schema.prisma`)
- DB: PostgreSQL
- Auth:
  - NextAuth in frontend (`/api/auth/[...nextauth]`)
  - Backend JWT for API authorization (`Authorization: Bearer ...`)

## API Mounts

Backend mounts these route groups under `/api/v1`:

- `/auth`
- `/tests`
- `/users`
- `/lessons`
- `/achievements`
- `/games`
- `/assessment`
- `/mistakes`
- `/ai` (Gemini proxy: typing feedback, writing prompts/feedback, story responses)

## Content Scale (seeded via `apps/backend/prisma/seed.ts`)

- **326 lessons across 13 sections:** S1 Foundation (24), S2 Skill Building (36),
  S3 Advanced Techniques (41), S4 Speed & Fluency (25), S5 Mastery (25),
  S6 Programming (25), S7 Python (30), S8 Java (30), S9 C++ (30), S10 C (30),
  S11 Advanced Punctuation (10), S12 Code Syntax (10), S13 Speed Drills (10)
- **20 achievements** (single source: `apps/backend/src/config/achievements.ts`)
- **3 games:** WordBlitz, PromptDash, StoryChain (scores + global leaderboards)
- **9 API route groups** under `/api/v1` (list above)
- **13 Prisma models:** User, Account, Session, VerificationToken, TestResult,
  Lesson, UserLessonProgress, Achievement, UserAchievement, GameScore,
  TypingMistake, UserWeakKeys, UserSkillAssessment

## Live + Runtime Behavior

- Production frontend runs on Vercel at `typemaster-chirag.vercel.app`.
- Frontend rewrites `/api/v1/*` to backend URL in `apps/frontend/next.config.js`.
- If `NEXT_PUBLIC_API_URL` is unset, frontend falls back to Render backend URL.

## Security Notes

- CORS allowlist comes from `CORS_ORIGINS`/`CORS_ORIGIN`.
- Rate limiting is enabled globally and stricter on auth routes.
- See `CODEBASE_AUDIT.md` for known security and quality gaps.
