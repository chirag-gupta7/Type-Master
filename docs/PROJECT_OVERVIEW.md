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

## Live + Runtime Behavior

- Production frontend runs on Vercel at `typemaster-chirag.vercel.app`.
- Frontend rewrites `/api/v1/*` to backend URL in `apps/frontend/next.config.js`.
- If `NEXT_PUBLIC_API_URL` is unset, frontend falls back to Render backend URL.

## Security Notes

- CORS allowlist comes from `CORS_ORIGINS`/`CORS_ORIGIN`.
- Rate limiting is enabled globally and stricter on auth routes.
- See `CODEBASE_AUDIT.md` for known security and quality gaps.
