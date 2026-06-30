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

describe('LessonController - Learning Statistics', () => {
  let mockRequest: Partial<Request & { user?: { userId: string } }>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let nextMock: jest.Mock;

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

  describe('getLearningStats', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);
      expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should successfully fetch learning stats', async () => {
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([
        { completed: true, stars: 3, bestWpm: 40, bestAccuracy: 95 },
        { completed: true, stars: 2, bestWpm: 30, bestAccuracy: 90 },
      ]);

      await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);

      expect(jsonMock).toHaveBeenCalledWith({
        stats: {
          totalLessons: 10,
          completedLessons: 2,
          completionPercentage: 20,
          totalStars: 5,
          maxStars: 30,
          averageWpm: 35,
          averageAccuracy: 92.5,
        },
      });
    });
  });

  describe('getProgressVisualization', () => {
    it('should successfully fetch visualization data', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          level: 1,
          order: 1,
          title: 'Lesson 1',
          difficulty: 'BEGINNER',
          targetWpm: 20,
          userProgress: [{ completed: true, stars: 3, bestWpm: 25, bestAccuracy: 98, attempts: 1, lastAttempt: new Date('2023-01-01') }],
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
      (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([
        {
          bestWpm: 25,
          bestAccuracy: 98,
          lastAttempt: new Date('2023-01-01'),
          lesson: { id: 'lesson-1', title: 'Lesson 1', level: 1 },
        },
      ]);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([
        { createdAt: new Date('2023-01-02') },
      ]);

      await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

      expect(jsonMock).toHaveBeenCalled();
      const responseData = jsonMock.mock.calls[0][0];

      expect(responseData).toHaveProperty('completionByLevel');
      expect(responseData).toHaveProperty('wpmByLesson');
      expect(responseData).toHaveProperty('practiceFrequency');
      expect(responseData).toHaveProperty('skillTree');

      // Verify skill tree structure
      expect(responseData.skillTree[0].id).toBe('lesson-1');
      expect(responseData.skillTree[0].completed).toBe(true);
      expect(responseData.skillTree[1].id).toBe('lesson-2');
      expect(responseData.skillTree[1].completed).toBe(false);
      expect(responseData.skillTree[1].locked).toBe(false); // First lesson completed, so second should be unlocked
    });
  });
});
