import express from 'express';
import request from 'supertest';
import assessmentRoutes from '../routes/assessment.routes';
import { errorHandler } from '../middleware/error-handler';
import { prisma } from '../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-jwt-secret';
process.env.JWT_SECRET = JWT_SECRET;

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.use('/api/v1/assessment', assessmentRoutes);
  app.use(errorHandler);

  return app;
};

const generateToken = (userId: string, email = 'test@example.com') => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });
};

describe('Assessment Controller Input Validation', () => {
  const app = createTestApp();
  const validToken = generateToken('test-user-123');

  beforeAll(() => {
    (prisma.user.findUnique as any) = jest.fn().mockResolvedValue({ id: 'test-user-123' });
    (prisma.lesson.findFirst as any) = jest.fn().mockResolvedValue({
      id: 'lesson-1',
      content: 'Sample text',
      targetWpm: 40,
      minAccuracy: 95,
      level: 1,
    });
    (prisma.userSkillAssessment.create as any) = jest.fn().mockResolvedValue({
      id: 'assessment-123',
      overallWpm: 60,
      overallAccuracy: 98,
      recommendedLevel: 'ADVANCED',
    });
    (prisma.userLessonProgress.createMany as any) = jest.fn().mockResolvedValue({ count: 2 });
    (prisma.lesson.findMany as any) = jest.fn().mockResolvedValue([{ id: 'lesson-1' }]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/assessment/complete', () => {
    it('should reject requests with wpm exceeding 300', async () => {
      const response = await request(app)
        .post('/api/v1/assessment/complete')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          wpm: 350, // exceeds max 300
          accuracy: 95,
          mistakesByKey: { a: 1 },
          weakFingers: ['index-left'],
          timeSpent: 60,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject requests with timeSpent exceeding 86400 seconds', async () => {
      const response = await request(app)
        .post('/api/v1/assessment/complete')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          wpm: 60,
          accuracy: 95,
          mistakesByKey: { a: 1 },
          weakFingers: ['index-left'],
          timeSpent: 100000, // exceeds max 86400
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject requests with weakFingers exceeding 20 items', async () => {
      const oversizedFingers = Array(21).fill('finger');
      const response = await request(app)
        .post('/api/v1/assessment/complete')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          wpm: 60,
          accuracy: 95,
          mistakesByKey: { a: 1 },
          weakFingers: oversizedFingers,
          timeSpent: 60,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should accept valid assessment payload', async () => {
      const response = await request(app)
        .post('/api/v1/assessment/complete')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          wpm: 60,
          accuracy: 95,
          mistakesByKey: { a: 1 },
          weakFingers: ['index-left'],
          timeSpent: 60,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Assessment completed');
    });
  });
});
