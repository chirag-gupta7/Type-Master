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

describe('LessonController - getLearningStats', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let nextMock: NextFunction;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-1', email: 'test@example.com' },
    };
    nextMock = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;
    await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);
    expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should return aggregated learning statistics', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([
      { completed: true, stars: 3, bestWpm: 60, bestAccuracy: 98 },
      { completed: true, stars: 2, bestWpm: 40, bestAccuracy: 95 },
      { completed: true, stars: 0, bestWpm: 0, bestAccuracy: 0 },
      { completed: true, stars: 0, bestWpm: 0, bestAccuracy: 0 },
      { completed: true, stars: 0, bestWpm: 0, bestAccuracy: 0 },
    ]);

    await getLearningStats(mockRequest as Request, mockResponse as Response, nextMock);

    expect(jsonMock).toHaveBeenCalledWith({
      stats: {
        totalLessons: 10,
        completedLessons: 5,
        completionPercentage: 50,
        totalStars: 5,
        maxStars: 30,
        averageWpm: 20, // (60+40+0+0+0)/5
        averageAccuracy: 38.6, // (98+95+0+0+0)/5
      },
    });
  });
});

describe('LessonController - getProgressVisualization', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let nextMock: NextFunction;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockRequest = {
      user: { userId: 'user-1', email: 'test@example.com' },
    };
    nextMock = jest.fn();
    jest.clearAllMocks();
  });

  it('should return progress visualization data', async () => {
    const mockDate = new Date();
    const mockDateStr = mockDate.toISOString().split('T')[0];
    const mockLessons = [
      {
        id: 'l1',
        level: 1,
        order: 1,
        title: 'L1',
        difficulty: 'BEGINNER',
        targetWpm: 20,
        section: 1,
        userProgress: [{ completed: true, stars: 3, bestWpm: 30, bestAccuracy: 99, attempts: 1, lastAttempt: new Date(mockDate) }],
      },
      {
        id: 'l2',
        level: 1,
        order: 2,
        title: 'L2',
        difficulty: 'BEGINNER',
        targetWpm: 25,
        section: 1,
        userProgress: [],
      },
    ];

    (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([
      { createdAt: mockDate },
    ]);

    await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      completionByLevel: expect.arrayContaining([
        expect.objectContaining({
          level: '1',
          percentage: 50,
          completed: 1,
          total: 2,
        }),
      ]),
      wpmByLesson: expect.arrayContaining([
        expect.objectContaining({
          lessonId: 'l1',
          data: [{ date: mockDateStr, wpm: 30, accuracy: 99 }],
        }),
      ]),
      practiceFrequency: expect.arrayContaining([
        { date: mockDateStr, count: 2 }, // 1 from testActivity + 1 from lesson progress
      ]),
      skillTree: expect.arrayContaining([
        expect.objectContaining({ id: 'l1', completed: true, locked: false }),
        expect.objectContaining({ id: 'l2', completed: false, locked: false, prerequisites: ['l1'] }),
      ]),
    }));
  });

  it('should handle skill tree dependencies across levels', async () => {
     const mockLessons = [
      { id: 'l1.1', level: 1, order: 1, section: 1, userProgress: [{ completed: true }] },
      { id: 'l1.2', level: 1, order: 2, section: 1, userProgress: [{ completed: true }] },
      { id: 'l1.3', level: 1, order: 3, section: 1, userProgress: [{ completed: true }] },
      { id: 'l2.1', level: 2, order: 1, section: 2, userProgress: [] },
    ];
    (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
    (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

    const response = jsonMock.mock.calls[0][0];
    const l2_1 = response.skillTree.find((l: any) => l.id === 'l2.1');
    expect(l2_1.prerequisites).toEqual(['l1.1', 'l1.2', 'l1.3']);
    expect(l2_1.locked).toBe(false); // Because all pre-reqs are completed
  });

  it('should handle locked lessons in skill tree', async () => {
     const mockLessons = [
      { id: 'l1.1', level: 1, order: 1, section: 1, userProgress: [{ completed: false }] },
      { id: 'l1.2', level: 1, order: 2, section: 1, userProgress: [] },
    ];
    (prisma.lesson.findMany as jest.Mock).mockResolvedValue(mockLessons);
    (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    await getProgressVisualization(mockRequest as Request, mockResponse as Response, nextMock);

    const response = jsonMock.mock.calls[0][0];
    const l1_2 = response.skillTree.find((l: any) => l.id === 'l1.2');
    expect(l1_2.locked).toBe(true);
  });
});
