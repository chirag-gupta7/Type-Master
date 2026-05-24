import { Response } from 'express';
import { getUserStats } from './test.controller';
import { prisma } from '../utils/prisma';

// Mock prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    testResult: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('TestController - getUserStats', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
      },
      query: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should successfully fetch and format user statistics', async () => {
    const mockStatsResult = {
      _avg: { wpm: 65.5, accuracy: 94.2 },
      _max: { wpm: 82, accuracy: 100 },
      _count: { _all: 25 },
    };

    const mockRecentTests = [
      { wpm: 70, accuracy: 98, createdAt: new Date() },
      { wpm: 60, accuracy: 95, createdAt: new Date() },
    ];

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockStatsResult);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as any, mockResponse as any, nextFunction);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 10,
      orderBy: { createdAt: 'desc' },
    }));

    expect(mockResponse.json).toHaveBeenCalledWith({
      stats: {
        averageWpm: 66,
        averageAccuracy: 94,
        bestWpm: 82,
        bestAccuracy: 100,
        totalTests: 25,
        recentTests: mockRecentTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as any, mockResponse as any, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  it('should handle empty results gracefully', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as any, mockResponse as any, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith({
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
});
