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

describe('LessonController - getLearningStats', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextMock: jest.Mock;

  beforeEach(() => {
    nextMock = jest.fn();
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      user: { userId: 'user-123' },
    };
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockRequest.user = undefined;

    await getLearningStats(mockRequest, mockResponse, nextMock);

    expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should successfully fetch and format learning statistics', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(5);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: 5 },
      _avg: { bestWpm: 50, bestAccuracy: 92.5 },
      _count: { _all: 2 },
    });

    await getLearningStats(mockRequest, mockResponse, nextMock);

    expect(prisma.lesson.count).toHaveBeenCalled();
    expect(prisma.userLessonProgress.count).toHaveBeenCalledWith({
      where: { userId: 'user-123', completed: true },
    });
    expect(prisma.userLessonProgress.aggregate).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      _sum: { stars: true },
      _avg: { bestWpm: true, bestAccuracy: true },
      _count: { _all: true },
    });

    expect(mockResponse.json).toHaveBeenCalledWith({
      stats: {
        totalLessons: 10,
        completedLessons: 5,
        completionPercentage: 50,
        totalStars: 5,
        maxStars: 30,
        averageWpm: 50,
        averageAccuracy: 92.5,
      },
    });
  });

  it('should handle zero lessons or progress', async () => {
    (prisma.lesson.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
    (prisma.userLessonProgress.aggregate as jest.Mock).mockResolvedValue({
      _sum: { stars: null },
      _avg: { bestWpm: null, bestAccuracy: null },
      _count: { _all: 0 },
    });

    await getLearningStats(mockRequest, mockResponse, nextMock);

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
