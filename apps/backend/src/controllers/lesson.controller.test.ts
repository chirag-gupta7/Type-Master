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
      findMany: jest.fn(),
    },
    testResult: {
      findMany: jest.fn(),
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

describe('LessonController - Optimized Methods', () => {
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
    };
    jest.clearAllMocks();
  });

  describe('getLearningStats', () => {
    it('should return correct stats when user has no progress', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);

      await getLearningStats(mockRequest as any, mockResponse as any, nextMock);

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

    it('should correctly aggregate stats in-memory', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(5);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([
        { completed: true, stars: 3, bestWpm: 60, bestAccuracy: 98 },
        { completed: false, stars: 0, bestWpm: 20, bestAccuracy: 80 },
      ]);

      await getLearningStats(mockRequest as any, mockResponse as any, nextMock);

      expect(jsonMock).toHaveBeenCalledWith({
        stats: {
          totalLessons: 5,
          completedLessons: 1,
          completionPercentage: 20,
          totalStars: 3,
          maxStars: 15,
          averageWpm: 40, // (60 + 20) / 2
          averageAccuracy: 89, // (98 + 80) / 2
        },
      });
    });
  });

  describe('getProgressVisualization', () => {
    it('should construct correct visualization data', async () => {
      const now = new Date();
      const lessons = [
        {
          id: 'l1',
          level: 1,
          order: 1,
          title: 'Lesson 1',
          difficulty: 'BEGINNER',
          targetWpm: 20,
          userProgress: [{ completed: true, stars: 3, bestWpm: 30, bestAccuracy: 100, attempts: 1, lastAttempt: now }],
        },
        {
          id: 'l2',
          level: 1,
          order: 2,
          title: 'Lesson 2',
          difficulty: 'BEGINNER',
          targetWpm: 20,
          userProgress: [{ completed: false, stars: 0, bestWpm: 10, bestAccuracy: 70, attempts: 2, lastAttempt: now }],
        },
        {
          id: 'l3',
          level: 2,
          order: 1,
          title: 'Lesson 3',
          difficulty: 'INTERMEDIATE',
          targetWpm: 40,
          userProgress: [],
        }
      ];

      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(lessons);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([
        { createdAt: now }
      ]);

      await getProgressVisualization(mockRequest as any, mockResponse as any, nextMock);

      const response = jsonMock.mock.calls[0][0];

      // Verify level stats
      expect(response.completionByLevel).toContainEqual(expect.objectContaining({
        level: '1',
        percentage: 50,
        completed: 1,
        total: 2,
      }));

      // Verify skill tree
      expect(response.skillTree).toHaveLength(3);
      expect(response.skillTree[0].id).toBe('l1');
      expect(response.skillTree[0].locked).toBe(false);

      expect(response.skillTree[1].id).toBe('l2');
      expect(response.skillTree[1].prerequisites).toEqual(['l1']);
      expect(response.skillTree[1].locked).toBe(false); // l1 is completed

      expect(response.skillTree[2].id).toBe('l3');
      expect(response.skillTree[2].locked).toBe(true); // l1, l2 or previous level last 3 not all completed (none of level 1 last 3 are completed except l1)

      // Verify activity
      expect(response.practiceFrequency).toHaveLength(1);
      expect(response.practiceFrequency[0].count).toBe(3); // 2 lessons + 1 test
    });

    it('should handle non-sequential order correctly in skill tree', async () => {
       const lessons = [
        {
          id: 'l1',
          level: 1,
          order: 10,
          title: 'Lesson 1',
          userProgress: [{ completed: true }],
        },
        {
          id: 'l2',
          level: 1,
          order: 20,
          title: 'Lesson 2',
          userProgress: [],
        }
      ];
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(lessons);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await getProgressVisualization(mockRequest as any, mockResponse as any, nextMock);

      const response = jsonMock.mock.calls[0][0];
      expect(response.skillTree[1].prerequisites).toEqual(['l1']);
      expect(response.skillTree[1].locked).toBe(false);
    });
  });
});
