/**
 * Email normalization regression tests.
 *
 * Postgres `findUnique` on a text column is case-sensitive, so an un-normalized
 * email splits one human into two rows ("User@x.com" from register vs
 * "user@x.com" from OAuth) and makes sign-in fail on the "wrong" casing.
 * Normalization is applied at the zod schema boundary for every auth entry
 * point, so these tests assert the *lookup key*, not just the HTTP outcome.
 */

import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/auth.routes';
import { errorHandler } from '../middleware/error-handler';
import { prisma } from '../utils/prisma';

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
  },
}));

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.INTERNAL_API_SECRET = 'test-internal-secret';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

// The canonical, already-lowercased row stored in the DB.
const STORED_USER = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashed-password',
};

// Row written BEFORE normalization existed: original casing preserved.
// These users typed their stored casing and signed in fine, so normalizing the
// lookup key alone would lock them out.
const LEGACY_USER = {
  id: 'user-legacy',
  email: 'Legacy.User@Example.COM',
  username: 'legacyuser',
  password: 'hashed-password',
};

const USERS = [STORED_USER, LEGACY_USER];

const findUnique = ((prisma.user.findUnique as any) = jest.fn());
const findFirst = ((prisma.user.findFirst as any) = jest.fn());
const create = ((prisma.user.create as any) = jest.fn());

describe('Auth email normalization', () => {
  const app = createTestApp();

  beforeEach(() => {
    jest.clearAllMocks();

    // Exact-match lookup (the fast, indexed path).
    findUnique.mockImplementation((args: { where: { email?: string; id?: string } }) => {
      if (args.where.email) {
        return Promise.resolve(USERS.find((u) => u.email === args.where.email) ?? null);
      }
      if (args.where.id) {
        return Promise.resolve(USERS.find((u) => u.id === args.where.id) ?? null);
      }
      return Promise.resolve(null);
    });

    findFirst.mockImplementation((args: { where: Record<string, unknown> }) => {
      // Register duplicate check: OR over email/username clauses. The email
      // clause is an object ({ equals, mode }) since the query is
      // case-insensitive.
      const or = args.where.OR as { email: unknown; username: string }[] | undefined;
      if (or) {
        return Promise.resolve(
          USERS.find((u) =>
            or.some((c) => {
              const clause = c.email as { equals?: string } | string;
              const value = typeof clause === 'string' ? clause : clause?.equals;
              const emailMatch =
                value !== undefined && value.toLowerCase() === u.email.toLowerCase();
              return emailMatch || c.username === u.username;
            })
          ) ?? null
        );
      }
      // Case-insensitive email fallback.
      const email = args.where.email as { equals?: string } | undefined;
      if (email?.equals !== undefined) {
        const target = email.equals.toLowerCase();
        return Promise.resolve(USERS.find((u) => u.email.toLowerCase() === target) ?? null);
      }
      return Promise.resolve(null);
    });

    create.mockImplementation((args: { data: { email: string } }) =>
      Promise.resolve({ id: 'new-id', createdAt: new Date(), ...args.data })
    );
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('normalizes mixed-case and padded email before the DB lookup', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '  TeSt@ExAmPlE.CoM  ', password: 'Password1' })
        .expect(200);

      expect(findUnique).toHaveBeenCalledWith({ where: { email: STORED_USER.email } });
      expect(response.body.user.email).toBe(STORED_USER.email);
    });

    it('accepts an all-uppercase email that differs from the stored casing', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'TEST@EXAMPLE.COM', password: 'Password1' })
        .expect(200);

      expect(findUnique).toHaveBeenCalledWith({ where: { email: STORED_USER.email } });
    });

    it('still rejects a wrong password for a correctly-cased email', async () => {
      // Guards against "fixing" login by skipping the password check.
      const bcrypt = (await import('bcrypt')).default;
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'Test@Example.com', password: 'WrongPass1' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('rejects a genuinely invalid email after trimming', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '   not-an-email   ', password: 'Password1' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('persists the lowercased email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'NewUser@Example.COM', username: 'newuser', password: 'Password1' })
        .expect(201);

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'newuser@example.com' }),
        })
      );
    });

    it('reports "Email already registered" for a casing variant of a taken email', async () => {
      // Before normalization the `existingUser.email === email` comparison was
      // false, so this wrongly surfaced as "Username already taken".
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'TEST@EXAMPLE.COM', username: 'otheruser', password: 'Password1' })
        .expect(409);

      expect(response.body.error).toBe('Email already registered');
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/token', () => {
    it('resolves a casing variant to the existing user instead of creating a duplicate', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: '  Test@EXAMPLE.com  ' })
        .expect(200);

      expect(create).not.toHaveBeenCalled();
      expect(response.body.user.id).toBe(STORED_USER.id);
    });
  });

  describe('legacy rows written before normalization', () => {
    // Regression guard: normalizing the lookup key must not lock out accounts
    // that were stored with their original casing, nor create a second row.
    it('logs in a user whose stored email has uppercase characters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'legacy.user@example.com', password: 'Password1' })
        .expect(200);

      expect(response.body.user.id).toBe(LEGACY_USER.id);
    });

    it('logs in a legacy user who types their original casing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'Legacy.User@Example.COM', password: 'Password1' })
        .expect(200);

      expect(response.body.user.id).toBe(LEGACY_USER.id);
    });

    it('resolves a legacy row on token provision instead of creating a duplicate', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('X-Internal-Token', 'test-internal-secret')
        .send({ email: 'legacy.user@example.com' })
        .expect(200);

      expect(response.body.user.id).toBe(LEGACY_USER.id);
      expect(create).not.toHaveBeenCalled();
    });

    it('reports the email conflict for a legacy row on re-registration', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'LEGACY.user@example.com', username: 'brandnew', password: 'Password1' })
        .expect(409);

      expect(response.body.error).toBe('Email already registered');
      expect(create).not.toHaveBeenCalled();
    });
  });
});
