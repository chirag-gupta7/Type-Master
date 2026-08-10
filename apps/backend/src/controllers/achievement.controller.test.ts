import {
  getAllAchievements,
  checkAndAwardAchievements,
  getAchievementProgress,
  getAchievementStats,
} from './achievement.controller';
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
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AchievementController', () => {
  let mockRequest: any;
  let mockResponse: any;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      userId: 'user-123',
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
    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;

      await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should successfully check and award new achievements using bulk metrics', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          title: 'Speed Demon',
          description: 'Reach 50 WPM',
          icon: 'zap',
          requirement: JSON.stringify({ type: 'speedDemon' }),
          points: 25,
        },
        {
          id: 'ach-2',
          title: 'First Steps',
          description: 'Complete first test',
          icon: 'target',
          requirement: JSON.stringify({ type: 'firstSteps' }),
          points: 10,
        },
      ];
      (prisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);

      (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([
        { achievementId: 'ach-2' },
      ]);

      (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
        _max: { wpm: 55, accuracy: 98 },
        _count: { _all: 5 },
      });
      (prisma.testResult.count as jest.Mock).mockResolvedValue(2);
      (prisma.testResult.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(3);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(100);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([{ createdAt: new Date() }]);

      (prisma.userAchievement.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

      expect(prisma.achievement.findMany).toHaveBeenCalled();
      expect(prisma.testResult.aggregate).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        _max: { wpm: true },
        _count: { _all: true },
      });

      expect(prisma.userAchievement.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'user-123',
            achievementId: 'ach-1',
          }),
        ],
        skipDuplicates: true,
      });

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          newlyUnlocked: [
            expect.objectContaining({
              id: 'ach-1',
              title: 'Speed Demon',
            }),
          ],
          totalChecked: 2,
        })
      );
    });

    it('should handle errors during check', async () => {
      (prisma.achievement.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to check achievements' });
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

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: expect.objectContaining({
            dedicated: 50,
          }),
          stats: expect.objectContaining({
            testCount: 5,
          }),
        })
      );
    });
  });

  describe('getAchievementStats', () => {
    it('should return 401 if userId is missing', async () => {
      mockRequest.userId = undefined;

      await getAchievementStats(mockRequest as any, mockResponse as any);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should correctly calculate user achievement statistics with 1 in-memory list query', async () => {
      (prisma.achievement.aggregate as jest.Mock).mockResolvedValue({
        _count: { _all: 10 },
        _sum: { points: 150 },
      });

      const unlockedAtDate = new Date('2026-08-01T12:00:00Z');
      (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'ua-1',
          userId: 'user-123',
          achievementId: 'ach-1',
          unlockedAt: unlockedAtDate,
          achievement: {
            id: 'ach-1',
            title: 'Speed Demon',
            description: 'Reach 50 WPM',
            icon: 'zap',
            points: 25,
          },
        },
        {
          id: 'ua-2',
          userId: 'user-123',
          achievementId: 'ach-2',
          unlockedAt: unlockedAtDate,
          achievement: {
            id: 'ach-2',
            title: 'First Steps',
            description: 'Complete first test',
            icon: 'target',
            points: 10,
          },
        },
      ]);

      await getAchievementStats(mockRequest, mockResponse);

      expect(prisma.achievement.aggregate).toHaveBeenCalled();
      expect(prisma.userAchievement.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          achievement: true,
        },
        orderBy: { unlockedAt: 'desc' },
      });

      expect(jsonMock).toHaveBeenCalledWith({
        stats: {
          totalAchievements: 10,
          unlockedCount: 2,
          lockedCount: 8,
          completionPercentage: 20,
          totalPoints: 150,
          earnedPoints: 35,
          pointsPercentage: (35 / 150) * 100,
        },
        recentUnlocks: [
          {
            id: 'ach-1',
            title: 'Speed Demon',
            description: 'Reach 50 WPM',
            icon: 'zap',
            points: 25,
            unlockedAt: unlockedAtDate.toISOString(),
          },
          {
            id: 'ach-2',
            title: 'First Steps',
            description: 'Complete first test',
            icon: 'target',
            points: 10,
            unlockedAt: unlockedAtDate.toISOString(),
          },
        ],
      });
    });

    it('should handle database errors when retrieving stats', async () => {
      (prisma.achievement.aggregate as jest.Mock).mockRejectedValue(new Error('Aggregate error'));

      await getAchievementStats(mockRequest, mockResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch achievement statistics' });
    });
  });
});
