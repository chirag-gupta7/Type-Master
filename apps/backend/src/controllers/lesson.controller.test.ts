import { Request, Response } from 'express';
import { getLearningStats } from './lesson.controller';
import { prisma } from '../utils/prisma';

// Mock the prisma client
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

describe('lesson.controller - getLearningStats', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return learning stats correctly when progress exists', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(5);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: 12 },
      _avg: { bestWpm: 45.5, bestAccuracy: 98.2 },
    });

    await getLearningStats(req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
      stats: {
        totalLessons: 10,
        completedLessons: 5,
        completionPercentage: 50,
        totalStars: 12,
        maxStars: 30,
        averageWpm: 46, // Math.round(45.5)
        averageAccuracy: 98.2, // Math.round(98.2 * 10) / 10
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle zero progress correctly', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: null },
      _avg: { bestWpm: null, bestAccuracy: null },
    });

    await getLearningStats(req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
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
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error if user is not authenticated', async () => {
    req.user = undefined;

    await getLearningStats(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });
});
