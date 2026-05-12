import { checkAndAwardAchievements } from './achievement.controller';
import { prisma } from '../utils/prisma';
import { Request, Response } from 'express';

jest.mock('../utils/prisma', () => ({
  prisma: {
    achievement: {
      findMany: jest.fn(),
    },
    userAchievement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    testResult: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    userLessonProgress: {
      count: jest.fn(),
    },
    lesson: {
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Achievement Controller - checkAndAwardAchievements', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { userId: 'user-1' };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should award new achievements correctly', async () => {
    const mockAchievements = [
      {
        id: 'ach-1',
        title: 'Speed Demon',
        requirement: JSON.stringify({ type: 'speedDemon' }),
        points: 25,
        icon: 'zap',
        description: 'Reach 50 WPM',
      },
      {
        id: 'ach-2',
        title: 'Student',
        requirement: JSON.stringify({ type: 'student' }),
        points: 25,
        icon: 'check',
        description: 'Complete 5 lessons',
      },
    ];

    (prisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);
    (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.testResult.count as jest.Mock).mockResolvedValue(10);
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({ _max: { wpm: 60, accuracy: 98 } });
    (prisma.testResult.count as jest.Mock).mockResolvedValue(5); // highAccuracyTests
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(10);
    (prisma.lesson.count as jest.Mock).mockResolvedValue(100);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);

    // Mock transaction behavior
    (prisma.userAchievement.create as jest.Mock).mockImplementation(({ data }) => {
        const ach = mockAchievements.find(a => a.id === data.achievementId);
        return Promise.resolve({
            achievementId: data.achievementId,
            unlockedAt: new Date(),
            achievement: ach
        });
    });

    await checkAndAwardAchievements(req as Request, res as Response);

    expect(prisma.achievement.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      newlyUnlocked: expect.arrayContaining([
        expect.objectContaining({ id: 'ach-1' }),
        expect.objectContaining({ id: 'ach-2' }),
      ]),
    }));
  });

  it('should not award already unlocked achievements', async () => {
    const mockAchievements = [
      {
        id: 'ach-1',
        title: 'Speed Demon',
        requirement: JSON.stringify({ type: 'speedDemon' }),
      },
    ];

    (prisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);
    (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([{ achievementId: 'ach-1' }]);
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({ _max: { wpm: 60, accuracy: 98 } });

    await checkAndAwardAchievements(req as Request, res as Response);

    expect(prisma.userAchievement.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      newlyUnlocked: [],
    }));
  });
});
