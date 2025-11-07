# 🔑 Authentication Quick Reference

## Environment Variables Required

### Backend (`apps/backend/.env`)

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/typemaster"
JWT_SECRET="<32-byte-hex>"
JWT_REFRESH_SECRET="<32-byte-hex>"
CORS_ORIGIN="http://localhost:3000"
```

### Frontend (`apps/frontend/.env.local`)

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/typemaster"  # Same as backend!
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<32-byte-hex>"
GOOGLE_CLIENT_ID="<from-google-console>"
GOOGLE_CLIENT_SECRET="<from-google-console>"
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

## Generate Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run 3 times for: `NEXTAUTH_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

## API Endpoints

### Public Endpoints

| Endpoint                | Method | Body                            | Response                              |
| ----------------------- | ------ | ------------------------------- | ------------------------------------- |
| `/api/v1/auth/register` | POST   | `{ email, username, password }` | `{ user, accessToken, refreshToken }` |
| `/api/v1/auth/login`    | POST   | `{ email, password }`           | `{ user, accessToken, refreshToken }` |
| `/api/v1/auth/token`    | POST   | `{ email }`                     | `{ user, accessToken, refreshToken }` |
| `/api/v1/auth/refresh`  | POST   | `{ refreshToken }`              | `{ accessToken }`                     |

### Protected Endpoints (Require JWT)

| Endpoint                   | Method | Description                   |
| -------------------------- | ------ | ----------------------------- |
| `/api/v1/lessons`          | GET    | Get all lessons with progress |
| `/api/v1/lessons/:id`      | GET    | Get single lesson             |
| `/api/v1/lessons/progress` | POST   | Save lesson progress          |
| `/api/v1/tests`            | POST   | Save typing test              |
| `/api/v1/tests/stats`      | GET    | Get user statistics           |
| `/api/v1/achievements`     | GET    | Get achievements              |
| `/api/v1/users/profile`    | GET    | Get user profile              |

## Frontend Usage

### Check Authentication

```typescript
import { getSession } from 'next-auth/react';

const session = await getSession();
if (session) {
  console.log('User:', session.user);
  console.log('Backend JWT:', session.accessToken);
}
```

### Make API Call

```typescript
import { lessonAPI } from '@/lib/api';

// Token automatically included from session
const data = await lessonAPI.saveLessonProgress({
  lessonId: 'lesson-id',
  wpm: 45,
  accuracy: 95,
  completed: true,
});
```

### Sign In

```typescript
import { signIn } from 'next-auth/react';

// Email/Password
await signIn('credentials', { email, password });

// Google
await signIn('google');
```

### Sign Out

```typescript
import { signOut } from 'next-auth/react';

await signOut({ callbackUrl: '/' });
```

## Backend Usage

### Protect Route

```typescript
import { authenticate } from '../middleware/auth.middleware';

router.get('/protected', authenticate, (req, res) => {
  const userId = req.user.userId; // From JWT
  // ... your code
});
```

### Generate Token

```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: '15m' });
```

## Database Queries

### Check User Exists

```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### View Lesson Progress

```sql
SELECT u.email, l.title, ulp.completed, ulp.best_wpm, ulp.stars
FROM user_lesson_progress ulp
JOIN users u ON u.id = ulp."userId"
JOIN lessons l ON l.id = ulp."lessonId"
WHERE u.email = 'user@example.com';
```

### View Test Results

```sql
SELECT wpm, accuracy, duration, "createdAt"
FROM test_results
WHERE "userId" = '<user-id>'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Troubleshooting

### Issue: "No token provided"

```bash
# Check session includes accessToken
console.log(session.accessToken); // Should be present

# Check backend receives token
# Look for "Authorization: Bearer xxx" in request headers
```

### Issue: "Invalid token"

```bash
# Verify JWT_SECRET matches between frontend and backend
# Check token hasn't expired (15min default)
# Try logging out and back in
```

### Issue: Data not persisting

```bash
# 1. Verify both .env files use SAME database
grep DATABASE_URL apps/backend/.env
grep DATABASE_URL apps/frontend/.env.local

# 2. Check backend is running
curl http://localhost:5000/api/v1/lessons

# 3. Verify migrations ran
cd apps/backend && npx prisma migrate status
```

### Issue: Google OAuth fails

```bash
# 1. Check Google credentials set
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# 2. Verify redirect URI in Google Console:
#    http://localhost:3000/api/auth/callback/google

# 3. Check NEXTAUTH_URL matches:
echo $NEXTAUTH_URL  # Should be http://localhost:3000
```

## Common Commands

```bash
# Start backend
cd apps/backend && npm run dev

# Start frontend
cd apps/frontend && npm run dev

# Reset database
cd apps/backend
npx prisma migrate reset
npx prisma db seed

# View database
npx prisma studio

# Check setup
node scripts/verify-auth-setup.js

# Generate Prisma Client
npx prisma generate
```

## File Locations

```
Authentication Code:
├── Backend
│   ├── src/controllers/auth.controller.ts    # Auth endpoints
│   ├── src/routes/auth.routes.ts             # Auth routes
│   ├── src/middleware/auth.middleware.ts     # JWT verification
│   └── prisma/schema.prisma                  # Database schema
│
└── Frontend
    ├── src/lib/auth/authOptions.ts           # NextAuth config
    ├── src/lib/auth/prisma.ts                # Prisma client
    ├── src/lib/api.ts                        # API client
    ├── src/app/api/auth/[...nextauth]/       # NextAuth handler
    ├── src/app/login/page.tsx                # Login page
    └── src/app/register/page.tsx             # Register page
```

## Session Structure

```typescript
{
  user: {
    id: "uuid",
    email: "user@example.com",
    name: "username",
    username: "username",
    image: null
  },
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expires: "2024-11-08T12:00:00.000Z"
}
```

## JWT Token Payload

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "iat": 1699372800,
  "exp": 1699373700
}
```

## Support

📚 Full Guide: [docs/AUTH_SETUP_GUIDE.md](../AUTH_SETUP_GUIDE.md)  
🔧 Quick Fix: [AUTH_FIX_README.md](../AUTH_FIX_README.md)  
📝 Changelog: [docs/AUTH_INTEGRATION_CHANGELOG.md](./AUTH_INTEGRATION_CHANGELOG.md)
