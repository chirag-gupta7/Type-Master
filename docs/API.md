# API Reference

Base URL: `/api/v1`

## Health

- `GET /health`

## Auth (`/auth`)

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/token` (internal-only, `INTERNAL_API_SECRET`)

## Tests (`/tests`) - Auth Required

- `POST /tests`
- `GET /tests`
- `GET /tests/stats`
- `GET /tests/:id`

## Users (`/users`) - Auth Required

- `GET /users/profile`
- `PUT /users/profile`

## Lessons (`/lessons`)

Public/optional auth:

- `GET /lessons`
- `GET /lessons/checkpoints`
- `GET /lessons/sections`
- `GET /lessons/section/:sectionId`
- `GET /lessons/:id`

Private:

- `GET /lessons/dashboard`
- `GET /lessons/recommended/next`
- `POST /lessons/progress`
- `GET /lessons/progress/stats`
- `GET /lessons/progress/visualization`

## Achievements (`/achievements`)

Public/optional auth:

- `GET /achievements`

Private:

- `POST /achievements/check`
- `GET /achievements/stats`
- `GET /achievements/progress`

## Games (`/games`)

Public/optional auth:

- `GET /games/leaderboard`

Private:

- `POST /games/score`
- `GET /games/highscores`
- `GET /games/history`
- `GET /games/stats`

## Assessment (`/assessment`) - Auth Required

- `POST /assessment/start`
- `POST /assessment/complete`
- `GET /assessment/latest/:userId` (request user must match authenticated user)

## Mistakes (`/mistakes`) - Auth Required

- `POST /mistakes/log`
- `GET /mistakes/analysis/:userId` (request user must match authenticated user)
- `GET /mistakes/practice/:userId` (request user must match authenticated user)

## AI (`/ai`) - Auth Required (Gemini proxy)

- `POST /ai/typing-feedback`
- `GET /ai/writing-prompt`
- `POST /ai/writing-feedback`
- `POST /ai/story-response`
