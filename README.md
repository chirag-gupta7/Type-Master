# TypeMaster — Master the Art of Typing

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express" alt="Express"/>
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma" alt="Prisma"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
</p>

<p align="center">
  <strong>A polished, production-grade typing mastery platform.</strong><br/>
  Real-time WPM engine • Guided lessons with unlocks • AI coaching • Games & leaderboards • Progress analytics
</p>

<p align="center">
  <a href="https://typemaster-chirag.vercel.app/"><strong>▸ Live Demo</strong></a> &nbsp;·&nbsp;
  <a href="#quick-start">Quick Start</a> &nbsp;·&nbsp;
  <a href="#architecture">Architecture</a> &nbsp;·&nbsp;
  <a href="#features">Features</a> &nbsp;·&nbsp;
  <a href="docs/API.md">API Docs</a>
</p>

---

## ✨ Visual Showcase

> All images below are live Unsplash placeholders — replace with real screenshots as you ship.

| Area | Preview |
|------|---------|
| **Landing & Hero** — fluid type, live preview, theme-aware gradients | ![Landing](https://source.unsplash.com/1200x675/?dashboard,minimal,keyboard) |
| **Typing Test** — centered caret, progress ring, 60fps word viewport | ![Typing Test](https://source.unsplash.com/1200x675/?keyboard,typing,neon) |
| **Learn** — section progress, locked/unlocked states, paginated lessons | ![Learn](https://source.unsplash.com/1200x675/?learning,education,typing) |
| **Games** — Word Blitz / Prompt Dash / Story Chain cards | ![Games](https://source.unsplash.com/1200x675/?gaming,arcade,colorful) |
| **Progress & Analytics** — heatmap, WPM chart, weak-key insights | ![Progress](https://source.unsplash.com/1200x675/?analytics,charts,dark) |
| **Leaderboard & Achievements** — global rankings, unlock animations | ![Leaderboard](https://source.unsplash.com/1200x675/?leaderboard,trophy,competition) |

---

## 🧭 Table of Contents

- [Why TypeMaster](#why-typemaster)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Architecture & Data Flow](#architecture--data-flow)
- [Features Deep Dive](#features-deep-dive)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Docker Compose](#docker-compose)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Design System](#design-system)
- [Accessibility](#accessibility)
- [Testing & Quality](#testing--quality)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Why TypeMaster

TypeMaster is not a weekend typing toy — it is a full learning platform:

- **Performance-first typing engine**: `React.memo` word rendering → **O(1)** per keystroke, `requestAnimationFrame`-friendly viewport, no layout thrash.
- **Learning science**: progressive unlocks, checkpoints, weak-key & finger mapping, targeted practice generation.
- **Joyful by default**: games that teach, streaks that motivate, achievements that celebrate without interrupting flow.
- **Accessible & responsive**: WCAG AA, keyboard-first, flawless from 320px to 4K.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript | SSR + client islands, `next/font` (Geist) |
| **Styling** | Tailwind CSS 3, `tailwindcss-animate`, `clsx` + `tailwind-merge` | Design tokens in `globals.css`, dark-first |
| **Motion** | Framer Motion 11 | Micro-interactions, page transitions |
| **State** | Zustand, TanStack Query 5 | `store/theme`, `store/games`, `store/ui` |
| **Charts** | Recharts 3 | WPM/accuracy trends |
| **Auth** | NextAuth 4 (credentials + Google) → Backend JWT bridge | `INTERNAL_API_SECRET` guards `/auth/token` |
| **Backend** | Express 4, TypeScript, Helmet, `express-rate-limit`, Zod | All routes under `/api/v1` |
| **DB** | PostgreSQL 15, Prisma 6 | 10 models, 7 migrations, typed client |
| **AI** | Google Gemini (server-proxied) | Prompt generation, typing & writing feedback |
| **Infra** | Docker Compose, Vercel (frontend), Render (backend) | Health checks, managed Postgres |
| **Quality** | Jest, RTL, Supertest, ESLint, Prettier, strict TS | `typecheck` + `lint` + `test:ci` |

---

## Monorepo Structure

```
typemaster/
├── apps/
│   ├── frontend/                 # Next.js 14 App Router
│   │   ├── src/
│   │   │   ├── app/              # Routes: /, /dashboard, /learn, /games, /progress, /leaderboard, /achievements, /history, /auth
│   │   │   ├── components/       # TypingTest, VisualKeyboard, HandModel3D, AnimatedHandOverlay, ResultsScreen, games/*
│   │   │   ├── lib/              # api.ts, textGenerator.ts, utils.ts, sectionCompletion.ts
│   │   │   ├── store/            # theme, games, ui (Zustand)
│   │   │   ├── hooks/            # useAchievementChecker, etc.
│   │   │   └── types/            # Shared TS types
│   │   ├── tailwind.config.ts
│   │   └── next.config.js        # /api/v1/* rewrite to backend
│   └── backend/                  # Express + Prisma
│       ├── src/
│       │   ├── controllers/      # auth, test, lesson, achievement, game, ai, mistake, assessment
│       │   ├── routes/           # Route definitions (mounted in index.ts)
│       │   ├── middleware/       # auth, rate-limiter, error-handler
│       │   ├── utils/            # prisma, logger, cors
│       │   └── index.ts          # App bootstrap
│       └── prisma/
│           ├── schema.prisma     # 10 models
│           ├── migrations/       # 7 migrations
│           └── seed*.ts
├── docs/                         # PROJECT_OVERVIEW, API, FILE_STRUCTURE, FEATURES, CODEBASE_AUDIT
├── docker-compose.yml
├── package.json                  # Workspaces: frontend, backend
└── graphify-out/                 # Knowledge graph (142 communities, 1288 nodes)
```

---

## Architecture & Data Flow

### High-Level System

```mermaid
flowchart TB
    User([User / Browser]) --> FE[Next.js 14 Frontend<br/>App Router + Zustand + TanStack Query]
    FE -->|/api/v1/* rewrite| BE[Express Backend<br/>/api/v1/*]
    FE -->|NextAuth| NA[NextAuth<br/>credentials + Google]
    NA -->|POST /auth/token<br/>INTERNAL_API_SECRET| BE
    BE --> JWT[JWT Access + Refresh]
    BE --> Prisma[Prisma Client]
    Prisma --> PG[(PostgreSQL)]
    BE --> Gemini[Google Gemini<br/>via server proxy]
    BE --> RateLimit[Rate Limiter<br/>express-rate-limit]
    BE --> Helmet[Helmet + CORS + Zod]
    FE --> Theme[Theme Store<br/>--theme-primary CSS vars]
```

### Typing Test — Real-Time Loop

```mermaid
sequenceDiagram
    participant U as User
    participant TT as TypingTest.tsx
    participant Store as useTypingStore (Zustand)
    participant API as testAPI / aiAPI
    participant BE as Express / Prisma
    U->>TT: Keystrokes (hidden input, Space handled)
    TT->>Store: commitUserInput(prev => next) — O(1) memo word split
    Store-->>TT: wpm / accuracy / errors (derived)
    TT->>TT: Center active word (scrollIntoView)
    TT->>TT: ResultsScreen (WPM ring, breakdown)
    TT->>API: getTypingFeedback({wpm, accuracy, errors})
    API->>BE: POST /api/v1/ai/feedback
    BE-->>API: feedback
    API-->>TT: render AI feedback
    TT->>API: saveTestResult (if authenticated)
```

### Learn & Unlock Flow

```mermaid
flowchart LR
    A[GET /lessons/sections?practice=normal] --> B[SectionSummary[]<br/>completion% + firstUnlockedPage]
    B --> C[GET /lessons/sections/:id/pages/:n]
    C --> D[SectionPage<br/>paginated lessons + isUnlocked/isCompleted]
    D --> E{isUnlocked?}
    E -->|yes| F[/learn/:id<br/>practice + save progress/]
    E -->|no| G[Preview only<br/>no navigation]
    F --> H[POST /lessons/:id/complete<br/>stars + bestWpm]
    H --> I[Unlock next lessons<br/>derived in-memory]
```

### Auth — NextAuth → JWT Bridge

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant NA as NextAuth
    participant BE as Backend /auth/token
    participant DB as Postgres
    FE->>NA: signIn credentials / Google
    NA->>BE: POST /api/v1/auth/token<br/>header x-internal-secret
    BE->>BE: internalOnly middleware<br/>timingSafeEqual
    BE->>DB: findOrCreateUserForToken
    BE-->>NA: {accessToken, refreshToken, user}
    NA-->>FE: session (JWT) with accessToken
    FE->>BE: Authenticated calls<br/>Authorization: Bearer <accessToken>
```

### Database — Core Models

```mermaid
erDiagram
    User ||--o{ TestResult : has
    User ||--o{ UserLessonProgress : has
    User ||--o{ UserAchievement : has
    User ||--o{ GameScore : has
    User ||--o{ TypingMistake : has
    User ||--o{ UserWeakKeys : has
    User ||--o{ UserSkillAssessment : has
    Lesson ||--o{ UserLessonProgress : tracked
    Lesson ||--o{ TypingMistake : in
    Achievement ||--o{ UserAchievement : awarded
    User ||--o{ Account : oauth
    User ||--o{ Session : session
```

---

## Features Deep Dive

### ⌨️ Dynamic Typing Test

- Modes: **Words / Time / Quote**, durations **30s / 60s / 180s**
- Live **WPM**, **accuracy**, **raw WPM**, **error count**, character breakdown
- Dual viewport: **horizontal** (TypeRacer-style centered) + **vertical** (classic scroll)
- Hidden input pattern keeps UI clean; `Space` advances words, `Backspace` intentionally disabled for accuracy fidelity
- AI feedback after each run via server-proxied Gemini

### 📚 Guided Learning (100-Lesson System)

- Tracks: **Normal**, **Coding** (syntax-aware), **Assessment** (placement)
- Sections with progress rings, paginated lessons (`PAGE_COUNT = 5`), in-memory unlock derivation
- Per-lesson targets: `targetWpm`, `minAccuracy`, `keys`, `exerciseType`
- Checkpoint lessons gate progression; stars (0–3) and best scores persisted

### 🧠 Mistake Analysis & Weak Keys

- Every keystroke compared server-side; `TypingMistake` + aggregated `UserWeakKeys`
- `GET /mistakes/weak-keys` → finger-mapped heat; `GET /mistakes/practice` → targeted text
- `VisualKeyboard`, `HandModel3D`, `AnimatedHandOverlay` render finger zones with WCAG AA contrast and motion-reduced fallbacks

### 🏆 Achievements & Streaks

- Tiered (bronze → platinum) across **speed / accuracy / consistency / milestones**
- `checkAndAwardAchievements()` runs on test & lesson completion; toast + modal with `aria-live`
- `PracticeHeatMap` (GitHub-style) + current/longest streak derived client-side

### 🎮 Games

- **Word Blitz** — falling words, combo bonus, 60s
- **Prompt Dash** — AI prompt → 60s creative sprint, WPM scoring + writing coach
- **Story Chain** — alternating AI/user sentences, 3m, AI story coach
- Guest: 1 free game; authenticated: unlimited + persisted `GameScore` + `GET /games/leaderboard`

### 🤖 AI Integrations (Server-Proxied)

- `callGemini()` never exposes keys to the client; Zod-validated prompts, `AbortController` timeouts
- Endpoints: `generateWritingPrompt`, `getStoryResponse`, `getTypingFeedback`, `getWritingFeedback`

---

## Quick Start

### Prerequisites

- **Node.js ≥ 18**, **npm ≥ 9**, **PostgreSQL ≥ 14** (or Docker), **Git**

### 1. Clone & Install

```bash
git clone https://github.com/chirag-gupta7/Type-Master.git
cd Type-Master
npm install
```

### 2. Environment Variables

**Backend — `apps/backend/.env`**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/typemaster
JWT_SECRET=your-secure-random-string
JWT_REFRESH_SECRET=another-secure-random-string
PORT=5000
API_VERSION=v1
CORS_ORIGINS=http://localhost:3000
TRUST_PROXY=1
INTERNAL_API_SECRET=shared-secret-for-nextauth-bridge
GEMINI_API_KEY=your-google-ai-studio-key
```

**Frontend — `apps/frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-random-string
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
INTERNAL_API_SECRET=same-value-as-backend
# No NEXT_PUBLIC_GEMINI_API_KEY — Gemini is server-proxied
```

> Generate secrets: `openssl rand -base64 32`

### 3. Database

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
npm run seed
```

### 4. Run

From repo root (concurrently):

```bash
npm run dev
# Frontend http://localhost:3000
# Backend  http://localhost:5000  (health: /health)
```

Or individually:

```bash
npm run dev:frontend
npm run dev:backend
```

---

## Environment Variables

| Var | Where | Required | Purpose |
|-----|-------|----------|---------|
| `DATABASE_URL` | backend | Yes | Postgres connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | backend | Yes | Sign access / refresh tokens |
| `PORT` | backend | No | Default `5000` |
| `API_VERSION` | backend | No | Default `v1` (`/api/v1/*`) |
| `CORS_ORIGINS` | backend | No | Comma-separated allowlist |
| `TRUST_PROXY` | backend | No | `1` behind Vercel/Render proxy |
| `INTERNAL_API_SECRET` | both | Yes | Guard `POST /auth/token` |
| `GEMINI_API_KEY` | backend | No | AI features (graceful fallback without) |
| `NEXT_PUBLIC_API_URL` | frontend | Yes | Backend origin |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | frontend | Yes | NextAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | frontend | No | Google OAuth |

---

## Docker Compose

The compose file ships **Postgres 15**, **Redis 7**, and the **backend** with health checks:

```bash
# Configure secrets
cp apps/backend/.env.example apps/backend/.env  # then edit JWT_* / INTERNAL_API_SECRET

# Start everything
docker compose up --build

# Or only infra (run frontend locally)
docker compose up postgres redis -d
npm run dev:frontend
```

Services:

- `postgres` → `5432` (`typemaster-postgres`, volume `postgres-data`)
- `redis` → `6379` (`typemaster-redis`, volume `redis-data`)
- `backend` → `5000` (runs `prisma migrate deploy && npm start`)

> For local Postgres without Docker: `createdb typemaster` and set `DATABASE_URL` accordingly.

---

## Available Scripts

From repo root:

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend + backend concurrently |
| `npm run dev:frontend` / `dev:backend` | Single workspace |
| `npm run build` | Build all workspaces |
| `npm run test` | Jest watch (all) |
| `npm run test:ci` | CI with coverage |
| `npm run typecheck` | `tsc --noEmit` all workspaces |
| `npm run lint` | ESLint all workspaces |
| `npm run format` | Prettier write |
| `npm run clean` | Remove `node_modules` / build artifacts |

Backend (`apps/backend/`):

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | `migrate dev` |
| `npm run prisma:studio` | Prisma Studio GUI |
| `npm run seed` | Seed lessons & achievements |

---

## API Reference

Base: `/api/v1` — Full spec in [`docs/API.md`](docs/API.md)

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register` · `POST /auth/login` · `POST /auth/token` (internal) · `POST /auth/refresh` |
| **Tests** | `POST /tests` · `GET /tests` · `GET /tests/:id` · `GET /tests/stats` |
| **Users** | `GET /users/profile` · `PUT /users/profile` · `PUT /users/password` |
| **Lessons** | `GET /lessons/sections` · `GET /lessons/sections/:id/pages/:n` · `GET /lessons/:id` · `POST /lessons/:id/complete` |
| **Progress** | `GET /lessons/dashboard` · `GET /lessons/stats` |
| **Achievements** | `GET /achievements` · `GET /achievements/stats` · `POST /achievements/check` |
| **Games** | `POST /games/score` · `GET /games/stats` · `GET /games/leaderboard?gameType=` |
| **Assessment** | `POST /assessment/start` · `POST /assessment/complete` · `GET /assessment/latest` |
| **Mistakes** | `POST /mistakes` · `GET /mistakes/weak-keys` · `GET /mistakes/practice` |
| **AI** | `POST /ai/prompt` · `POST /ai/story` · `POST /ai/feedback` · `POST /ai/writing-feedback` |

```mermaid
flowchart LR
    A[Client] --> B{Auth?}
    B -->|No| C[Public: /auth/*, GET /lessons/sections]
    B -->|Bearer JWT| D[Protected: /tests, /lessons/:id/complete, /games, /mistakes]
    D --> E[Zod Validation]
    E --> F[Controller]
    F --> G[Prisma aggregate/groupBy<br/>Promise.all where independent]
```

---

## Design System

- **Tokens**: HSL CSS variables in `globals.css` — `--background`, `--foreground`, `--card`, `--border`, `--ring`, plus `--theme-primary/secondary/accent` hydrated from Zustand.
- **Dark-first** with `.light` opt-in; `next-themes` + `ThemeSelector` (10 presets: Neon Cyan, Electric Purple, etc.).
- **Glass**: `.glass` / `.glass-strong` utilities (backdrop-blur + inset border + glow).
- **Typography**: Geist Sans + Geist Mono + Inter via `next/font`, fluid scale, `text-wrap: balance`.
- **Motion**: Framer Motion, `prefers-reduced-motion` respected, 60fps typing path memoized.
- **Primitives**: Radix Dialog / Dropdown / NavigationMenu / Toast / Tooltip, `Button` (default/primary/destructive/outline/ghost/glass), `Card` (glass by default).

---

## Accessibility

- **WCAG AA**: contrast-checked tokens, visible `:focus-visible` rings, `Skip to content` link, `aria-label`/`aria-pressed`/`aria-current` throughout.
- **Keyboard**: global `Ctrl+1..7` nav shortcuts, all games use native inputs with proper labels, `VisualKeyboard` has `role="img"` + `aria-label`.
- **Screen readers**: `aria-live` for toasts, semantic landmarks (`header`, `main`, `nav`), Radix primitives handle focus trapping.

---

## Testing & Quality

```bash
npm run typecheck   # tsc --noEmit (all workspaces)
npm run lint        # ESLint
npm run test:ci     # Jest --ci --coverage (frontend: jest + RTL, backend: Supertest)
```

- Frontend: `jest` + `jest-environment-jsdom` + `@testing-library/react` + `@testing-library/user-event`
- Backend: `jest` + `ts-jest` + `supertest`
- Graph sync after code changes: `npm run graphify:update` (`graphify --update`, no LLM cost)

---

## Deployment

- **Frontend** → Vercel (`typemaster-chirag.vercel.app`), rewrites `/api/v1/*` to backend via `next.config.js`
- **Backend** → Render, `npm start` after `prisma migrate deploy`
- **DB** → Managed Postgres (Render / Neon / local)
- **Env**: set `CORS_ORIGINS` to your Vercel URL(s), `TRUST_PROXY=1`, and keep `INTERNAL_API_SECRET` identical on both sides

---

## Contributing

1. Fork & branch: `git checkout -b feat/your-feature`
2. Code + tests
3. `npm run typecheck && npm run lint && npm run test:ci`
4. Commit with conventional commits (`feat(typing): ...`) and open a PR

See [`docs/FILE_STRUCTURE.md`](docs/FILE_STRUCTURE.md) and [`graphify-out/GRAPH_REPORT.md`](graphify-out/GRAPH_REPORT.md) for the full map.

---

## Security

- JWT access + refresh with rotation & reuse detection
- `helmet`, `express-rate-limit` on auth, strict CORS allowlist, `timingSafeEqual` for `INTERNAL_API_SECRET`
- Zod validation on every route, bcrypt cost 12
- Gemini keys are server-only — never `NEXT_PUBLIC_*`
- Known risks tracked in [`docs/CODEBASE_AUDIT.md`](docs/CODEBASE_AUDIT.md) and `.Jules/sentinel.md`

---

## License

MIT — see [`LICENSE`](LICENSE) for details.

<p align="center"><sub>Built with care for typists who care about the details. PRs and issues welcome.</sub></p>
