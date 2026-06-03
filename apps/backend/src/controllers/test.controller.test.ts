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

describe('TestController - getUserStats', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let nextMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    nextMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return empty stats if no tests found', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

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

  it('should successfully fetch stats from database aggregates', async () => {
    const mockTests = [
      { wpm: 80, accuracy: 98, createdAt: new Date() },
      { wpm: 60, accuracy: 95, createdAt: new Date() },
      { wpm: 40, accuracy: 90, createdAt: new Date() },
    ];

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: 60, accuracy: 94.33333333333333 },
      _max: { wpm: 80, accuracy: 98 },
      _count: { _all: 3 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockTests);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 60,
        averageAccuracy: 94,
        bestWpm: 80,
        bestAccuracy: 98,
        totalTests: 3,
        recentTests: mockTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should respect custom days parameter', async () => {
    mockRequest.query = { days: '7' };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: 0, accuracy: 0 },
      _max: { wpm: 0, accuracy: 0 },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(prisma.testResult.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      })
    );
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        period: 'Last 7 days',
      })
    );
  });

  it('should handle errors via next function', async () => {
    const error = new Error('DB Error');
    (prisma.testResult.findMany as jest.Mock).mockRejectedValue(error);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
