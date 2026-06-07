import { Request, Response } from 'express';
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

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TestController - getUserStats', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    nextMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
      query: {},
    } as unknown as Request;
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully fetch and format user statistics using aggregation', async () => {
    const mockRecentTests = [
      { wpm: 80, accuracy: 100, createdAt: new Date() },
      { wpm: 60, accuracy: 95, createdAt: new Date() },
    ];

    const mockStatsResult = {
      _count: { _all: 2 },
      _avg: { wpm: 70, accuracy: 97.5 },
      _max: { wpm: 80, accuracy: 100 },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockStatsResult);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(prisma.testResult.aggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.any(Object),
      _count: { _all: true },
      _avg: { wpm: true, accuracy: true },
      _max: { wpm: true, accuracy: true },
    }));

    expect(prisma.testResult.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }));

    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      stats: {
        averageWpm: 70,
        averageAccuracy: 98, // Math.round(97.5)
        bestWpm: 80,
        bestAccuracy: 100,
        totalTests: 2,
        recentTests: mockRecentTests,
      },
    }));
  });

  it('should handle zero tests correctly with aggregation', async () => {
    const mockStatsResult = {
      _count: { _all: 0 },
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockStatsResult);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

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
