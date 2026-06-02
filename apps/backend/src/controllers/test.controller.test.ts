import { getUserStats } from './test.controller';
import { prisma } from '../utils/prisma';
import { Request, Response } from 'express';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    testResult: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TestController - getUserStats', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let next: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
      },
      query: {},
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as Request, mockResponse as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      message: 'User not authenticated',
    }));
  });

  it('should return stats for user tests', async () => {
    const mockRecentTests = [
      { wpm: 70, accuracy: 96, createdAt: new Date() },
    ];

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: 70, accuracy: 96 },
      _max: { wpm: 80, accuracy: 98 },
      _count: { _all: 3 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as Request, mockResponse as Response, next);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 70,
        averageAccuracy: 96,
        bestWpm: 80,
        bestAccuracy: 98,
        totalTests: 3,
        recentTests: mockRecentTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should handle empty test results', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, next);

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 0,
        averageAccuracy: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        totalTests: 0,
        recentTests: [],
      },
      period: 'Last 30 days',
    });
  });

  it('should respect the days query parameter', async () => {
    mockRequest.query = { days: '7' };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: 0, accuracy: 0 },
      _max: { wpm: 0, accuracy: 0 },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, next);

    expect(prisma.testResult.aggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        createdAt: expect.objectContaining({
          gte: expect.any(Date),
        }),
      }),
    }));
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      period: 'Last 7 days',
    }));
  });
});
