# TypeMaster

A full-stack typing platform for speed improvement and skill building. Built with a modern monorepo architecture featuring guided lessons, timed tests, games, progress tracking, and achievement systems.

**Live App:** https://typemaster-chirag.vercel.app/

---

## Project Overview

### What is TypeMaster?

TypeMaster helps users improve their typing speed and accuracy through structured practice. The platform combines:

- **Typing Tests** — Timed tests (30s, 60s, 180s) in Words, Time, and Quote modes
- **Guided Lessons** — Progressive curriculum across coding, normal text, and custom content
- **Skill Assessment** — Placement test to determine starting lesson level
- **Games** — Interactive typing games for engagement
- **Progress Tracking** — Heatmaps, streak counters, WPM/accuracy trends, weak-key analysis
- **Achievements** — Unlockable milestones for motivation
- **Leaderboards** — Competitive rankings

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Express.js, TypeScript, Prisma ORM, PostgreSQL |
| **Auth** | NextAuth.js (credentials + Google OAuth), JWT tokens |
| **Real-time** | Server-Sent Events (SSE) for live test updates |
| **Testing** | Jest, React Testing Library, Supertest |
| **Code Quality** | ESLint, Prettier, TypeScript strict mode |

### Monorepo Structure

```
typemaster/
├── apps/
│   ├── frontend/          # Next.js application
│   │   ├── src/
│   │   │   ├── app/       # App Router pages & layouts
│   │   │   ├── components/# Reusable UI components
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── lib/       # Utilities, API clients
│   │   │   └── types/     # TypeScript types
│   │   └── ...
│   └── backend/           # Express API server
│       ├── src/
│       │   ├── controllers/# Route handlers
│       │   ├── middleware/ # Auth, validation, error handling
│       │   ├── routes/     # API route definitions
│       │   ├── utils/      # Prisma, logger, helpers
│       │   └── ...
│       └── prisma/        # Database schema & migrations
├── packages/              # Shared packages (if any)
└── docs/                  # Documentation
```

---

## Running Locally

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** ≥ 14 (local or Docker)
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/chirag-gupta7/Type-Master.git
cd Type-Master
npm install
```

This installs dependencies for all workspaces (root, frontend, backend).

### 2. Environment Variables

Create the required `.env` files:

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/typemaster
JWT_SECRET=your-secure-random-string
JWT_REFRESH_SECRET=another-secure-random-string
PORT=5000
API_VERSION=v1
CORS_ORIGINS=http://localhost:3000
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-random-string
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret

# Optional: AI-powered feedback (requires Google AI Studio key)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

> **Tip:** Generate secure secrets with `openssl rand -base64 32`

### 3. Database Setup

```bash
cd apps/backend

# Run migrations (creates tables)
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Optional) Seed with sample lessons/achievements
npm run seed
```

### 4. Start Development Servers

From the **repo root** (runs both frontend and backend concurrently):

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

Or run individually:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

---

## Available Commands

Run from **repo root** unless noted:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend in watch mode |
| `npm run dev:frontend` | Frontend only (Next.js) |
| `npm run dev:backend` | Backend only (tsx watch) |
| `npm run build` | Build all workspaces for production |
| `npm run test` | Run all tests (watch mode) |
| `npm run test:ci` | Run tests once with coverage (CI mode) |
| `npm run typecheck` | TypeScript type checking (all workspaces) |
| `npm run lint` | Lint all workspaces |
| `npm run format` | Format with Prettier |
| `npm run clean` | Remove all `node_modules` and build artifacts |

### Backend-specific (run from `apps/backend/`)

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Run migrations in dev |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run seed` | Seed database with sample data |

---

## Key Features Walkthrough

### Typing Test (`/dashboard`)
- Three modes: **Words**, **Time**, **Quote**
- Configurable duration: 30s, 60s, 180s
- Real-time WPM, accuracy, raw WPM, error count
- Live mistake highlighting with weak-key detection

### Learn System (`/learn`)
- **Assessment** — Placement test to calibrate starting level
- **Coding Lessons** — Syntax-aware typing for programmers
- **Normal Lessons** — General prose and literature
- Progress tracking per lesson with star ratings

### Progress Dashboard (`/progress`)
- **Practice Heatmap** — GitHub-style contribution calendar
- **Streak Tracking** — Current & longest streaks
- **Statistics** — Total activities, active days, averages

### Weak Key Analysis (`/mistakes` API)
- Per-key error frequency
- Finger-based error mapping
- Targeted practice text generation

### Achievements (`/achievements`)
- Tiered unlocks (bronze/silver/gold/platinum)
- Categories: speed, accuracy, consistency, milestones
- Toast/modal notifications with ARIA accessibility

### Games (`/games`)
- Interactive typing challenges
- Score tracking and leaderboards

---

## API Reference

Base URL: `/api/v1`

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/token`, `POST /auth/register`, `POST /auth/login` |
| Tests | `POST /tests`, `GET /tests`, `GET /tests/:id` |
| Users | `GET /users/profile`, `PUT /users/profile`, `PUT /users/password` |
| Lessons | `GET /lessons`, `GET /lessons/:id`, `POST /lessons/:id/complete` |
| Achievements | `GET /achievements`, `GET /achievements/stats` |
| Assessment | `POST /assessment/start`, `POST /assessment/complete` |
| Mistakes | `POST /mistakes`, `GET /mistakes/weak-keys`, `GET /mistakes/practice` |

Full endpoint details: [`docs/API.md`](docs/API.md)

---

## Documentation

All documentation lives in [`docs/`](docs/):

| File | Purpose |
|------|---------|
| `QUICKSTART.md` | Minimal local setup guide |
| `API.md` | Complete endpoint reference |
| `PROJECT_OVERVIEW.md` | Architecture & data flow |
| `FILE_STRUCTURE.md` | Repository map |
| `FEATURES.md` | Feature inventory |
| `CODEBASE_AUDIT.md` | Security audit & known risks |

---

## Security Notes

- All mutating endpoints require JWT authentication
- Input validation via Zod schemas on every route
- Rate limiting on auth endpoints
- CORS restricted to configured origins
- Passwords hashed with bcrypt (cost factor 12)
- Refresh token rotation with reuse detection

Known risks tracked in [`docs/CODEBASE_AUDIT.md`](docs/CODEBASE_AUDIT.md).

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make changes with tests
4. Run `npm run typecheck && npm run lint && npm run test:ci`
5. Submit a PR

---

## License

MIT License — see `LICENSE` for details.