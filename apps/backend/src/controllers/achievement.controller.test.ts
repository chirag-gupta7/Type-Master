import { getAllAchievements, checkAndAwardAchievements, getAchievementProgress } from './achievement.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    achievement: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    userAchievement: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    testResult: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    userLessonProgress: {
      count: jest.fn(),
    },
    lesson: {
      count: jest.fn(),
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

describe('AchievementController', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = { userId: 'user-1' };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getAllAchievements', () => {
    it('should return all achievements with status', async () => {
      (prisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { id: '1', title: 'Speed Demon', points: 10, requirement: '{"type":"speedDemon"}' },
      ]);
      (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([
        { achievementId: '1', unlockedAt: new Date() },
      ]);

      await getAllAchievements(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalled();
      const responseData = mockResponse.json.mock.calls[0][0];
      expect(responseData.achievements[0].unlocked).toBe(true);
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award new achievements', async () => {
      (prisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { id: 'a1', title: 'Speed Demon', requirement: '{"type":"speedDemon"}' },
      ]);
      (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([]);

      // Mock metrics for speedDemon (maxWpm >= 50)
      (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
        _count: { _all: 1 },
        _max: { wpm: 60 },
      });
      (prisma.testResult.count as jest.Mock).mockResolvedValue(0);
      (prisma.testResult.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(0);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      await checkAndAwardAchievements(mockRequest, mockResponse);

      expect(prisma.userAchievement.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-1', achievementId: 'a1' }],
        skipDuplicates: true,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        newlyUnlocked: expect.arrayContaining([expect.objectContaining({ id: 'a1' })]),
      }));
    });
  });

  describe('getAchievementProgress', () => {
    it('should return progress metrics', async () => {
        (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
            _count: { _all: 5 },
            _max: { wpm: 40 },
          });
          (prisma.testResult.count as jest.Mock).mockResolvedValue(2);
          (prisma.testResult.findFirst as jest.Mock).mockResolvedValue(null);
          (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(3);
          (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
          (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

          await getAchievementProgress(mockRequest, mockResponse);

          expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            progress: expect.objectContaining({
                dedicated: 50, // 5 / 10 * 100
            }),
            stats: expect.objectContaining({
                testCount: 5,
            })
          }));
    });
  });
});
