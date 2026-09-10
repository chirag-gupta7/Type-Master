import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { authenticate, optionalAuthenticate } from './auth.middleware';
import { AppError } from './error-handler';

const mockRes = () => ({}) as Response;
const mockNext = () => jest.fn() as unknown as NextFunction & jest.Mock;

beforeEach(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
});

describe('authenticate', () => {
  it('should attach req.user/req.userId and call next() for a valid token', () => {
    const token = jwt.sign({ userId: 'u1', email: 'a@b.com' }, 'test-jwt-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const next = mockNext();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ userId: 'u1', email: 'a@b.com' });
    expect(req.userId).toBe('u1');
  });

  it('should call next(AppError 401) when header is missing', () => {
    const req = { headers: {} } as unknown as Request;
    const next = mockNext();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('should call next(AppError 401 Invalid token) for a garbage token', () => {
    const req = { headers: { authorization: 'Bearer garbage' } } as unknown as Request;
    const next = mockNext();

    authenticate(req, mockRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid token');
  });

  it('should call next(AppError 401 Token expired) for an expired token', () => {
    const expired = jwt.sign({ userId: 'u1', email: 'a@b.com' }, 'test-jwt-secret', {
      expiresIn: '-10s',
    });
    const req = { headers: { authorization: `Bearer ${expired}` } } as unknown as Request;
    const next = mockNext();

    authenticate(req, mockRes(), next);

    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Token expired');
  });
});

describe('optionalAuthenticate', () => {
  it('should call next() without user when header is missing', () => {
    const req = { headers: {} } as unknown as Request;
    const next = mockNext();

    optionalAuthenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });

  it('should attach user for a valid token', () => {
    const token = jwt.sign({ userId: 'u9', email: 'x@y.com' }, 'test-jwt-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const next = mockNext();

    optionalAuthenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ userId: 'u9' });
    expect(req.userId).toBe('u9');
  });

  it('should call next() without user (not reject) for an invalid token', () => {
    const req = { headers: { authorization: 'Bearer bad-token' } } as unknown as Request;
    const next = mockNext();

    optionalAuthenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });
});
