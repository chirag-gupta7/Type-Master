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
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockNext = jest.fn();
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully fetch and calculate user stats', async () => {
    const mockTests = [
      { wpm: 80, accuracy: 100, createdAt: new Date('2023-01-02') },
      { wpm: 60, accuracy: 95, createdAt: new Date('2023-01-01') },
    ];

    const mockAggregate = {
      _avg: { wpm: 70, accuracy: 97.5 },
      _max: { wpm: 80, accuracy: 100 },
      _count: { _all: 2 },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockTests);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 70,
        averageAccuracy: 98, // Math.round(97.5)
        bestWpm: 80,
        bestAccuracy: 100,
        totalTests: 2,
        recentTests: mockTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should handle no tests case', async () => {
    const mockAggregate = {
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
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

  it('should handle custom days query', async () => {
    mockRequest.query = { days: '7' };
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        period: 'Last 7 days',
      })
    );
  });
});
