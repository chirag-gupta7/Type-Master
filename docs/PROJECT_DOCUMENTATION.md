# TypeMaster - Complete Project Documentation

**Last Updated:** October 19, 2025

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Start Guide](#2-quick-start-guide)
3. [System Architecture](#3-system-architecture)
4. [Features & Implementation](#4-features--implementation)
5. [API Reference](#5-api-reference)
6. [File Structure](#6-file-structure)
7. [UI Design Specification](#7-ui-design-specification)
8. [Development Guide](#8-development-guide)

---

## 1. Project Overview

### 🎯 What is TypeMaster?

**TypeMaster** is a production-ready, modern typing speed improvement web application built with industry best practices and cutting-edge technologies. The project demonstrates enterprise-level architecture, security, testing, and deployment strategies.

### ✅ What Has Been Built

#### 📦 Complete Monorepo Structure

- ✅ Workspace-based monorepo with npm workspaces
- ✅ Shared configurations (TypeScript, ESLint, Prettier)
- ✅ Centralized dependency management
- ✅ Scripts for building, testing, and deploying all apps

#### 🎨 Frontend Application (Next.js 14)

**Location:** `apps/frontend/`

**Core Setup:**

- ✅ Next.js 14 with App Router
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS with custom theme
- ✅ shadcn/ui component library integration
- ✅ Dark/Light mode support
- ✅ Responsive design (mobile-first)

**State & Data Management:**

- ✅ Zustand for global state
- ✅ React Query for server state
- ✅ Proper provider setup

**Components Created:**

- ✅ Root layout with metadata
- ✅ Home page with feature showcase
- ✅ Dashboard with charts and metrics
- ✅ History page with pagination
- ✅ Settings page with theme toggle
- ✅ Navbar with active route highlighting
- ✅ TypingTest component (core functionality)

#### 🔧 Backend API (Express + TypeScript)

**Location:** `apps/backend/`

**Core Setup:**

- ✅ Express.js with TypeScript
- ✅ RESTful API structure
- ✅ Versioned routes (/api/v1)
- ✅ Environment configuration
- ✅ Winston logging

**Security Features:**

- ✅ JWT authentication (access + refresh tokens)
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Rate limiting (general + auth-specific)
- ✅ Input validation with Zod

**API Endpoints:**

**Authentication:**

- ✅ POST /auth/register - User registration
- ✅ POST /auth/login - User login
- ✅ POST /auth/refresh - Token refresh

**Tests (Protected):**

- ✅ POST /tests - Save test result
- ✅ GET /tests - Get user's test history (paginated)
- ✅ GET /tests/stats - Get user statistics
- ✅ GET /tests/:id - Get specific test

**Users (Protected):**

- ✅ GET /users/profile - Get user profile
- ✅ PUT /users/profile - Update profile

**Lessons (Phase 2):**

- ✅ GET /lessons - Get all lessons (optional auth)
- ✅ GET /lessons/:id - Get lesson by ID (optional auth)
- ✅ POST /lessons/progress - Save lesson progress (protected)
- ✅ GET /lessons/progress/stats - Get learning stats (protected)

#### 🗄️ Database & ORM

**Location:** `apps/backend/prisma/`

**Prisma Setup:**

- ✅ PostgreSQL database schema
- ✅ Prisma Client configuration
- ✅ Migration infrastructure
- ✅ Proper indexes for performance
- ✅ Seed script with 15 lessons and 7 achievements

**Models:**

- ✅ **User** - id, email, username, password, timestamps
- ✅ **TestResult** - id, userId, wpm, accuracy, rawWpm, errors, duration, mode, timestamp
- ✅ **Lesson** - id, level, order, title, description, keys, difficulty, targetWpm, minAccuracy, exerciseType, content
- ✅ **UserLessonProgress** - userId, lessonId, completed, bestWpm, bestAccuracy, attempts, stars
- ✅ **Achievement** - id, title, description, icon, requirement, points
- ✅ **UserAchievement** - userId, achievementId, unlockedAt
- ✅ **Relations** - Proper foreign keys and indexes

### 🎓 Learning Resources

This project demonstrates:

- Modern monorepo architecture
- Full-stack TypeScript development
- RESTful API design
- JWT authentication patterns
- Database design with Prisma
- React Server Components
- Testing strategies
- Docker containerization
- CI/CD with GitHub Actions

---

## 2. Quick Start Guide

### Prerequisites Check

Before starting, ensure you have:

- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm 9+ installed (`npm --version`)
- ✅ PostgreSQL 15+ running
- ✅ Redis 7+ running (optional for development)

### Quick Setup (5 minutes)

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Configure Environment Variables

**Frontend:**

```bash
cd apps/frontend
cp .env.example .env
```

Edit `apps/frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Backend:**

```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/typemaster?schema=public"
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
```

#### 3. Set Up Database

```bash
cd apps/backend
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

#### 4. Start Development Servers

```bash
# From root directory
npm run dev
```

This will start:

- 🎨 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:5000

### Using Docker (Alternative)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Testing the Setup

#### Test Backend Health

```bash
curl http://localhost:5000/health
```

#### Test Frontend

Open http://localhost:3000 in your browser

#### Register a Test User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123"
  }'
```

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│                     http://localhost:3000                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐         │
│  │ TypingTest  │  │  Dashboard   │  │  History      │         │
│  └─────────────┘  └──────────────┘  └───────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Zustand Store (store/index.ts)                 │   │
│  │   - Typing state, WPM, accuracy                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            API Client (lib/api.ts)                      │   │
│  │   - Auth endpoints                                      │   │
│  │   - Lesson endpoints                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js)                       │
│                     http://localhost:5000                       │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/auth/*      /api/v1/tests/*      /api/v1/lessons/*    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐          │
│  │ Auth Ctrl    │  │ Test Ctrl    │  │Lesson Ctrl  │          │
│  └──────────────┘  └──────────────┘  └─────────────┘          │
│                                                                 │
│  Middleware: authenticate, errorHandler, rateLimiter            │
└────────────────────────────┬────────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│  User, TestResult, Lesson, UserLessonProgress,                 │
│  Achievement, UserAchievement                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Lesson Progress Saving

```
1. USER COMPLETES TYPING TEST
   ↓
2. FRONTEND (TypingTest Component)
   - Calculate final stats
   - POST /api/v1/lessons/progress
   - Headers: Authorization: Bearer TOKEN
   ↓
3. BACKEND (Middleware)
   - authenticate() verifies JWT
   - Extracts userId from token
   ↓
4. BACKEND (Lesson Controller)
   - Validate with Zod schema
   - Fetch lesson details
   - Calculate stars (1-3 based on performance)
   - Fetch/update existing progress
   ↓
5. DATABASE (Prisma)
   - Upsert UserLessonProgress
   ↓
6. RESPONSE TO FRONTEND
   - Return progress with stars
   ↓
7. FRONTEND (Update UI)
   - Display stars earned
   - Update progress indicators
```

---

## 4. Features & Implementation

### Home Page (`/`)

**Features:**

- Duration selector (30s / 1 min / 3 min)
- Real-time WPM counter
- Real-time accuracy percentage
- Color-coded text:
  - ✅ Green = Correct character
  - ❌ Red = Incorrect character
  - ⚪ Gray = Untyped character
- Blinking cursor on current character
- Countdown timer
- Auto-save results when finished
- Reset button to start over

### Dashboard Page (`/dashboard`)

**Features:**

- **4 Metric Cards:**
  - Average WPM
  - Best WPM
  - Total Tests
  - Average Accuracy
- **Progress Chart:**
  - Blue line: WPM trend over last 10 tests
  - Green line: Accuracy trend over last 10 tests
  - Dual Y-axis
  - Hover tooltips

### History Page (`/history`)

**Features:**

- **Test Results Table:**
  - Date & Time (formatted)
  - WPM (highlighted)
  - Accuracy (color-coded: green ≥95%, yellow ≥90%)
  - Duration (formatted: 30s, 1m, 3m)
- **Pagination:**
  - 10 tests per page
  - Previous/Next buttons
  - Page counter

### Settings Page (`/settings`)

**Features:**

- **Profile Section:**
  - Username update form
  - Success/error message display
- **Appearance Section:**
  - Theme toggle: Light, Dark, System
  - Active theme highlighted

### Navigation

**Navbar (Visible on all pages):**

- Logo: "TypeMaster" (clickable)
- Navigation Links: Home, Dashboard, History, Settings
- Active Route: Highlighted
- Theme Toggle: Sun/Moon icon button

### Theme System

**Light Mode:**

- Background: White
- Text: Dark gray
- Primary: Blue

**Dark Mode:**

- Background: Very dark gray
- Text: Off-white
- Primary: Lighter blue

**System Mode:**

- Automatically switches based on OS preference

---

## 5. API Reference

**Base URL:** `http://localhost:5000/api/v1`

### Authentication

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

### Auth Endpoints

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Validation Rules:**

- `email`: Valid email format
- `username`: 3-20 characters, alphanumeric + underscore
- `password`: Min 8 characters, uppercase, lowercase, number

**Success Response (201):**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2025-10-16T12:00:00.000Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### POST /auth/login

Authenticate and receive tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**

```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Test Endpoints (Protected)

#### POST /tests

Save a typing test result.

**Request Body:**

```json
{
  "wpm": 75.5,
  "accuracy": 96.8,
  "rawWpm": 80.2,
  "errors": 5,
  "duration": 60,
  "mode": "WORDS"
}
```

**Success Response (201):**

```json
{
  "message": "Test result saved successfully",
  "testResult": {
    "id": "uuid",
    "userId": "uuid",
    "wpm": 75.5,
    "accuracy": 96.8,
    "rawWpm": 80.2,
    "errors": 5,
    "duration": 60,
    "mode": "WORDS",
    "createdAt": "2025-10-16T12:00:00.000Z"
  }
}
```

#### GET /tests

Retrieve user's test history with pagination.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `duration`: Filter by duration (optional)

**Example:**

```
GET /tests?page=1&limit=20&duration=60
```

**Success Response (200):**

```json
{
  "tests": [
    {
      "id": "uuid",
      "wpm": 75.5,
      "accuracy": 96.8,
      "duration": 60,
      "mode": "WORDS",
      "createdAt": "2025-10-16T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET /tests/stats

Get statistical analysis of user performance.

**Query Parameters:**

- `days`: Number of days to analyze (default: 30)
- `duration`: Filter by duration (optional)

**Success Response (200):**

```json
{
  "stats": {
    "averageWpm": 72,
    "averageAccuracy": 95,
    "bestWpm": 85,
    "bestAccuracy": 98,
    "totalTests": 45,
    "recentTests": [...]
  },
  "period": "Last 30 days"
}
```

### Lesson Endpoints

#### GET /lessons

Get all lessons (optionally authenticated).

**Success Response (200):**

```json
{
  "lessons": [
    {
      "id": "uuid",
      "level": 1,
      "order": 1,
      "title": "Home Row - Left Hand",
      "description": "Learn A, S, D, F keys",
      "keys": ["a", "s", "d", "f"],
      "difficulty": "EASY",
      "targetWpm": 15,
      "minAccuracy": 90,
      "exerciseType": "KEYS",
      "content": "asdf asdf..."
    }
  ]
}
```

#### POST /lessons/progress (Protected)

Save lesson progress.

**Request Body:**

```json
{
  "lessonId": "uuid",
  "wpm": 35,
  "accuracy": 94,
  "completed": true
}
```

**Success Response (200):**

```json
{
  "message": "Progress saved successfully",
  "progress": {
    "lessonId": "uuid",
    "bestWpm": 35,
    "bestAccuracy": 94,
    "stars": 2,
    "attempts": 3,
    "completed": true
  }
}
```

### Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error

### WPM Calculation Formula

**Gross WPM:**

```
(Total Characters Typed / 5) / Time in Minutes
```

**Net WPM:**

```
Gross WPM - (Errors / Time in Minutes)
```

**Accuracy:**

```
((Total Characters - Errors) / Total Characters) × 100
```

---

## 6. File Structure

```
typemaster/
├── 📄 package.json                    # Root workspace config
├── 📄 tsconfig.json                   # Root TypeScript config
├── 📄 docker-compose.yml              # Multi-container setup
├── 📄 README.md                       # Main documentation
├── 📄 LICENSE                         # MIT License
│
├── 📁 docs/                           # Documentation
│   ├── PROJECT_DOCUMENTATION.md       # This file
│   ├── API.md
│   ├── QUICKSTART.md
│   └── ...
│
├── 📁 apps/
│   ├── 📁 frontend/                   # Next.js 14 Application
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx           # Home (TypingTest)
│   │       │   ├── dashboard/page.tsx
│   │       │   ├── history/page.tsx
│   │       │   └── settings/page.tsx
│   │       ├── components/
│   │       │   ├── TypingTest.tsx
│   │       │   ├── Navbar.tsx
│   │       │   └── ui/
│   │       ├── lib/
│   │       │   └── api.ts
│   │       ├── store/
│   │       │   └── index.ts
│   │       └── types/
│   │           └── index.ts
│   │
│   └── 📁 backend/                    # Express API
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       └── src/
│           ├── index.ts
│           ├── controllers/
│           │   ├── auth.controller.ts
│           │   ├── test.controller.ts
│           │   ├── user.controller.ts
│           │   └── lesson.controller.ts
│           ├── routes/
│           │   ├── auth.routes.ts
│           │   ├── test.routes.ts
│           │   ├── user.routes.ts
│           │   └── lesson.routes.ts
│           ├── middleware/
│           │   ├── auth.middleware.ts
│           │   ├── error-handler.ts
│           │   └── rate-limiter.ts
│           └── utils/
│               ├── logger.ts
│               └── prisma.ts
│
└── 📁 .github/
    └── workflows/
        └── ci.yml                     # GitHub Actions CI/CD
```

---

## 7. UI Design Specification

### Component Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│            [30 Sec] [1 Min] [3 Min]                    │
│            Duration Selection Buttons                   │
│                                                         │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│  │   45     │     │   98%    │     │  01:30   │       │
│  │  WPM     │     │ Accuracy │     │   Time   │       │
│  └──────────┘     └──────────┘     └──────────┘       │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                │    │
│  │  The quick brown fox jumps over the lazy dog. │    │
│  │  The quick brown fox jumps over the lazy |    │    │
│  │  dog. Pack my box with five dozen liquor      │    │
│  │  jugs...                                       │    │
│  │                                                │    │
│  │  ▼ Auto-scrolls as you type                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│              [Restart Test] Button                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme

**Duration Buttons:**

- Active: `bg-primary` (blue) + shadow
- Inactive: `bg-muted` (gray)
- Hover: `bg-muted/80`

**Text Container:**

- Font: `font-mono text-2xl`
- Height: `h-48` (fixed, scrollable)
- Border: `border-2 border-border`
- Padding: `p-6`

**Character Colors:**

| State     | Light Mode       | Dark Mode        |
| --------- | ---------------- | ---------------- |
| Untyped   | `text-gray-500`  | `text-gray-400`  |
| Correct   | `text-green-500` | `text-green-400` |
| Incorrect | `text-red-500`   | `text-red-400`   |

**Cursor:**

- Appearance: Vertical bar (2px width)
- Color: `bg-primary`
- Animation: `animate-blink` (1s)

### Responsive Behavior

**Desktop (> 1024px):**

- Text container: 800px width
- Metrics: Horizontal layout

**Tablet (768px - 1024px):**

- Text container: Responsive width
- Metrics: Horizontal maintained

**Mobile (< 768px):**

- Text container: Full width
- Metrics: May stack vertically
- Fonts: Slightly reduced

---

## 8. Development Guide

### Development Workflow

#### Running Tests

```bash
# All tests
npm run test

# Frontend only
npm run test:frontend

# Backend only
npm run test:backend

# With coverage
npm run test:ci
```

#### Code Quality

```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run typecheck
```

#### Database Management

```bash
cd apps/backend

# Open Prisma Studio
npm run prisma:studio

# Create migration
npm run prisma:migrate

# Generate client
npm run prisma:generate

# Run seed
npm run seed
```

### Common Issues

#### Port Already in Use

```bash
# Kill port 3000 (frontend)
npx kill-port 3000

# Kill port 5000 (backend)
npx kill-port 5000
```

#### Database Connection Error

- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Create database: `psql -U postgres -c "CREATE DATABASE typemaster;"`

#### Module Not Found

```bash
# Clean and reinstall
npm run clean
npm install
```

### Security Best Practices

- ✅ No hardcoded secrets
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ JWT tokens (access + refresh)
- ✅ Rate limiting on all endpoints
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ CORS properly configured
- ✅ Helmet security headers

### Performance Optimizations

- ✅ Database indexes on frequently queried fields
- ✅ Pagination for large datasets
- ✅ React Query caching
- ✅ Next.js automatic code splitting
- ✅ Connection pooling (Prisma)
- ✅ Optimized Docker images

### Testing Standards

**Coverage Targets:**

- Frontend: 70% minimum
- Backend: 70% minimum

**TypeScript:**

- Strict mode enabled
- No `any` types
- Full type safety

### Deployment

**Frontend:** Vercel (recommended)

```bash
# Build production
cd apps/frontend
npm run build

# Start production
npm run start
```

**Backend:** AWS ECS, Railway, or any Node.js host

```bash
# Build production
cd apps/backend
npm run build

# Start production
npm run start
```

**Database:** AWS RDS, Supabase, or managed PostgreSQL

**Docker Deployment:**

```bash
docker-compose up -d --build
```

---

## Summary

TypeMaster is a production-ready typing speed application with:

- ✅ Complete authentication system
- ✅ Real-time typing test with WPM/accuracy tracking
- ✅ User dashboard with analytics
- ✅ Test history with pagination
- ✅ Lesson system with progress tracking
- ✅ Achievement system
- ✅ Theme support (light/dark/system)
- ✅ Comprehensive API
- ✅ Security hardening
- ✅ Docker deployment
- ✅ CI/CD pipeline

**Status:** 🚀 **Production Ready**

**Built with ❤️ following industry best practices**

---

**For more information, see:**

- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [License](../LICENSE)
