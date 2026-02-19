# Quickstart

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 15+

## 1) Install

```bash
npm install
```

## 2) Configure Environment

Create:

- `apps/backend/.env`
- `apps/frontend/.env.local`

Minimum backend vars:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/typemaster
JWT_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
PORT=5000
API_VERSION=v1
CORS_ORIGINS=http://localhost:3000
```

Minimum frontend vars:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_me
GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me
```

## 3) Prepare Database

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
npm run seed
```

## 4) Start Dev Servers

From repo root:

```bash
npm run dev
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:5000`

## 5) Validate

```bash
npm run typecheck
npm run test
```
