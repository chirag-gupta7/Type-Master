import { Request, Response, NextFunction } from 'express';
import { internalOnly } from './auth.middleware';
import { AppError } from './error-handler';

describe('internalOnly middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = 'super-secret';
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should call next() if the token is correct', () => {
    mockRequest.headers!['x-internal-token'] = 'super-secret';
    internalOnly(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith();
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next(AppError) if the token is missing', () => {
    internalOnly(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should call next(AppError) if the token is wrong (same length)', () => {
    mockRequest.headers!['x-internal-token'] = 'wrong-secret';
    internalOnly(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next(AppError) if the token is wrong (different length)', () => {
    mockRequest.headers!['x-internal-token'] = 'wrong';
    internalOnly(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should call next(AppError) if INTERNAL_API_SECRET is not defined', () => {
    delete process.env.INTERNAL_API_SECRET;
    internalOnly(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(503);
  });
});
