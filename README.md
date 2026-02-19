# TypeMaster

TypeMaster is a full-stack typing platform with tests, guided lessons, games, progress tracking, and achievements.

- Live app: https://typemaster-chirag.vercel.app/
- Frontend: Next.js 14 (App Router) in `apps/frontend`
- Backend: Express + Prisma in `apps/backend`
- Database: PostgreSQL

## Current Product Surface

Public-facing pages/routes currently implemented:

- `/` (landing)
- `/dashboard` (typing test)
- `/learn`, `/learn/[id]`, `/learn/assessment`, `/learn/coding`, `/learn/normal`
- `/games`
- `/leaderboard`
- `/achievements`
- `/progress`
- `/history`
- `/settings`
- `/login`, `/register`

## API (Mounted in Backend)

Base: `/api/v1`

- `auth` (`/auth`)
- `tests` (`/tests`)
- `users` (`/users`)
- `lessons` (`/lessons`)
- `achievements` (`/achievements`)
- `games` (`/games`)
- `assessment` (`/assessment`)
- `mistakes` (`/mistakes`)

See `docs/API.md` for the endpoint table.

## Monorepo Commands

From repo root:

```bash
npm install
npm run dev
```

Other useful commands:

```bash
npm run build
npm run test
npm run typecheck
npm run lint
```

## Required Environment Variables

### Backend (`apps/backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/typemaster
JWT_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
PORT=5000
API_VERSION=v1
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`apps/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_me
GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me
```

Optional (currently used in client code):

```env
NEXT_PUBLIC_GEMINI_API_KEY=replace_me
```

## Database Setup

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
npm run seed
```

## Documentation Index

All docs are in `docs/`:

- `docs/QUICKSTART.md` - local setup
- `docs/API.md` - backend endpoint reference
- `docs/PROJECT_OVERVIEW.md` - architecture and runtime flow
- `docs/FILE_STRUCTURE.md` - repository map
- `docs/FEATURES.md` - feature inventory
- `docs/CODEBASE_AUDIT.md` - errors, loopholes, and risk report

## Security + Quality Status

This refresh includes backend hardening for token validation and user-scope checks in assessment/mistake APIs.

Open risks and actionable items are tracked in `docs/CODEBASE_AUDIT.md`.
