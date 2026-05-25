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
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
      query: {},
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should successfully fetch and calculate user stats', async () => {
    const mockRecentTests = [
      { wpm: 70, accuracy: 92, createdAt: new Date('2025-01-03') },
      { wpm: 80, accuracy: 98, createdAt: new Date('2025-01-02') },
      { wpm: 60, accuracy: 95, createdAt: new Date('2025-01-01') },
    ];

    const mockAggregate = {
      _avg: { wpm: 70, accuracy: 95 },
      _max: { wpm: 80, accuracy: 98 },
      _count: { _all: 3 },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 70,
        averageAccuracy: 95,
        bestWpm: 80,
        bestAccuracy: 98,
        totalTests: 3,
        recentTests: mockRecentTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should return empty stats if no tests found', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

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

  it('should handle custom days query parameter', async () => {
    mockRequest.query = { days: '7' };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        period: 'Last 7 days',
      })
    );
  });
});
