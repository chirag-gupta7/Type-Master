import { Request, Response } from 'express';
import { getUserStats } from './test.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    testResult: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('TestController - getUserStats', () => {
  let mockRequest: Partial<Request & { user?: { userId: string } }>;
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
      user: { userId: 'user-123', email: 'test@example.com' } as any,
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully fetch and format user statistics', async () => {
    const mockAggregates = {
      _avg: { wpm: 75.5, accuracy: 96.2 },
      _max: { wpm: 120, accuracy: 100 },
      _count: { _all: 15 },
    };

    const mockRecentTests = [
      { wpm: 80, accuracy: 98, createdAt: new Date() },
      { wpm: 70, accuracy: 94, createdAt: new Date() },
    ];

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregates);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalled();

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 76,
        averageAccuracy: 96,
        bestWpm: 120,
        bestAccuracy: 100,
        totalTests: 15,
        recentTests: mockRecentTests,
      },
      period: expect.stringContaining('Last 30 days'),
    });
  });

  it('should handle empty results', async () => {
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
      period: expect.stringContaining('Last 30 days'),
    });
  });
});
