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

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TestController - getUserStats', () => {
  let mockRequest: any;
  let mockResponse: any;
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      user: { userId: 'user-123' },
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should successfully fetch and calculate user stats', async () => {
    const mockAggregate = {
      _avg: { wpm: 70, accuracy: 95 },
      _max: { wpm: 80, accuracy: 100 },
      _count: { _all: 3 },
    };
    const mockRecentTests = [
      { wpm: 60, accuracy: 95, createdAt: new Date() },
      { wpm: 80, accuracy: 90, createdAt: new Date() },
      { wpm: 70, accuracy: 100, createdAt: new Date() },
    ];

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      stats: {
        averageWpm: 70,
        averageAccuracy: 95,
        bestWpm: 80,
        bestAccuracy: 100,
        totalTests: 3,
        recentTests: mockRecentTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should handle zero tests', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

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

  it('should call next with error if something fails', async () => {
    const error = new Error('DB Error');
    (prisma.testResult.aggregate as jest.Mock).mockRejectedValue(error);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(error);
  });
});
