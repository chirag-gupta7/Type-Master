import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.routes';
import { errorHandler } from '../middleware/error-handler';
import { prisma } from '../utils/prisma';

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const apiPrefix = '/api/v1';
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(errorHandler);

  return app;
};

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.INTERNAL_API_SECRET = 'test-internal-secret';

describe('Auth Bypass Vulnerability Reproduction', () => {
  const app = createTestApp();

  beforeAll(async () => {
    // Mock prisma user search and creation
    (prisma.user.findUnique as any) = jest.fn().mockImplementation((args: any) => {
      if (args.where.email === 'victim@example.com') {
        return Promise.resolve({
          id: 'victim-id',
          email: 'victim@example.com',
          username: 'victim',
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
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.$disconnect();
  });

  it('SHOULD NOT be able to get a token for any user without the internal secret', async () => {
    const response = await request(app)
      .post('/api/v1/auth/token')
      .send({ email: 'victim@example.com' })
      .expect(401);

    expect(response.body.error).toBe('Unauthorized');
  });

  it('SHOULD be able to get a token when providing the correct internal secret', async () => {
    const response = await request(app)
      .post('/api/v1/auth/token')
      .set('X-Internal-Token', 'test-internal-secret')
      .send({ email: 'victim@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user.email).toBe('victim@example.com');
  });
});
