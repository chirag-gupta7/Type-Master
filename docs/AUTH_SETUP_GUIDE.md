# Authentication Setup Guide

## Overview

This application uses a **unified authentication system** that combines NextAuth with a backend Express API. Both Google OAuth and email/password authentication are supported, and all user data is stored in a single PostgreSQL database.

## Architecture

### Authentication Flow

1. **User Authentication** → NextAuth handles all authentication (Google OAuth or Credentials)
2. **Backend Token Generation** → After successful NextAuth login, a backend JWT token is automatically obtained
3. **Data Persistence** → All application data (lessons, tests, achievements) is saved via the backend API using the JWT token

### Key Components

- **NextAuth**: Handles user authentication and session management
- **Backend Express API**: Provides JWT tokens and handles all data operations
- **Single Database**: PostgreSQL database shared between NextAuth and backend
- **Prisma**: ORM used by both NextAuth (frontend) and backend

## Setup Instructions

### 1. Database Configuration

Both frontend and backend must connect to the **same PostgreSQL database**.

#### Backend `.env` (apps/backend/.env)

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/typemaster?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

#### Frontend `.env.local` (apps/frontend/.env.local)

```bash
# Same database as backend!
DATABASE_URL=postgresql://postgres:password@localhost:5432/typemaster

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to frontend `.env.local`

### 4. Database Migrations

Run migrations from the **backend** directory (this sets up the shared schema):

```bash
cd apps/backend
npx prisma migrate dev
npx prisma db seed  # Optional: seed with demo lessons
```

### 5. Start the Application

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

## How It Works

### Email/Password Registration

1. User fills registration form
2. Frontend calls backend `/api/v1/auth/register`
3. Backend creates user in database with hashed password
4. Backend returns JWT tokens
5. Frontend signs in with NextAuth using same credentials
6. NextAuth calls backend `/api/v1/auth/token` to get fresh backend JWT
7. Backend JWT is stored in NextAuth session
8. All subsequent API calls use this JWT token

### Email/Password Login

1. User fills login form
2. Frontend signs in with NextAuth credentials provider
3. NextAuth verifies password against database
4. NextAuth calls backend `/api/v1/auth/token` to get backend JWT
5. Backend JWT is stored in NextAuth session
6. All subsequent API calls use this JWT token

### Google OAuth Login

1. User clicks "Sign in with Google"
2. Google authentication flow completes
3. NextAuth creates/updates user in database via Prisma
4. NextAuth calls backend `/api/v1/auth/token` to get backend JWT
5. Backend JWT is stored in NextAuth session
6. All subsequent API calls use this JWT token

## Data Flow

### Saving Lesson Progress

```typescript
// User completes a lesson
await lessonAPI.saveLessonProgress({
  lessonId: 'lesson-id',
  wpm: 45,
  accuracy: 95,
  completed: true,
});
```

**Behind the scenes:**

1. `getAuthToken()` retrieves JWT from NextAuth session (`session.accessToken`)
2. Request sent to backend with `Authorization: Bearer <token>`
3. Backend verifies JWT and extracts user ID
4. Backend saves progress to database linked to user
5. Progress appears in user's profile and progress pages

### Fetching User Data

```typescript
// Get user's lesson progress
const { lessons } = await lessonAPI.getAllLessons();
```

**Behind the scenes:**

1. JWT token automatically included in request headers
2. Backend returns lessons with user's progress
3. Frontend displays personalized data

## Authentication Check

To check if a user is authenticated and get their session:

```typescript
import { getSession } from 'next-auth/react';

// In a component
const session = await getSession();
if (session) {
  console.log('User:', session.user);
  console.log('Backend Token:', session.accessToken);
}
```

## Troubleshooting

### Issue: Data not saving

**Cause**: Backend JWT token not in session
**Solution**:

1. Check that backend is running on correct port (5000)
2. Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
3. Check backend logs for `/api/v1/auth/token` endpoint errors

### Issue: Google login doesn't persist data

**Cause**: Backend token generation failed
**Solution**:

1. Ensure both frontend and backend use same `DATABASE_URL`
2. Check backend logs when Google user logs in
3. Verify user was created in database: `SELECT * FROM users WHERE email = 'user@gmail.com'`

### Issue: "Invalid token" errors

**Cause**: JWT_SECRET mismatch or expired token
**Solution**:

1. Verify `JWT_SECRET` in backend `.env` is set
2. Restart backend server after changing secrets
3. Log out and log back in to get fresh token

### Issue: User exists but can't log in

**Cause**: Password mismatch or OAuth account conflict
**Solution**:

1. Google accounts don't have passwords - must use Google sign-in
2. Email accounts need passwords - check registration completed successfully
3. Check database: `SELECT email, password, emailVerified FROM users WHERE email = 'user@email.com'`

## Database Schema Notes

Key tables:

- `users` - All users (Google + Email/Password)
- `accounts` - OAuth accounts linked to users
- `sessions` - NextAuth sessions
- `user_lesson_progress` - Lesson completion data
- `test_results` - Typing test results
- `user_achievements` - Unlocked achievements

All user-related data is linked via `userId` foreign key.

## Security Best Practices

1. ✅ Use different secrets for development and production
2. ✅ Never commit `.env` files to git
3. ✅ Use HTTPS in production for Google OAuth
4. ✅ Rotate JWT secrets periodically
5. ✅ Set appropriate CORS origins in backend
6. ✅ Use secure cookies in production (`secure: true, sameSite: 'strict'`)

## API Endpoints Reference

### Backend Authentication Endpoints

| Endpoint                | Method | Description               | Auth Required |
| ----------------------- | ------ | ------------------------- | ------------- |
| `/api/v1/auth/register` | POST   | Register new user         | No            |
| `/api/v1/auth/login`    | POST   | Login with email/password | No            |
| `/api/v1/auth/token`    | POST   | Get JWT for NextAuth user | No            |
| `/api/v1/auth/refresh`  | POST   | Refresh expired token     | No            |

### Data Endpoints (Require JWT)

| Endpoint                     | Method | Description            |
| ---------------------------- | ------ | ---------------------- |
| `/api/v1/lessons`            | GET    | Get all lessons        |
| `/api/v1/lessons/progress`   | POST   | Save lesson progress   |
| `/api/v1/tests`              | POST   | Save typing test       |
| `/api/v1/tests/stats`        | GET    | Get user statistics    |
| `/api/v1/achievements`       | GET    | Get achievements       |
| `/api/v1/achievements/check` | POST   | Check new achievements |

## Migration from Old System

If you have existing code using only backend auth (without NextAuth):

1. Keep existing backend endpoints working
2. Add new `/auth/token` endpoint
3. Update login/register pages to use NextAuth
4. Frontend API client already supports both systems
5. Test both auth flows work

## Testing the Integration

1. **Register new user with email**:
   - Should create user in database
   - Should automatically log in
   - Should be able to save lesson progress

2. **Login with Google**:
   - Should create/update user in database
   - Should be able to save lesson progress
   - User should see their data across sessions

3. **Switch between auth methods**:
   - User with email can't use Google (different accounts)
   - Same email with Google can't use password login
   - This is expected behavior

4. **Verify data persistence**:
   - Complete a lesson
   - Log out
   - Log back in
   - Progress should still be there
