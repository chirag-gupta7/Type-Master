# Auth Quick Reference

## Core Files

- Frontend NextAuth config: `apps/frontend/src/lib/auth/authOptions.ts`
- NextAuth route handler: `apps/frontend/src/app/api/auth/[...nextauth]/route.ts`
- Backend auth controller: `apps/backend/src/controllers/auth.controller.ts`
- Backend auth middleware: `apps/backend/src/middleware/auth.middleware.ts`

## Login/Register Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/token`

## Protected Route Pattern

- Backend routes call `authenticate` middleware.
- Client sends `Authorization: Bearer <backend-jwt>`.
