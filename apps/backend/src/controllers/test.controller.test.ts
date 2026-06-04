import { Request, Response } from 'express';
import { getUserStats } from './test.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    testResult: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('TestController - getUserStats', () => {
  let mockRequest: Partial<Request & { user?: { userId: string } }>;
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
      user: { userId: 'user-123', email: 'test@example.com' } as any,
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is missing', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as any, mockResponse as any, nextMock);

    expect(nextMock).toHaveBeenCalled();
    const error = nextMock.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should successfully fetch and calculate user stats using optimization', async () => {
    const now = new Date();
    const mockRecentTests = [
      { wpm: 70, accuracy: 100, createdAt: now },
      { wpm: 60, accuracy: 95, createdAt: now },
    ];

    const mockAggregate = {
      _avg: { wpm: 65, accuracy: 97.5 },
      _max: { wpm: 70, accuracy: 100 },
      _count: { _all: 2 },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as any, mockResponse as any, nextMock);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      })
    );

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 65,
        averageAccuracy: 98,
        bestWpm: 70,
        bestAccuracy: 100,
        totalTests: 2,
        recentTests: mockRecentTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should return empty stats if no tests found using optimization', async () => {
    const mockAggregate = {
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as any, mockResponse as any, nextMock);

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
});
