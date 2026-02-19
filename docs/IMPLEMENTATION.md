# Implementation Notes

## Backend Bootstrap

`apps/backend/src/index.ts` configures:

- `helmet`
- CORS allowlist from env
- JSON/body parsing
- global rate limiter
- API mounts under `/api/v1`
- centralized error handler

## Frontend API Access

`apps/frontend/src/lib/api.ts`:

- resolves base URL from env/fallback
- acquires backend JWT from session or token endpoint
- wraps fetch calls and attaches auth header

## Data Layer

Prisma schema covers:

- users/sessions/accounts
- test results
- lessons and per-user lesson progress
- achievements and unlock records
- game scores
- typing mistakes, weak keys, skill assessments
