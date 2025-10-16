# TypeMaster API Reference

Base URL: `http://localhost:5000/api/v1` (development)

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

---

## Auth Endpoints

### POST /auth/register
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
- `username`: 3-20 characters, alphanumeric + underscore only
- `password`: Min 8 characters, must include uppercase, lowercase, and number

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

**Error Responses:**
- `400`: Validation error
- `409`: Email or username already exists

---

### POST /auth/login
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

**Error Responses:**
- `400`: Validation error
- `401`: Invalid credentials

---

### POST /auth/refresh
Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGc..."
}
```

**Error Responses:**
- `401`: Invalid or expired refresh token

---

## Test Endpoints (Protected)

### POST /tests
Save a typing test result.

**Headers:**
```
Authorization: Bearer <access_token>
```

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

**Field Descriptions:**
- `wpm`: Net Words Per Minute (0-300)
- `accuracy`: Percentage (0-100)
- `rawWpm`: Gross WPM before error deduction
- `errors`: Number of mistakes
- `duration`: Test duration in seconds (30, 60, or 180)
- `mode`: Test mode (WORDS, TIME, or QUOTE)

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

---

### GET /tests
Retrieve user's test history with pagination.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `duration`: Filter by duration (optional: 30, 60, 180)

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
      "rawWpm": 80.2,
      "errors": 5,
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

---

### GET /tests/stats
Get statistical analysis of user performance.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days`: Number of days to analyze (default: 30)
- `duration`: Filter by duration (optional: 30, 60, 180)

**Example:**
```
GET /tests/stats?days=30&duration=60
```

**Success Response (200):**
```json
{
  "stats": {
    "averageWpm": 72,
    "averageAccuracy": 95,
    "bestWpm": 85,
    "bestAccuracy": 98,
    "totalTests": 45,
    "recentTests": [
      {
        "wpm": 75.5,
        "accuracy": 96.8,
        "createdAt": "2025-10-16T12:00:00.000Z"
      }
    ]
  },
  "period": "Last 30 days"
}
```

---

### GET /tests/:id
Get a specific test result by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: Test result UUID

**Success Response (200):**
```json
{
  "test": {
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

**Error Responses:**
- `403`: Access denied (not your test)
- `404`: Test not found

---

## User Endpoints (Protected)

### GET /users/profile
Get current user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2025-10-16T12:00:00.000Z",
    "updatedAt": "2025-10-16T12:00:00.000Z",
    "_count": {
      "testResults": 45
    }
  }
}
```

---

### PUT /users/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "username": "newusername"
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "newusername",
    "createdAt": "2025-10-16T12:00:00.000Z",
    "updatedAt": "2025-10-16T13:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation error
- `409`: Username already taken

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

### Rate Limiting
- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes

Rate limit headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1634567890
```

---

## WPM Calculation Formula

TypeMaster uses industry-standard formulas:

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

## Example Usage (JavaScript/TypeScript)

```typescript
// Register
const registerResponse = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'johndoe',
    password: 'SecurePass123'
  })
});

const { accessToken } = await registerResponse.json();

// Save test result
const testResponse = await fetch('http://localhost:5000/api/v1/tests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    wpm: 75.5,
    accuracy: 96.8,
    rawWpm: 80.2,
    errors: 5,
    duration: 60,
    mode: 'WORDS'
  })
});

const result = await testResponse.json();
```

---

For more information, see the [main README](../README.md).
