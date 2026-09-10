import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { refreshToken } from './auth.controller';
import { AppError } from '../middleware/error-handler';
import { ZodError } from 'zod';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const mockRes = () => {
  const res = {} as Partial<Response>;
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res as Response & { json: jest.Mock; status: jest.Mock };
};

describe('refreshToken (direct unit)', () => {
  let req: Partial<Request>;
  let res: Response & { json: jest.Mock; status: jest.Mock };
  let next: NextFunction & jest.Mock;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    req = { body: {} };
    res = mockRes();
    next = jest.fn() as unknown as NextFunction & jest.Mock;
  });

  it('should return a new accessToken for a valid refresh token', async () => {
    const token = jwt.sign(
      { userId: 'u1', email: 'a@b.com' },
      process.env.JWT_REFRESH_SECRET as string
    );
    req.body = { refreshToken: token };

    await refreshToken(req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledTimes(1);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload).toHaveProperty('accessToken');
    const decoded = jwt.verify(
      payload.accessToken,
      process.env.JWT_SECRET as string
    ) as { userId: string; email: string };
    expect(decoded.userId).toBe('u1');
    expect(decoded.email).toBe('a@b.com');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(AppError 401) for an invalid token', async () => {
    req.body = { refreshToken: 'not-a-valid-token' };

    await refreshToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/refresh token/i);
  });

  it('should call next(AppError 401) for an expired token', async () => {
    const expired = jwt.sign({ userId: 'u1', email: 'a@b.com' }, process.env
      .JWT_REFRESH_SECRET as string, { expiresIn: '-10s' });
    req.body = { refreshToken: expired };

    await refreshToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/refresh token/i);
  });

  it('should forward ZodError when refreshToken is missing', async () => {
    req.body = {};

    await refreshToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ZodError);
  });
});
