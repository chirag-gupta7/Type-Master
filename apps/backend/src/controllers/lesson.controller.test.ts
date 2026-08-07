import { Request, Response } from 'express';
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
      aggregate: jest.fn(),
    },
    testResult: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LessonController - getLearningStats and getProgressVisualization', () => {
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
      user: { userId: 'user-123', email: 'user@example.com' },
    };
    jest.clearAllMocks();
  });

  describe('getLearningStats', () => {
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
        _count: { _all: 10 },
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
        _count: {
          _all: true,
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
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

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

      // Check second lesson in skillTree - unlocked because lesson-1 is completed
      expect(response.skillTree[1]).toMatchObject({
        id: 'lesson-2',
        completed: false,
        locked: false,
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
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

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
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

      const response = jsonMock.mock.calls[0][0];

      expect(response.skillTree[1]).toMatchObject({
        id: 'lesson-3',
        prerequisites: ['lesson-1'], // Should find lesson-1 despite gap
      });
    });
  });
});