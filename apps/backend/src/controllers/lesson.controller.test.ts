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

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LessonController - Learning Stats & Visualization', () => {
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
    it('should calculate stats correctly with progress data', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(4);
      (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
        _sum: { stars: 6 },
        _avg: { bestWpm: 40, bestAccuracy: 94.33333333333333 }
      });

      await getLearningStats(mockRequest as any, mockResponse as any, nextMock);

      expect(jsonMock).toHaveBeenCalledWith({
        stats: {
          totalLessons: 10,
          completedLessons: 4,
          completionPercentage: 40,
          totalStars: 6,
          maxStars: 30,
          averageWpm: 40,
          averageAccuracy: 94.3,
        },
      });
    });

    it('should return zeros when no progress exists', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
      (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
        _sum: { stars: null },
        _avg: { bestWpm: null, bestAccuracy: null }
      });

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
  });

  describe('getProgressVisualization', () => {
    it('should return correctly structured visualization data', async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 80); // within 90 days

      const mockLessons = [
        {
          id: 'l1', level: 1, order: 1, title: 'L1', section: 1, difficulty: 'BEGINNER', targetWpm: 20,
          userProgress: [{ completed: true, stars: 3, bestWpm: 25, bestAccuracy: 98, attempts: 1, lastAttempt: ninetyDaysAgo }]
        },
        {
          id: 'l2', level: 1, order: 2, title: 'L2', section: 1, difficulty: 'BEGINNER', targetWpm: 25,
          userProgress: [{ completed: false, stars: 0, bestWpm: 15, bestAccuracy: 80, attempts: 2, lastAttempt: ninetyDaysAgo }]
        }
      ];
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);

      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([
        { createdAt: new Date() }
      ]);

      await getProgressVisualization(mockRequest as any, mockResponse as any, nextMock);

      const response = jsonMock.mock.calls[0][0];

      expect(response.completionByLevel).toHaveLength(1);
      expect(response.completionByLevel[0]).toMatchObject({
        level: '1',
        percentage: 50,
        stars: 3
      });

      expect(response.wpmByLesson).toHaveLength(2);
      expect(response.practiceFrequency).toHaveLength(2); // 1 unique date for 2 lessons + 1 test (assuming same date for all)

      expect(response.skillTree).toHaveLength(2);
      expect(response.skillTree[0]).toMatchObject({
        id: 'l1',
        completed: true,
        locked: false
      });
      expect(response.skillTree[1]).toMatchObject({
        id: 'l2',
        completed: false,
        locked: false, // first level, order 2, l1 is completed
        prerequisites: ['l1']
      });
    });

    it('should handle skill tree locking correctly', async () => {
       const mockLessons = [
        {
          id: 'l1', level: 1, order: 1, title: 'L1', section: 1, difficulty: 'BEGINNER', targetWpm: 20,
          userProgress: [{ completed: false }]
        },
        {
          id: 'l2', level: 1, order: 2, title: 'L2', section: 1, difficulty: 'BEGINNER', targetWpm: 25,
          userProgress: []
        }
      ];
      (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await getProgressVisualization(mockRequest as any, mockResponse as any, nextMock);

      const response = jsonMock.mock.calls[0][0];
      expect(response.skillTree[1].locked).toBe(true);
    });
  });
});
