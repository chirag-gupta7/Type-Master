/**
 * Auth Integration Test
 * Tests the new /auth/token endpoint
 */

import express from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/user.routes';
import { errorHandler } from '../middleware/error-handler';
import { prisma } from '../utils/prisma';

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const apiPrefix = '/api/v1';
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(errorHandler);

  return app;
};

// Ensure JWT secrets and internal secret exist for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.INTERNAL_API_SECRET = 'test-internal-secret';

describe('Auth Token Integration', () => {
  const app = createTestApp();

  beforeAll(async () => {
    // Mock prisma
    (prisma.user.findUnique as any) = jest.fn().mockImplementation((args: any) => {
      if (args.where.email === 'test@example.com' || args.where.email === 'google@example.com') {
        return Promise.resolve({
          id: args.where.email === 'test@example.com' ? 'test-id' : 'google-id',
          email: args.where.email,
          username: 'testuser',
          password: 'hashedpassword',
        });
      }
      if (args.where.id === 'test-id') {
        return Promise.resolve({
          id: 'test-id',
          email: 'test@example.com',
          username: 'testuser',
        });
      }
      return Promise.resolve(null);
    });

    (prisma.user.create as any) = jest.fn().mockImplementation((args: any) => {
      return Promise.resolve({
        id: 'new-id',
        ...args.data,
      });
    });

    (prisma.user.findFirst as any) = jest.fn().mockResolvedValue(null);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/token', () => {
    it('should generate backend JWT for existing user with correct secret', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 for request without secret', async () => {
      await request(app).post('/api/v1/auth/token').send({ email: 'test@example.com' }).expect(401);
    });

    it('should PROVISION a user for non-existent email if it would be coming from OAuth', async () => {
      // The current implementation of findOrCreateUserForToken provisions the user if it doesn't exist
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: 'new-oauth-user@example.com' })
        .expect(200);

      expect(response.body.user.email).toBe('new-oauth-user@example.com');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject emails exceeding 255 characters to prevent DoS', async () => {
      const longEmail = 'a'.repeat(247) + '@test.com'; // Total length 256 chars
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: longEmail })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject image URLs exceeding 1000 characters to prevent resource exhaustion', async () => {
      const longUrl = 'https://example.com/image.png?q=' + 'a'.repeat(975); // Total length 1008 chars
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({
          email: 'test@example.com',
          image: longUrl,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/register input boundaries', () => {
    it('should reject registration requests with passwords exceeding 100 characters to prevent bcrypt DoS', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          username: 'valid_user',
          password: 'A' + 'a'.repeat(99) + '1', // 101 characters
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject registration requests with emails exceeding 255 characters', async () => {
      const longEmail = 'a'.repeat(247) + '@test.com'; // 256 characters
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: longEmail,
          username: 'valid_user',
          password: 'Password1',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    // Regression: when a concurrent registration for the same email/username
    // wins the race, the DB unique constraint (P2002) used to surface as an
    // unhandled 500 instead of a conflict.
    it('should return 409 when the email unique constraint is violated by a concurrent registration', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002', clientVersion: 'test', meta: { target: ['email'] } }
      );
      (prisma.user.findFirst as any) = jest.fn().mockResolvedValue(null);
      (prisma.user.create as any) = jest.fn().mockRejectedValue(p2002);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'race@example.com',
          username: 'race_user',
          password: 'Password1',
        })
        .expect(409);

      expect(response.body.error).toBe('Email already registered');

      (prisma.user.create as any) = jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: 'new-id', ...args.data });
      });
    });

    it('should return 409 when the username unique constraint is violated', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`username`)',
        { code: 'P2002', clientVersion: 'test', meta: { target: ['username'] } }
      );
      (prisma.user.findFirst as any) = jest.fn().mockResolvedValue(null);
      (prisma.user.create as any) = jest.fn().mockRejectedValue(p2002);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'race@example.com',
          username: 'race_user',
          password: 'Password1',
        })
        .expect(409);

      expect(response.body.error).toBe('Username already taken');

      (prisma.user.create as any) = jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: 'new-id', ...args.data });
      });
    });
  });

  describe('POST /api/v1/auth/login input boundaries', () => {
    it('should reject login requests with passwords exceeding 100 characters to prevent bcrypt DoS', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'a'.repeat(101), // 101 characters
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject login requests with emails exceeding 255 characters', async () => {
      const longEmail = 'a'.repeat(247) + '@test.com'; // 256 characters
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: longEmail,
          password: 'Password1',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Integration with NextAuth', () => {
    it('should work with Google OAuth users', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: 'google@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('google@example.com');
    });
  });

  describe('Token usage in API calls', () => {
    it('should allow authenticated requests with token', async () => {
      // Get token
      const tokenResponse = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: 'test@example.com' });

      const token = tokenResponse.body.accessToken;

      // Use token to access protected endpoint
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/v1/users/profile').expect(401);

      expect(response.body.error).toContain('token');
    });
  });
});
