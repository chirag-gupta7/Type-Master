/**
 * Auth Integration Test
 * Tests the new /auth/token endpoint
 */

import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import authRoutes from '../routes/auth.routes';
import userRoutes from '../routes/user.routes';
import { errorHandler } from '../middleware/error-handler';
import { prisma } from '../utils/prisma';

// Note: This is a template - you'll need to set up your test environment

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const apiPrefix = '/api/v1';
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(errorHandler);

  return app;
};

// Ensure JWT secrets exist for tests
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';

describe('Auth Token Integration', () => {
  const app = createTestApp();
  let testUser: { id: string; email: string };

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('Test123!', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/token', () => {
    it('should generate backend JWT for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Integration with NextAuth', () => {
    it('should work with Google OAuth users', async () => {
      // Create a Google OAuth user (no password)
      const googleUser = await prisma.user.create({
        data: {
          email: 'google@example.com',
          username: 'googleuser',
          password: null, // Google users don't have passwords
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/token')
        .send({ email: googleUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(googleUser.email);

      // Cleanup
      await prisma.user.delete({ where: { id: googleUser.id } });
    });
  });

  describe('Token usage in API calls', () => {
    it('should allow authenticated requests with token', async () => {
      // Get token
      const tokenResponse = await request(app)
        .post('/api/v1/auth/token')
        .send({ email: testUser.email });

      const token = tokenResponse.body.accessToken;

      // Use token to access protected endpoint
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/v1/users/profile').expect(401);

      expect(response.body.error).toContain('token');
    });
  });
});
