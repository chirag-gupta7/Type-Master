import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError, errorHandler } from './error-handler';

jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const mockReq = () => ({ url: '/test', method: 'GET' }) as unknown as Request;
const mockRes = () => {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & { status: jest.Mock; json: jest.Mock };
};
const mockNext = () => jest.fn() as unknown as NextFunction;

describe('AppError', () => {
  it('should store statusCode/message and default isOperational=true', () => {
    const err = new AppError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('should respect isOperational=false', () => {
    expect(new AppError(500, 'x', false).isOperational).toBe(false);
  });
});

describe('errorHandler', () => {
  it('should map AppError to its statusCode/message', () => {
    const res = mockRes();
    errorHandler(new AppError(403, 'Forbidden'), mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should map ZodError to 400 with details', () => {
    let zodErr: unknown;
    try {
      z.object({ email: z.string().email() }).parse({ email: 'bad' });
    } catch (e) {
      zodErr = e;
    }
    const res = mockRes();
    errorHandler(zodErr as Error, mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.error).toBe('Validation error');
    expect(body.details).toBeDefined();
  });

  it('should map generic Error to 500 without leaking message outside development', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const res = mockRes();
    errorHandler(new Error('secret-boom'), mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    process.env.NODE_ENV = prev;
  });

  it('should expose message in development for generic errors', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    errorHandler(new Error('dev-boom'), mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'dev-boom' });
    process.env.NODE_ENV = prev;
  });
});
