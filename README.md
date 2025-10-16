# TypeMaster 🚀

A modern, production-ready typing speed improvement web application built with cutting-edge technologies.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## ✨ Features

### Core Features
- ✅ **User Authentication** - JWT-based authentication with HTTP-only cookies
- ✅ **Typing Test Engine** - Multiple test modes (30s, 1min, 3min)
- ✅ **Real-time Metrics** - Live WPM and accuracy calculation
- ✅ **User Dashboard** - Comprehensive analytics and progress tracking
- ✅ **Test History** - Complete test history with filtering
- ✅ **Dark/Light Mode** - Full theme support with system preference detection
- ✅ **Responsive Design** - Mobile-first, works on all devices

### Technical Features
- 🔒 **Security First** - Input validation, rate limiting, CORS, Helmet
- ⚡ **Performance** - Optimized with caching, code splitting, lazy loading
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- 🧪 **Well Tested** - Comprehensive unit, integration, and E2E tests
- 📊 **Type Safe** - Full TypeScript coverage with strict mode
- 🔄 **State Management** - Zustand for global state, React Query for server state

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Validation:** Zod
- **Testing:** Jest, React Testing Library, Playwright

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching:** Redis
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Helmet, CORS, bcrypt
- **Logging:** Winston
- **Validation:** Zod
- **Testing:** Jest, Supertest

### DevOps
- **Version Control:** Git
- **Package Manager:** npm
- **CI/CD:** GitHub Actions (recommended)
- **Frontend Deployment:** Vercel
- **Backend Deployment:** AWS ECS / Railway
- **Database Hosting:** AWS RDS / Supabase

## 📁 Project Structure

```
typemaster/
├── apps/
│   ├── frontend/              # Next.js application
│   │   ├── src/
│   │   │   ├── app/          # App router pages
│   │   │   ├── components/   # React components
│   │   │   │   ├── ui/       # shadcn/ui components
│   │   │   │   ├── features/ # Feature components
│   │   │   │   └── layout/   # Layout components
│   │   │   ├── lib/          # Utilities and helpers
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── stores/       # Zustand stores
│   │   │   ├── types/        # TypeScript types
│   │   │   └── styles/       # Global styles
│   │   ├── public/           # Static assets
│   │   └── tests/            # Test files
│   │
│   └── backend/              # Express API
│       ├── src/
│       │   ├── controllers/  # Route controllers
│       │   ├── routes/       # API routes
│       │   ├── middleware/   # Custom middleware
│       │   ├── utils/        # Utility functions
│       │   ├── services/     # Business logic
│       │   └── types/        # TypeScript types
│       ├── prisma/           # Database schema
│       │   └── migrations/   # Database migrations
│       └── tests/            # Test files
│
├── packages/                 # Shared packages (optional)
│   └── shared-types/         # Shared TypeScript types
│
├── .github/                  # GitHub config
│   └── workflows/            # CI/CD workflows
│
└── docs/                     # Documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **PostgreSQL** 15 or higher
- **Redis** 7.0 or higher (optional, for production)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/typemaster.git
cd typemaster
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Frontend (apps/frontend/.env):
```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Backend (apps/backend/.env):
```bash
cp apps/backend/.env.example apps/backend/.env
```

4. **Set up the database**
```bash
# Navigate to backend
cd apps/backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed the database
npm run prisma:seed
```

5. **Start development servers**
```bash
# From root directory
npm run dev

# Or run individually:
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:5000
```

## 💻 Development

### Frontend Development

```bash
cd apps/frontend

# Start dev server
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:ci

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build
```

### Backend Development

```bash
cd apps/backend

# Start dev server with hot reload
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:ci

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build

# Start production server
npm run start

# Prisma Studio (Database GUI)
npm run prisma:studio
```

### Code Quality

```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Lint all workspaces
npm run lint

# Type check all workspaces
npm run typecheck
```

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Frontend Tests
```bash
cd apps/frontend
npm run test         # Watch mode
npm run test:ci      # CI mode with coverage
```

### Backend Tests
```bash
cd apps/backend
npm run test         # Watch mode
npm run test:ci      # CI mode with coverage
```

### E2E Tests (Playwright)
```bash
cd apps/frontend
npx playwright test
npx playwright test --ui    # Interactive UI mode
```

## 📦 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

**Manual deployment:**
```bash
cd apps/frontend
npm run build
vercel --prod
```

### Backend (Railway / AWS ECS)

**Railway:**
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

**Docker:**
```bash
cd apps/backend
docker build -t typemaster-backend .
docker run -p 5000:5000 typemaster-backend
```

### Database Migration

```bash
cd apps/backend
npm run prisma:migrate
```

## 📚 API Documentation

### Base URL
- **Development:** `http://localhost:5000/api/v1`
- **Production:** `https://api.typemaster.com/api/v1`

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Test Endpoints (Protected)

#### Create Test Result
```http
POST /tests
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "wpm": 75.5,
  "accuracy": 96.8,
  "rawWpm": 80.2,
  "errors": 5,
  "duration": 60,
  "mode": "WORDS"
}
```

#### Get User Tests
```http
GET /tests?page=1&limit=20&duration=60
Authorization: Bearer {access_token}
```

#### Get User Stats
```http
GET /tests/stats?days=30&duration=60
Authorization: Bearer {access_token}
```

### User Endpoints (Protected)

#### Get Profile
```http
GET /users/profile
Authorization: Bearer {access_token}
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "username": "newusername"
}
```

## 🔐 Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/typemaster?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow TypeScript strict mode
- Write tests for new features
- Follow existing code patterns
- Run linting and formatting before committing
- Keep components under 200 lines
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Prisma](https://www.prisma.io/) for the excellent ORM

## 📞 Support

For support, email support@typemaster.com or open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**
