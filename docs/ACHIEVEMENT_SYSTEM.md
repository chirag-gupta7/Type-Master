# Achievement System

## Backend Routes

- `GET /api/v1/achievements`
- `POST /api/v1/achievements/check`
- `GET /api/v1/achievements/stats`
- `GET /api/v1/achievements/progress`

## Persistence

- Achievement definitions: `Achievement`
- User unlocks: `UserAchievement`

## Frontend

- Primary route: `/achievements`
- Achievement context/provider wired in root layout

## Typical Trigger Points

- After tests
- After lesson completions
- During progression milestones
