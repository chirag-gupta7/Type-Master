import { Request, Response, NextFunction } from 'express';
import { getLearningStats, getProgressVisualization } from './lesson.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    lesson: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    userLessonProgress: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    testResult: {
      findMany: jest.fn(),
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

describe('LessonController - Optimized Methods', () => {
  let mockRequest: Partial<Request & { user?: { userId: string } }>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    jest.clearAllMocks();
  });

  describe('getLearningStats', () => {
    it('should successfully fetch and format learning statistics', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([
        { completed: true, stars: 3, bestWpm: 60, bestAccuracy: 98 },
        { completed: true, stars: 2, bestWpm: 40, bestAccuracy: 95 },
        { completed: false, stars: 0, bestWpm: 20, bestAccuracy: 80 },
      ]);

      await getLearningStats(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(prisma.lesson.count).toHaveBeenCalled();
      expect(prisma.userLessonProgress.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: {
          completed: true,
          stars: true,
          bestWpm: true,
          bestAccuracy: true,
        },
      });

      expect(jsonMock).toHaveBeenCalledWith({
        stats: {
          totalLessons: 10,
          completedLessons: 2,
          completionPercentage: 20,
          totalStars: 5,
          maxStars: 30,
          averageWpm: 40, // (60+40+20)/3 = 40
          averageAccuracy: 91, // (98+95+80)/3 = 91
        },
      });
    });

    it('should handle zero lessons', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(0);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);

      await getLearningStats(mockRequest as Request, mockResponse as Response, nextFunction);

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

  describe('getProgressVisualization', () => {
    it('should successfully fetch and format progress visualization data', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          level: 1,
          order: 1,
          title: 'Lesson 1',
          difficulty: 'BEGINNER',
          targetWpm: 20,
          userProgress: [{ completed: true, stars: 3, bestWpm: 30, bestAccuracy: 99, attempts: 1, lastAttempt: new Date() }],
        },
        {
          id: 'lesson-2',
          level: 1,
          order: 2,
          title: 'Lesson 2',
          difficulty: 'BEGINNER',
          targetWpm: 25,
          userProgress: [{ completed: false, stars: 0, bestWpm: 0, bestAccuracy: 0, attempts: 0, lastAttempt: new Date() }],
        },
      ];

      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]); // lessonHistory
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]); // testActivity
      // Note: prisma.userLessonProgress.findMany is called again for lessonActivity
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];

      expect(response.completionByLevel).toHaveLength(1);
      expect(response.skillTree).toHaveLength(2);

      // Check first lesson in skillTree
      expect(response.skillTree[0]).toMatchObject({
        id: 'lesson-1',
        completed: true,
        locked: false,
      });

      // Check second lesson in skillTree - should be locked if first is incomplete, but first IS complete
      expect(response.skillTree[1]).toMatchObject({
        id: 'lesson-2',
        completed: false,
        locked: false, // unlocked because lesson-1 is completed
        prerequisites: ['lesson-1'],
      });
    });

    it('should correctly handle locked status', async () => {
        const mockLessons = [
          {
            id: 'lesson-1',
            level: 1,
            order: 1,
            title: 'Lesson 1',
            difficulty: 'BEGINNER',
            targetWpm: 20,
            userProgress: [{ completed: false, stars: 0, bestWpm: 0, bestAccuracy: 0, attempts: 1, lastAttempt: new Date() }],
          },
          {
            id: 'lesson-2',
            level: 1,
            order: 2,
            title: 'Lesson 2',
            difficulty: 'BEGINNER',
            targetWpm: 25,
            userProgress: [],
          },
        ];

        (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
        (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

        await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextFunction);

        const response = jsonMock.mock.calls[0][0];

        expect(response.skillTree[1]).toMatchObject({
          id: 'lesson-2',
          locked: true, // locked because lesson-1 is NOT completed
        });
      });

    it('should correctly handle non-sequential lesson orders', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          level: 1,
          order: 1,
          title: 'Lesson 1',
          difficulty: 'BEGINNER',
          targetWpm: 20,
          userProgress: [{ completed: true, stars: 3, bestWpm: 30, bestAccuracy: 99, attempts: 1, lastAttempt: new Date() }],
        },
        {
          id: 'lesson-3', // Gap in order
          level: 1,
          order: 3,
          title: 'Lesson 3',
          difficulty: 'BEGINNER',
          targetWpm: 25,
          userProgress: [],
        },
      ];

      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextFunction);

      const response = jsonMock.mock.calls[0][0];

      expect(response.skillTree[1]).toMatchObject({
        id: 'lesson-3',
        prerequisites: ['lesson-1'], // Should find lesson-1 despite gap
      });
    });
  });
});
