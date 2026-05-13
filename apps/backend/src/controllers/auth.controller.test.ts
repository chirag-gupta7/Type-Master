/**
 * Auth Integration Test
 * Tests the new /auth/token endpoint
 */

import express from 'express';
import request from 'supertest';
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
      await request(app)
        .post('/api/v1/auth/token')
        .send({ email: 'test@example.com' })
        .expect(401);
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
