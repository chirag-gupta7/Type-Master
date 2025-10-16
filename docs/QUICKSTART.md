# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm 9+ installed (`npm --version`)
- ✅ PostgreSQL 15+ running
- ✅ Redis 7+ running (optional for development)

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

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

### 3. Set Up Database
```bash
cd apps/backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Servers
```bash
# From root directory
npm run dev
```

This will start:
- 🎨 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:5000

## Using Docker (Alternative)

If you prefer Docker:

```bash
# Copy and configure environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Testing the Setup

### 1. Test Backend Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-16T..."}
```

### 2. Test Frontend
Open http://localhost:3000 in your browser

### 3. Register a Test User

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123"
  }'
```

**Using the UI:**
- Go to http://localhost:3000
- Click "Register" or navigate to registration page
- Fill in the form and submit

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000 (frontend)
npx kill-port 3000

# Kill process on port 5000 (backend)
npx kill-port 5000
```

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database exists: `psql -U postgres -c "CREATE DATABASE typemaster;"`

### Prisma Client Not Generated
```bash
cd apps/backend
npm run prisma:generate
```

### Module Not Found Errors
```bash
# Clean and reinstall
npm run clean
npm install
```

## Development Workflow

### Running Tests
```bash
# All tests
npm run test

# Frontend only
npm run test:frontend

# Backend only
npm run test:backend
```

### Code Quality
```bash
# Format code
npm run format

# Lint
npm run lint

# Type check
npm run typecheck
```

### Database Management
```bash
cd apps/backend

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Next Steps

1. ✅ **Explore the API** - Check out the API documentation in README.md
2. ✅ **Build Features** - Start implementing typing test components
3. ✅ **Write Tests** - Add tests as you build features
4. ✅ **Check Examples** - Look at existing controllers and components

## Getting Help

- 📖 Read the main [README.md](../README.md)
- 🐛 Check [Issues](https://github.com/yourusername/typemaster/issues)
- 💬 Ask questions in discussions
- 📧 Email: support@typemaster.com

---

**Happy coding! 🚀**
