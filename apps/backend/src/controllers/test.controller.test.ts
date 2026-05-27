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
  let mockRequest: any;
  let mockResponse: any;
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
      query: {},
    };
    jest.clearAllMocks();
  });

  it('should return stats for user tests using aggregate', async () => {
    const mockRecentTests = [
      { wpm: 60, accuracy: 95, createdAt: new Date() },
      { wpm: 40, accuracy: 85, createdAt: new Date() },
    ];
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _count: { _all: 2 },
      _avg: { wpm: 50, accuracy: 90 },
      _max: { wpm: 60, accuracy: 95 },
    });
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue(mockRecentTests);

    await getUserStats(mockRequest as any, mockResponse as any, nextMock);

    expect(prisma.testResult.aggregate).toHaveBeenCalled();
    expect(prisma.testResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        where: expect.objectContaining({ userId: 'user-123' }),
      })
    );

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        averageWpm: 50,
        averageAccuracy: 90,
        bestWpm: 60,
        bestAccuracy: 95,
        totalTests: 2,
        recentTests: mockRecentTests,
      },
      period: 'Last 30 days',
    });
  });

  it('should handle no tests found with aggregate', async () => {
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _count: { _all: 0 },
      _avg: { wpm: null, accuracy: null },
      _max: { wpm: null, accuracy: null },
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
});
