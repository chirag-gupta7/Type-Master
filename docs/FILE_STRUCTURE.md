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
- `routes/` - route grouping
- `controllers/` - request handlers
- `middleware/` - auth, rate limiting, error handling
- `utils/` - prisma client, logger

## Database (`apps/backend/prisma`)

- `schema.prisma` - data model and enums
- `migrations/` - migration history
- `seed.ts` and other seed scripts - data initialization
