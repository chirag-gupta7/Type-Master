import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import userRoutes from '../routes/user.routes';
import { errorHandler } from '../middleware/error-handler';
import { prisma } from '../utils/prisma';

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const apiPrefix = '/api/v1';
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(errorHandler);

  return app;
};

process.env.JWT_SECRET = 'test-jwt-secret';

const generateToken = (userId = 'user-123', email = 'test@example.com') => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
};

describe('User Controller - Profile Management', () => {
  const app = createTestApp();
  const token = generateToken();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return user profile when authenticated', async () => {
      (prisma.user.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'typist123',
        image: 'https://example.com/avatar.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { testResults: 5 },
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id', 'user-123');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 when missing authentication header', async () => {
      await request(app).get('/api/v1/users/profile').expect(401);
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    it('should update user profile successfully with valid input', async () => {
      (prisma.user.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);
      (prisma.user.update as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'new_username',
        image: 'https://example.com/new_avatar.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'new_username',
          image: 'https://example.com/new_avatar.png',
        })
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.username).toBe('new_username');
    });

    it('should reject image URLs exceeding 1000 characters to mitigate DoS', async () => {
      const longImageUrl = 'https://example.com/avatar.png?query=' + 'a'.repeat(970); // Total length > 1000

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image: longImageUrl,
        })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });

    it('should reject invalid image URL format', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          image: 'not-a-valid-url',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });

    it('should return 409 conflict if username is already taken by another user', async () => {
      (prisma.user.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'other-user-456',
        username: 'taken_username',
      });

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'taken_username',
        })
        .expect(409);

      expect(response.body.error).toBe('Username already taken');
    });
  });
});
