# Testing Guide

## Workspace Commands

From root:

```bash
npm run test
npm run typecheck
npm run lint
```

Per package:

```bash
npm run test --workspace=apps/frontend
npm run test --workspace=apps/backend
```

## Current Caveats

- Frontend `next.config.js` currently allows builds with lint/type issues:
  - `eslint.ignoreDuringBuilds = true`
  - `typescript.ignoreBuildErrors = true`

For stricter CI, disable both and fail builds on errors.

## What to Verify After Changes

- Auth flow (login/logout/token refresh)
- Typing test save + stats retrieval
- Lesson progress update and recommendation route
- Game score save and leaderboard retrieval
