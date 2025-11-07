# TypeMaster 🚀

A comprehensive typing improvement platform with 100 progressive lessons, intelligent placement tests, and gamified achievement system.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Version](https://img.shields.io/badge/version-2.0.0-brightgreen)

## 📋 Table of Contents

- [Features](#features)
- [What's New in 2.0](#whats-new-in-20)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Authentication Setup](#authentication-setup)
- [Documentation](#documentation)
- [Testing](#testing)
- [Contributing](#contributing)

## ✨ Features

### 🎓 Learning System (100 Lessons)

- **Progressive Curriculum** - 100 lessons from beginner (15 WPM) to expert (75+ WPM)
- **6 Sections** - Foundation, Skill Building, Advanced, Speed & Fluency, Mastery, Programming
- **Placement Test** - Intelligent skill assessment recommends your starting point
- **Checkpoint System** - Milestone lessons every 5-20 levels validate progress
- **Diverse Content** - Literature, business, technical text, and code snippets
- **Targeted Practice** - Finger-specific exercises and hand-alternation training

### 🎮 Gamification & Achievements

- **Achievement System** - 8 base achievements with 250 XP maximum
  - Speed: Century Club (100 WPM), Speed Demon (120 WPM), Lightning Fingers (150 WPM)
  - Accuracy: Near Perfect (98%), Precision Master (99%), Perfectionist (100%)
  - Stars: Triple Star (3 stars), Lesson Completed
- **Milestone Celebrations** - Full-screen celebrations at 10, 25, 50, 100 lessons
- **Confetti Effects** - 500-piece confetti burst on achievements
- **Toast Notifications** - Stacked notifications for multiple achievements
- **Points System** - 10-250 XP per achievement

### 📊 Mistake Tracking & Analysis

- **Real-time Tracking** - Captures every typing error during practice
- **Weak Key Analysis** - Identifies problematic keys with error counts
- **Personalized Practice** - Generates custom text targeting your weak areas
- **Improvement Trends** - Track error reduction over time
- **Finger Mapping** - Shows which finger should be used for each key

### 🎯 Core Typing Features

- **Typing Test Engine** - Multiple test modes (30s, 1min, 3min)
- **Real-time Metrics** - Live WPM and accuracy calculation
- **Visual Keyboard** - Interactive keyboard with highlighting
- **Character Feedback** - Color-coded correct/incorrect characters
- **Test History** - Complete history with filtering and stats

### 🎨 User Experience

- **Dark/Light Mode** - Full theme support with system detection
- **10 Theme Colors** - Neon Cyan, Purple, Green, Orange, Pink, Blue, Lime, Ruby, Golden, Mint
- **Responsive Design** - Mobile-first, works on all devices
- **Smooth Animations** - Framer Motion for delightful interactions
- **Keyboard Shortcuts** - Quick navigation (Ctrl+1-8)
- **Progress Dashboard** - 4 visualizations with analytics

### 🔒 Technical Features

- **Security First** - JWT auth, input validation, rate limiting, CORS, Helmet
- **Performance** - Optimized with caching, code splitting, lazy loading
- **Type Safe** - Full TypeScript with strict mode
- **Well Tested** - Manual testing tools and comprehensive guides
- **RESTful API** - 27 endpoints with consistent error handling

---

## 🎉 What's New in 2.0

### Version 2.0.0 - Comprehensive Learning System

**Released:** October 30, 2025

#### Major Features

✨ **100-Lesson Curriculum**

- Expanded from 14 to 100 progressive lessons
- Organized into 6 themed sections
- Progressive difficulty from 15 WPM to 75+ WPM
- 5 lesson types: Keys, Words, Sentences, Paragraphs, Code

✨ **Placement Test System**

- 3-stage assessment flow
- Finger-specific speed analysis
- Personalized starting level recommendations
- Skill level determination (Beginner → Expert)

✨ **Achievement Celebrations**

- Full-screen modals with confetti effects
- Auto-dismissing toast notifications
- Milestone celebrations with particles
- Staggered display for multiple achievements
- Points/XP tracking (10-250 XP)

✨ **Mistake Tracking & Analysis**

- Real-time error capture during typing
- Weak key identification and scoring
- Personalized practice text generation
- Improvement trend tracking
- Tri-severity classification (Critical/Moderate/Minor)

#### Technical Improvements

🔧 **Backend API**

- 12 new endpoints (15 → 27 total)
- 3 new database models (TypingMistake, UserWeakKeys, UserSkillAssessment)
- Enhanced Lesson model with sections and prerequisites
- Assessment and mistake controllers

🎨 **Frontend Components**

- 11 new pages and components
- Achievement system (5 components)
- Section-based lesson organization
- Enhanced practice interface (4 views)
- Manual testing tools

📚 **Documentation**

- Comprehensive achievement system guide
- Updated development phases
- Testing checklists and guides
- Architecture diagrams
- API reference updates

#### Dependencies

- Added `react-confetti` for celebration effects
- Updated Framer Motion to 11.2.10
- Enhanced TypeScript interfaces

**See [CHANGELOG.md](./CHANGELOG.md) for detailed changes.**

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (40+ components)
- **Animations:** Framer Motion 11.2.10
- **Effects:** react-confetti
- **State:** Zustand + React Context
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Authentication:** JWT
- **Security:** Helmet, CORS, bcrypt, rate-limit
- **Logging:** Winston

### DevOps

- **Version Control:** Git, GitHub
- **Containerization:** Docker, Docker Compose
- **Deployment:** Vercel (Frontend), Railway (Backend)
- **CI/CD:** GitHub Actions

---

## 📁 Project Structure

```
typemaster/
├── apps/
│   ├── frontend/          # Next.js 14 application
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/# React components (65+)
│   │   │   ├── context/   # React Context providers
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── lib/       # Utilities and API client
│   │   │   ├── store/     # Zustand stores
│   │   │   └── types/     # TypeScript types
│   │   └── public/        # Static assets
│   │
│   └── backend/           # Express.js API
│       ├── prisma/        # Database schema & migrations
│       │   ├── schema.prisma
│       │   ├── seed.ts    # 100 lessons + achievements
│       │   └── migrations/
│       └── src/
│           ├── controllers/# Request handlers (8)
│           ├── routes/    # API routes (8)
│           ├── middleware/# Auth, errors, rate limit
│           └── utils/     # Helpers & logger
│
├── docs/                  # Comprehensive documentation
│   ├── ACHIEVEMENT_SYSTEM.md  # Achievement guide
│   ├── DEVELOPMENT_PHASES.md  # Dev history
│   ├── API.md                 # API reference
│   ├── QUICKSTART.md          # Setup guide
│   └── ...                    # More docs
│
├── CHANGELOG.md           # Version history
├── README.md              # This file
└── CONTRIBUTING.md        # Contribution guide
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Git

### Installation (5 minutes)

1. **Clone the repository**

   ```bash
   git clone https://github.com/chirag-gupta7/Type-Master.git
   cd typemaster
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   **Backend** (`apps/backend/.env`):

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/typemaster"
   JWT_SECRET="your-secret-key-here"
   JWT_REFRESH_SECRET="your-refresh-secret-here"
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

   **Frontend** (`apps/frontend/.env.local`):

   ```env
   # Backend API
   NEXT_PUBLIC_API_URL=http://localhost:5000

   # Database (must match backend!)
   DATABASE_URL=postgresql://user:password@localhost:5432/typemaster

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

   ⚠️ **Generate secure secrets**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   📚 **See [AUTH_FIX_README.md](./AUTH_FIX_README.md) for detailed auth setup**

4. **Set up database**

   ```bash
   cd apps/backend
   npx prisma migrate dev
   npx prisma generate
   npm run seed  # Seeds 100 lessons + 14 achievements
   ```

5. **Start development servers**

   **Terminal 1 - Backend:**

   ```bash
   cd apps/backend
   npm run dev  # Runs on http://localhost:5000
   ```

   **Terminal 2 - Frontend:**

   ```bash
   cd apps/frontend
   npm run dev  # Runs on http://localhost:3000
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

### First Steps

1. **Register an Account** - Visit `/register` to create your account (required for data persistence)
2. **Take the Placement Test** - Visit `/learn/assessment` to find your skill level
3. **Start Your First Lesson** - Go to `/learn` and begin with your recommended level
4. **Complete a Lesson** - Type the text and watch achievements unlock! 🎉
5. **Test the Achievement System** - Visit `/test-achievements` to see all celebration animations

---

## 🔐 Authentication Setup

TypeMaster uses NextAuth with backend JWT integration. Both **Google OAuth** and **email/password** authentication are supported.

### Quick Setup

1. **Configure environment variables** (see Quick Start section above)
2. **Generate secrets** using the crypto command
3. **Run migrations** to set up the database
4. **Verify setup** (optional):
   ```bash
   node scripts/verify-auth-setup.js
   ```

### Features

✅ Email/password registration and login  
✅ Google OAuth integration  
✅ Automatic JWT token generation  
✅ Persistent user data across sessions  
✅ Secure session management

### Detailed Documentation

- **[AUTH_FIX_README.md](./AUTH_FIX_README.md)** - Quick fix guide with troubleshooting
- **[docs/AUTH_SETUP_GUIDE.md](./docs/AUTH_SETUP_GUIDE.md)** - Complete setup and architecture guide

### Common Issues

**Data not persisting?**

- Ensure frontend and backend use the **same** `DATABASE_URL`
- Check that `NEXT_PUBLIC_API_URL` points to your backend
- Verify backend is running when you log in

**Google OAuth not working?**

- Configure OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
- Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Add credentials to frontend `.env.local`

---

### Testing the Achievement System

Want to see achievements without completing lessons?

```bash
# Visit the testing page
http://localhost:3000/test-achievements
```

Click any achievement button to trigger celebrations instantly!

---

## 📚 Documentation

Comprehensive guides available in `/docs`:

- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Detailed setup guide
- **[ACHIEVEMENT_SYSTEM.md](./docs/ACHIEVEMENT_SYSTEM.md)** - Achievement documentation
- **[DEVELOPMENT_PHASES.md](./docs/DEVELOPMENT_PHASES.md)** - Complete development history
- **[API.md](./docs/API.md)** - API endpoint reference
- **[FEATURES.md](./docs/FEATURES.md)** - Feature specifications
- **[TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Testing instructions
- **[FILE_STRUCTURE.md](./docs/FILE_STRUCTURE.md)** - Codebase organization

---

## 🧪 Testing

### Manual Testing

**Achievement System:**

```bash
cd apps/frontend
npm run dev
# Visit: http://localhost:3000/test-achievements
```

**Placement Test:**

```bash
# Visit: http://localhost:3000/learn/assessment
```

**Lesson Practice:**

```bash
# Visit: http://localhost:3000/learn
# Click any lesson to start
```

### Testing Tools

- `/test-achievements` - Manual achievement triggers
- Prisma Studio - Database inspection: `npx prisma studio`
- Browser DevTools - Check console and network

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful UI components
- **Framer Motion** - Smooth animations
- **Prisma** - Type-safe database ORM
- **Next.js** - React framework
- **Community** - All contributors and testers

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/chirag-gupta7/Type-Master/issues)
- **Discussions:** [GitHub Discussions](https://github.com/chirag-gupta7/Type-Master/discussions)
- **Documentation:** `/docs` folder

---

## 🗺️ Roadmap

### Phase 9: Authentication & Persistence (Next)

- [ ] NextAuth.js integration
- [ ] Social login (Google, GitHub)
- [ ] Persistent user stats
- [ ] Achievement history page

### Phase 10: Social Features

- [ ] Multiplayer typing races
- [ ] Global leaderboards
- [ ] Friend system
- [ ] Daily challenges

### Phase 11: AI Integration

- [ ] Personalized recommendations
- [ ] Adaptive difficulty
- [ ] Smart practice generation
- [ ] Performance predictions

### Phase 12: Mobile Apps

- [ ] React Native apps
- [ ] iOS & Android support
- [ ] Offline mode

---

**Built with ❤️ by the TypeMaster Team**

**Version:** 2.0.0 | **Last Updated:** October 30, 2025

---

⭐ **Star this repo if you find it helpful!**

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

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Complete project summary and architecture
- **[Features Guide](docs/FEATURES.md)** - Detailed feature documentation and usage
- **[Implementation Details](docs/IMPLEMENTATION.md)** - Technical implementation specifics
- **[API Reference](docs/API.md)** - Complete REST API documentation
- **[File Structure](docs/FILE_STRUCTURE.md)** - Project structure and organization

See [docs/README.md](docs/README.md) for the complete documentation index.

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

- **Your Name** - _Initial work_

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Prisma](https://www.prisma.io/) for the excellent ORM

## 📞 Support

For support, email support@typemaster.com or open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**
