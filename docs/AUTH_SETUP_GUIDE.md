# Authentication Setup Guide

## Auth Model

TypeMaster uses dual auth layers:

1. NextAuth session handling in frontend
2. Backend JWT for Express API authorization

The frontend obtains backend JWT via `POST /api/v1/auth/token` and sends it as `Authorization: Bearer ...`.

## Required Variables

In `apps/frontend/.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_me
GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me
NEXT_PUBLIC_API_URL=http://localhost:5000
```

In `apps/backend/.env`:

```env
JWT_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
DATABASE_URL=postgresql://...
```

## Validation Checklist

- Can sign in at `/login`
- Session exists in NextAuth
- Backend token is present and accepted on protected API calls
- Protected routes return 401 when no token is sent

## Security Note

JWT verification now requires real signed JWTs in backend middleware; unsigned base64 payload fallback is removed.
