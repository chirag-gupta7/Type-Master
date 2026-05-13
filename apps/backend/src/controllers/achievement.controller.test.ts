import { Request, Response } from 'express';
import { getAllAchievements, checkAndAwardAchievements, getAchievementStats, getAchievementProgress } from './achievement.controller';
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
    },
    testResult: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    userLessonProgress: {
      count: jest.fn(),
    },
    lesson: {
      count: jest.fn(),
    },
  },
}));

describe('AchievementController', () => {
  let mockRequest: Partial<Request & { userId?: string }>;
  let mockResponse: Partial<Response>;
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
    it('should return all achievements with status for authenticated user', async () => {
      const mockAchievements = [
        { id: '1', title: 'A1', description: 'D1', icon: 'i1', points: 10, requirement: '{}' },
        { id: '2', title: 'A2', description: 'D2', icon: 'i2', points: 20, requirement: '{}' },
      ];
      const mockUserAchievements = [
        { achievementId: '1', unlockedAt: new Date('2023-01-01') },
      ];

      (prisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);
      (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue(mockUserAchievements);

      await getAllAchievements(mockRequest as any, mockResponse as any);

      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        totalAchievements: 2,
        unlockedCount: 1,
        earnedPoints: 10,
        totalPoints: 30,
      }));
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award new achievements if requirements are met', async () => {
      const mockAchievements = [
        { id: '1', title: 'Speed Demon', description: 'D1', icon: 'i1', points: 25, requirement: JSON.stringify({ type: 'speedDemon' }) },
      ];
      const mockUserAchievements: any[] = [];

      (prisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);
      (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue(mockUserAchievements);

      // Mocks for fetchUserStats
      (prisma.testResult.count as jest.Mock).mockResolvedValue(1);
      (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({ _max: { wpm: 60, accuracy: 100 } });
      (prisma.testResult.count as jest.Mock).mockResolvedValue(1); // highAccuracyTests
      (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(1);
      (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
      (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

      (prisma.userAchievement.create as jest.Mock).mockResolvedValue({ unlockedAt: new Date() });

      await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

      expect(prisma.userAchievement.create).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        newlyUnlocked: expect.arrayContaining([expect.objectContaining({ title: 'Speed Demon' })]),
      }));
    });

    it('should not award if already unlocked', async () => {
        const mockAchievements = [
          { id: '1', title: 'Speed Demon', description: 'D1', icon: 'i1', points: 25, requirement: JSON.stringify({ type: 'speedDemon' }) },
        ];
        const mockUserAchievements = [{ achievementId: '1' }];

        (prisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);
        (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue(mockUserAchievements);

        // Mocks for fetchUserStats
        (prisma.testResult.count as jest.Mock).mockResolvedValue(1);
        (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({ _max: { wpm: 60, accuracy: 100 } });
        (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(1);
        (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
        (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

        await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

        expect(prisma.userAchievement.create).not.toHaveBeenCalled();
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
          newlyUnlocked: [],
        }));
      });
  });

  describe('getAchievementStats', () => {
    it('should return achievement statistics', async () => {
        (prisma.achievement.aggregate as jest.Mock).mockResolvedValue({ _count: { id: 10 }, _sum: { points: 100 } });
        (prisma.userAchievement.findMany as jest.Mock)
          .mockResolvedValueOnce([{ achievement: { points: 10 } }]) // first call for userAchievements
          .mockResolvedValueOnce([{ achievement: { id: '1', title: 'T', description: 'D', icon: 'I', points: 10 }, unlockedAt: new Date() }]); // second call for recentUnlocks

        await getAchievementStats(mockRequest as any, mockResponse as any);

        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            stats: expect.objectContaining({
                totalAchievements: 10,
                unlockedCount: 1,
                earnedPoints: 10,
            })
        }));
    });
  });

  describe('getAchievementProgress', () => {
    it('should return progress for various achievement categories', async () => {
        (prisma.testResult.count as jest.Mock).mockResolvedValue(5); // 5 tests
        (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({ _max: { wpm: 40, accuracy: 90 } }); // best wpm 40
        (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(2); // 2 lessons
        (prisma.lesson.count as jest.Mock).mockResolvedValue(10);
        (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

        await getAchievementProgress(mockRequest as any, mockResponse as any);

        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            progress: expect.objectContaining({
                dedicated: 50, // 5/10 * 100
                speedDemon: 80, // 40/50 * 100
                student: 40, // 2/5 * 100
            })
        }));
    });
  });
});
