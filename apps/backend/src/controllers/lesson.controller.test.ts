import { Request, Response } from 'express';
import './lesson.controller'; // Ensure Request augmentation is loaded
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
      findMany: jest.fn(),
      aggregate: jest.fn(),
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

describe('LessonController - getLearningStats', () => {
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
      user: { userId: 'user-123' },
    };
    jest.clearAllMocks();
  });

  it('should calculate learning stats correctly', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(5);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: 5 },
      _avg: { bestWpm: 45, bestAccuracy: 92.5 },
      _count: { _all: 2 },
    });

    await getLearningStats(mockRequest as any, mockResponse as any, nextMock);

    expect(prisma.userLessonProgress.aggregate).toHaveBeenCalled();
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
