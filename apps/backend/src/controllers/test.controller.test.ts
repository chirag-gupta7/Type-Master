import { Request, Response, NextFunction } from 'express';
import { getUserStats, getUserTests } from './test.controller';
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
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
mockRequest = {
      user: { userId: 'user-123', email: 'user@example.com' },
      query: { days: '30' },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserStats(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
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

    await getUserStats(mockRequest as Request, mockResponse as Response, mockNext);

    expect(prisma.testResult.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
        _count: { _all: true },
        _avg: { wpm: true, accuracy: true },
        _max: { wpm: true, accuracy: true },
      })
    );

    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    );

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: {
          averageWpm: 70,
          averageAccuracy: 98,
          bestWpm: 80,
          bestAccuracy: 100,
          totalTests: 2,
          recentTests: mockRecentTests,
        },
      })
    );
  });

  it('should handle zero tests correctly with aggregation', async () => {
    const mockStatsResult = {
      _count: { _all: 0 },
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockStatsResult);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: {
          averageWpm: 0,
          averageAccuracy: 0,
          bestWpm: 0,
          bestAccuracy: 0,
          totalTests: 0,
          recentTests: [],
        },
      })
    );
  });

  it('should respect the days query parameter', async () => {
    mockRequest.query = { days: '7' };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: 0, accuracy: 0 },
      _max: { wpm: 0, accuracy: 0 },
      _count: { _all: 0 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

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

  it('should filter by duration if provided', async () => {
    mockRequest.query = { duration: '60', days: '30' };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: 70, accuracy: 95 },
      _max: { wpm: 80, accuracy: 98 },
      _count: { _all: 2 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

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

  it('should reject invalid days parameter below 1', async () => {
    mockRequest.query = { days: '0' };

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ name: 'ZodError' }));
  });

  it('should reject invalid days parameter exceeding max limit', async () => {
    mockRequest.query = { days: '10000' };

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ name: 'ZodError' }));
  });

  it('should handle errors', async () => {
    const error = new Error('DB Error');
    (prisma.testResult.findMany as jest.Mock).mockRejectedValue(error);

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  // Regression: non-numeric duration/days used to be passed into Prisma as
  // NaN, producing an unhandled 500 instead of a client error.
  it('should reject a non-numeric duration with 400', async () => {
    mockRequest.query = { duration: 'abc', days: '30' };

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(prisma.testResult.aggregate).not.toHaveBeenCalled();
  });

  it('should reject a non-numeric days parameter with 400', async () => {
    mockRequest.query = { days: 'xyz' };

    await getUserStats(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(prisma.testResult.aggregate).not.toHaveBeenCalled();
  });
});

describe('TestController - getUserTests', () => {
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'user@example.com' },
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getUserTests(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should fetch user tests with default pagination parameters', async () => {
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.testResult.count as jest.Mock).mockResolvedValue(0);

    await getUserTests(mockRequest as Request, mockResponse as Response, mockNext);

    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123' },
        take: 20,
        skip: 0,
      })
    );
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tests: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      })
    );
  });

  it('should validate and parse custom valid query parameters', async () => {
    mockRequest.query = { page: '2', limit: '10', duration: '60' };
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.testResult.count as jest.Mock).mockResolvedValue(15);

    await getUserTests(mockRequest as Request, mockResponse as Response, mockNext);

    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-123', duration: 60 },
        take: 10,
        skip: 10,
      })
    );
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: {
          page: 2,
          limit: 10,
          total: 15,
          totalPages: 2,
        },
      })
    );
  });

  it('should reject invalid query parameters with a validation error', async () => {
    mockRequest.query = { limit: '9999' }; // Exceeds max limit of 100

    await getUserTests(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
