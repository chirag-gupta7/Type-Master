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
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getLearningStats(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully calculate and return learning statistics', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(100);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: 5 },
      _avg: { bestWpm: 50, bestAccuracy: 96.5 },
      _count: { _all: 2 },
    });

    await getLearningStats(mockRequest as any, mockResponse as any, mockNext);

    expect(prisma.lesson.count).toHaveBeenCalled();
    expect(prisma.userLessonProgress.count).toHaveBeenCalledWith({
      where: { userId: 'user-123', completed: true },
    });
    expect(prisma.userLessonProgress.aggregate).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      _sum: { stars: true },
      _avg: { bestWpm: true, bestAccuracy: true },
      _count: { _all: true },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        totalLessons: 100,
        completedLessons: 10,
        completionPercentage: 10,
        totalStars: 5,
        maxStars: 300,
        averageWpm: 50,
        averageAccuracy: 96.5,
      },
    });
  });

  it('should handle zero progress gracefully', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(100);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: null },
      _avg: { bestWpm: null, bestAccuracy: null },
      _count: { _all: 0 },
    });

    await getLearningStats(mockRequest as any, mockResponse as any, mockNext);

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        totalLessons: 100,
        completedLessons: 0,
        completionPercentage: 0,
        totalStars: 0,
        maxStars: 300,
        averageWpm: 0,
        averageAccuracy: 0,
      },
    });
  });
});
