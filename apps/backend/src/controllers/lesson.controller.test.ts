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
  let mockRequest: Partial<Request & { user?: { userId: string } }>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should successfully fetch and format learning statistics', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(5);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: 12 },
      _avg: { bestWpm: 45.5, bestAccuracy: 92.2 },
    });

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextFunction);

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
        totalLessons: 10,
        completedLessons: 5,
        completionPercentage: 50,
        totalStars: 12,
        maxStars: 30,
        averageWpm: 46, // Math.round(45.5)
        averageAccuracy: 92.2, // Math.round(92.2 * 10) / 10
      },
    });
  });

  it('should handle zero progress gracefully', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: null },
      _avg: { bestWpm: null, bestAccuracy: null },
    });

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        totalLessons: 10,
        completedLessons: 0,
        completionPercentage: 0,
        totalStars: 0,
        maxStars: 30,
        averageWpm: 0,
        averageAccuracy: 0,
      },
    });
  });

  it('should call next with error on database failure', async () => {
    const error = new Error('DB Error');
    (prisma.lesson.count as jest.Mock).mockRejectedValue(error);

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(error);
  });
});
