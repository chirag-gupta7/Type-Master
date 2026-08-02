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

describe('LessonController - Optimized Methods', () => {
  let mockRequest: Partial<Request & { user?: { userId: string } }>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-123', email: 'test@example.com' },
    };
    jest.clearAllMocks();
  });

  describe('getLearningStats', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await getLearningStats(mockRequest as any, mockResponse as any, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should calculate learning stats correctly using database aggregation', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(5);
      (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
        _sum: { stars: 5 },
        _avg: { bestWpm: 45, bestAccuracy: 92.5 },
        _count: { _all: 2 },
      });

      await getLearningStats(mockRequest as any, mockResponse as any, nextFunction);

      expect(prisma.userLessonProgress.aggregate).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        _sum: { stars: true },
        _avg: { bestWpm: true, bestAccuracy: true },
        _count: { _all: true },
      });
      expect(jsonMock).toHaveBeenCalledWith({
        stats: {
          totalLessons: 10,
          completedLessons: 5,
          completionPercentage: 50,
          totalStars: 5,
          maxStars: 30,
          averageWpm: 45,
          averageAccuracy: 92.5,
        },
      });
    });

    it('should return default stats when no progress', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
      (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
        _sum: { stars: null },
        _avg: { bestWpm: null, bestAccuracy: null },
        _count: { _all: 0 },
      });

      await getLearningStats(mockRequest as any, mockResponse as any, nextFunction);

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
