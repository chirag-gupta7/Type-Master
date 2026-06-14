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
  let nextFunction: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    nextFunction = jest.fn();
    mockRequest = {
      user: {
        userId: 'user-123',
        email: 'test@example.com',
      },
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return empty stats when no tests are found', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

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

  it('should return calculated stats when tests are found', async () => {
    const mockAggregates = {
      _avg: { wpm: 70, accuracy: 96.5 },
      _max: { wpm: 80, accuracy: 98 },
      _count: { _all: 2 },
    };
    const mockRecentTests = [
      { wpm: 60, accuracy: 95, createdAt: new Date('2023-01-02') },
      { wpm: 80, accuracy: 98, createdAt: new Date('2023-01-01') },
    ];

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregates);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 70,
        averageAccuracy: 97, // Math.round(96.5)
        bestWpm: 80,
        bestAccuracy: 98,
        totalTests: 2,
        recentTests: mockRecentTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should filter by duration if provided', async () => {
    mockRequest.query = { duration: '60' };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(prisma.testResult.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          duration: 60,
        }),
      })
    );
    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          duration: 60,
        }),
      })
    );
  });

  it('should call next with error if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = nextFunction.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});
