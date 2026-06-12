import { Request, Response } from 'express';
import * as testController from './test.controller';
import { prisma } from '../utils/prisma';

jest.mock('../utils/prisma', () => ({
  prisma: {
    testResult: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('Test Controller - getUserStats', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 'user-1', email: 'test@example.com' },
      query: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should return stats when tests exist', async () => {
    const mockRecentTests = [
      { wpm: 60, accuracy: 95, createdAt: new Date() },
      { wpm: 50, accuracy: 90, createdAt: new Date() },
    ];
    const mockAggregate = {
      _avg: { wpm: 55, accuracy: 92.5 },
      _max: { wpm: 60, accuracy: 95 },
      _count: { _all: 2 },
    };

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await testController.getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      stats: {
        averageWpm: 55,
        averageAccuracy: 93, // Math.round(92.5)
        bestWpm: 60,
        bestAccuracy: 95,
        totalTests: 2,
        recentTests: mockRecentTests,
      },
    }));
    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 10
    }));
  });

  it('should return default stats when no tests exist', async () => {
    const mockAggregate = {
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await testController.getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
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

  it('should handle custom days and duration query params', async () => {
    mockRequest.query = { days: '7', duration: '60' };
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: {}, _max: {}, _count: {}
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await testController.getUserStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(prisma.testResult.aggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        duration: 60,
      }),
    }));
  });
});
