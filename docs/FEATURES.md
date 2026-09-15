# Feature Inventory

This is the implemented feature set based on current frontend routes and backend APIs.

## Typing Test

- Route: `/dashboard`
- Core: timed tests, WPM/accuracy metrics, result history
- API: `/tests`, `/tests/stats`

## Learning System (326 lessons, 13 sections)

- Routes: `/learn`, `/learn/[id]`, `/learn/assessment`, `/learn/coding`, `/learn/normal`
- Sections: S1 Foundation (24), S2 Skill Building (36), S3 Advanced Techniques (41),
  S4 Speed & Fluency (25), S5 Mastery (25), S6 Programming (25), S7 Python (30),
  S8 Java (30), S9 C++ (30), S10 C (30), S11 Advanced Punctuation (10),
  S12 Code Syntax (10), S13 Speed Drills (10)
- API: lesson listings, checkpoints, section summaries (`GET /lessons/sections`),
  dashboard, progress save/analytics
- Backed by `Lesson` and `UserLessonProgress` models

## Games (WordBlitz, PromptDash, StoryChain)

- Route: `/games`
- Game categories include leaderboard-backed game modes
- API: game score save, highscores, history, stats

## Achievements (20 badges)

- Route: `/achievements`
- API: list + unlock check + stats/progress
- Models: `Achievement`, `UserAchievement`
- Defined once in `apps/backend/src/config/achievements.ts`

## Progress + History

- Routes: `/progress`, `/history`
- Aggregated performance and progression views from tests/lessons/games

## Authentication

- Routes: `/login`, `/register`
- NextAuth + Credentials + Google provider
- Backend token bridge via `/api/v1/auth/token` (internal-only, `INTERNAL_API_SECRET`)

## AI Coaching (Gemini proxy)

- API: `POST /ai/typing-feedback`, `GET /ai/writing-prompt`,
  `POST /ai/writing-feedback`, `POST /ai/story-response`
- Powers typing feedback and StoryChain/PromptDash prompts

## Assessment + Mistakes

- Routes: `/learn/assessment`
- API: `/assessment/start`, `/assessment/complete`, `/assessment/latest/:userId`;
  `/mistakes/log`, `/mistakes/analysis/:userId`, `/mistakes/practice/:userId`
- Models: `TypingMistake`, `UserWeakKeys`, `UserSkillAssessment`
