import { Request, Response, NextFunction } from 'express';
import { getUserStats } from './test.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    testResult: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('TestController - getUserStats', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully fetch and format user statistics', async () => {
    const mockTests = Array.from({ length: 15 }, (_, i) => ({
      wpm: 60 + i,
      accuracy: 95,
      createdAt: new Date(Date.now() - i * 3600000),
    }));

    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockTests);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(prisma.testResult.findMany).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      stats: expect.objectContaining({
        totalTests: 15,
        bestWpm: 74,
        averageWpm: 67,
      }),
    }));
  });

  it('should handle empty results', async () => {
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      stats: {
        averageWpm: 0,
        averageAccuracy: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        totalTests: 0,
        recentTests: [],
      },
    }));
  });
});
