import { Request, Response, NextFunction } from 'express';
import { getProfile, updateProfile } from './user.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserController', () => {
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'user@example.com' },
      body: {},
    };
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'User not authenticated' })
      );
    });

    it('should return user profile successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        username: 'testuser',
        image: 'https://example.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { testResults: 5 },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.any(Object),
      });
      expect(jsonMock).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should return 404 if user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, message: 'User not found' })
      );
    });

    it('should delegate errors to next middleware', async () => {
      const error = new Error('Database failure');
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(error);

      await getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProfile', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'User not authenticated' })
      );
    });

    it('should update user profile successfully when inputs are valid', async () => {
      mockRequest.body = {
        username: 'valid_user123',
        image: 'https://example.com/new-avatar.png',
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'user@example.com',
        username: 'valid_user123',
        image: 'https://example.com/new-avatar.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: 'valid_user123',
          NOT: { id: 'user-123' },
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          username: 'valid_user123',
          image: 'https://example.com/new-avatar.png',
        },
        select: expect.any(Object),
      });
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Profile updated successfully',
        user: mockUpdatedUser,
      });
    });

    it('should throw validation error if username contains invalid characters', async () => {
      mockRequest.body = { username: 'invalid user!' };

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ZodError',
        })
      );
    });

    it('should throw validation error if username is too short', async () => {
      mockRequest.body = { username: 'ab' };

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ZodError',
        })
      );
    });

    it('should throw validation error if image URL is invalid', async () => {
      mockRequest.body = { image: 'not-a-valid-url' };

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ZodError',
        })
      );
    });

    it('should throw validation error if image URL exceeds 1000 characters', async () => {
      const longUrl = `https://example.com/${'a'.repeat(1000)}.png`;
      mockRequest.body = { image: longUrl };

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ZodError',
        })
      );
    });

    it('should return 409 Conflict if username is already taken by another user', async () => {
      mockRequest.body = { username: 'taken_username' };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'other-user-456' });

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409, message: 'Username already taken' })
      );
    });

    it('should delegate unexpected errors to next middleware', async () => {
      mockRequest.body = { username: 'validuser' };
      const error = new Error('Database connection failed');

      (prisma.user.findFirst as jest.Mock).mockRejectedValue(error);

      await updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
