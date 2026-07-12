import { Request, Response } from 'express';
import { getLearningStats } from './lesson.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    lesson: {
      count: jest.fn(),
    },
    userLessonProgress: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('LessonController - getLearningStats', () => {
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
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
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    expect(nextMock.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should successfully fetch and format learning statistics', async () => {
    const mockTotalLessons = 100;
    const mockCompletedLessons = 10;
    const mockStatsAggregate = {
      _sum: { stars: 5 },
      _avg: { bestWpm: 55, bestAccuracy: 96.5 },
    };

    (prisma.lesson.count as jest.Mock).mockResolvedValue(mockTotalLessons);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(mockCompletedLessons);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue(mockStatsAggregate);

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(prisma.lesson.count).toHaveBeenCalled();
    expect(prisma.userLessonProgress.count).toHaveBeenCalledWith({
      where: { userId: 'user-123', completed: true },
    });
    expect(prisma.userLessonProgress.aggregate).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      _sum: {
        stars: true,
      },
      _avg: {
        bestWpm: true,
        bestAccuracy: true,
      },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        totalLessons: 100,
        completedLessons: 10,
        completionPercentage: 10,
        totalStars: 5,
        maxStars: 300,
        averageWpm: 55,
        averageAccuracy: 96.5,
      },
    });
  });

  it('should handle zero lessons gracefully', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: null },
      _avg: { bestWpm: null, bestAccuracy: null },
      _count: { _all: 0 },
    });

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        totalLessons: 0,
        completedLessons: 0,
        completionPercentage: 0,
        totalStars: 0,
        maxStars: 0,
        averageWpm: 0,
        averageAccuracy: 0,
      },
    });
  });

  it('should handle errors gracefully', async () => {
    (prisma.lesson.count as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
  });
});
