import { Request, Response } from 'express';
import './test.controller'; // Ensure Request augmentation is loaded
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

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
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
      user: { userId: 'user-123' },
      query: { days: '30' },
    };
    jest.clearAllMocks();
  });

  it('should calculate stats correctly using aggregate', async () => {
    const mockTests = [
      { wpm: 60, accuracy: 95, createdAt: new Date() },
      { wpm: 70, accuracy: 98, createdAt: new Date() },
      { wpm: 50, accuracy: 92, createdAt: new Date() },
    ];

    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: 60, accuracy: 95 },
      _max: { wpm: 70, accuracy: 98 },
      _count: { _all: 3 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockTests);

    await getUserStats(mockRequest as any, mockResponse as any, nextMock);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 60, // (60+70+50)/3
        averageAccuracy: 95, // (95+98+92)/3
        bestWpm: 70,
        bestAccuracy: 98,
        totalTests: 3,
        recentTests: mockTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should return default stats when no tests found', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
      _count: { _all: 0 },
    });
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

  it('should handle errors', async () => {
    const error = new Error('DB Error');
    (prisma.testResult.findMany as jest.Mock).mockRejectedValue(error);

    await getUserStats(mockRequest as any, mockResponse as any, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
