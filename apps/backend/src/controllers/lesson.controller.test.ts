
import { Request, Response } from 'express';
import { getLearningStats, getProgressVisualization } from './lesson.controller';
import { prisma } from '../utils/prisma';

// Mock prisma
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

describe('Lesson Controller Optimized Methods', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 'user-1' } as any,
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('getLearningStats', () => {
    it('should correctly calculate statistics from consolidated query results', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([
        { completed: true, stars: 3, bestWpm: 60, bestAccuracy: 98 },
        { completed: true, stars: 2, bestWpm: 50, bestAccuracy: 95 },
        { completed: false, stars: 0, bestWpm: 40, bestAccuracy: 90 },
      ]);

      await getLearningStats(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
        stats: {
          totalLessons: 10,
          completedLessons: 2,
          completionPercentage: 20,
          totalStars: 5,
          maxStars: 30,
          averageWpm: 50,
          averageAccuracy: 94.3,
        },
      });
      // Verify query consolidation: 1 count + 1 findMany = 2 queries
      expect(prisma.lesson.count).toHaveBeenCalledTimes(1);
      expect(prisma.userLessonProgress.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle zero lessons or progress', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(0);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);

      await getLearningStats(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith({
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
    const today = new Date();
    const dateStr1 = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr2 = yesterday.toISOString().split('T')[0];

    const mockLessons = [
      {
        id: 'l1',
        title: 'Lesson 1',
        level: 1,
        order: 1,
        difficulty: 'Easy',
        targetWpm: 20,
        userProgress: [
          {
            completed: true,
            bestWpm: 25,
            bestAccuracy: 99,
            stars: 3,
            attempts: 1,
            lastAttempt: today,
          },
        ],
      },
      {
        id: 'l2',
        title: 'Lesson 2',
        level: 1,
        order: 2,
        difficulty: 'Easy',
        targetWpm: 25,
        userProgress: [
          {
            completed: true,
            bestWpm: 30,
            bestAccuracy: 98,
            stars: 3,
            attempts: 1,
            lastAttempt: yesterday,
          },
        ],
      },
      {
        id: 'l3',
        title: 'Lesson 3',
        level: 2,
        order: 1,
        difficulty: 'Medium',
        targetWpm: 35,
        userProgress: [],
      },
    ];

    it('should correctly build skill tree and activity frequency', async () => {
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([
        { createdAt: today },
      ]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextFunction);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];

      // Verify skill tree construction and dependencies
      expect(response.skillTree).toHaveLength(3);
      expect(response.skillTree[0].locked).toBe(false); // First lesson
      expect(response.skillTree[1].prerequisites).toContain('l1');
      expect(response.skillTree[1].locked).toBe(false); // l1 is completed

      // Verify practice frequency (1 test + 1 lesson today, 1 lesson yesterday)
      expect(response.practiceFrequency).toContainEqual({ date: dateStr1, count: 2 });
      expect(response.practiceFrequency).toContainEqual({ date: dateStr2, count: 1 });

      // Verify database queries: 1 lesson findMany + 1 testResult findMany = 2 queries
      expect(prisma.lesson.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.testResult.findMany).toHaveBeenCalledTimes(1);
    });

    it('should correctly handle locked status when prerequisites are not met', async () => {
        const incompleteLessons = [
            {
              id: 'l1',
              title: 'Lesson 1',
              level: 1,
              order: 1,
              difficulty: 'Easy',
              targetWpm: 20,
              userProgress: [{ completed: false, lastAttempt: new Date() }],
            },
            {
              id: 'l2',
              title: 'Lesson 2',
              level: 1,
              order: 2,
              difficulty: 'Easy',
              targetWpm: 25,
              userProgress: [],
            },
          ];

      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(incompleteLessons);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextFunction);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.skillTree[1].locked).toBe(true); // l1 not completed
    });
  });
});
