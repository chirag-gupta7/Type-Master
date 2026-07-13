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

    expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully fetch and format learning statistics using aggregation', async () => {
    const totalLessons = 50;
    const completedLessons = 10;
    const mockAggregatedStats = {
      _sum: {
        stars: 25,
      },
      _avg: {
        bestWpm: 45.6,
        bestAccuracy: 92.4,
      },
    };

    (prisma.lesson.count as jest.Mock).mockResolvedValue(totalLessons);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(completedLessons);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue(mockAggregatedStats);

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(prisma.lesson.count).toHaveBeenCalled();
    expect(prisma.userLessonProgress.count).toHaveBeenCalledWith({
      where: { userId: 'user-123', completed: true },
    });
    expect(prisma.userLessonProgress.aggregate).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      _sum: { stars: true },
      _avg: { bestWpm: true, bestAccuracy: true },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        totalLessons: 50,
        completedLessons: 10,
        completionPercentage: 20,
        totalStars: 25,
        maxStars: 150,
        averageWpm: 46,
        averageAccuracy: 92.4,
      },
    });
  });

  it('should handle empty results gracefully', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: null },
      _avg: { bestWpm: null, bestAccuracy: null },
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
});
