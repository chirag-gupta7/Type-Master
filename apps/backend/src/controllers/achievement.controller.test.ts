import { checkAndAwardAchievements } from './achievement.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    achievement: {
      findMany: jest.fn(),
    },
    userAchievement: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    testResult: {
      aggregate: jest.fn(),
      count: jest.fn(),
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

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AchievementController - checkAndAwardAchievements', () => {
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

  it('should return 401 if userId is missing', async () => {
    mockRequest.userId = undefined;

    await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should successfully check and award new achievements using bulk metrics', async () => {
    // 1. Mock achievements in DB
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
      }
    ];
    (prisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);

    // 2. Mock user already having 'First Steps'
    (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([
      { achievementId: 'ach-2' }
    ]);

    // 3. Mock metrics fetching
    (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
      _max: { wpm: 55, accuracy: 98 },
      _count: { _all: 5 },
    });
    (prisma.testResult.count as jest.Mock).mockResolvedValue(2); // highAccuracyTestCount
    (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(3);
    (prisma.lesson.count as jest.Mock).mockResolvedValue(100);
    (prisma.testResult.findMany as jest.Mock).mockResolvedValue([
      { createdAt: new Date() }
    ]);

    // 4. Mock achievement creation
    (prisma.userAchievement.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

    // Verify calls
    expect(prisma.achievement.findMany).toHaveBeenCalled();
    expect(prisma.testResult.aggregate).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      _max: { wpm: true, accuracy: true },
      _count: { _all: true },
    });

    // Awarding ach-1 via createMany
    expect(prisma.userAchievement.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'user-123',
          achievementId: 'ach-1',
        })
      ],
      skipDuplicates: true,
    });

    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      newlyUnlocked: [
        expect.objectContaining({
          id: 'ach-1',
          title: 'Speed Demon',
        })
      ],
      totalChecked: 2,
    }));
  });

  it('should handle errors during check', async () => {
    (prisma.achievement.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await checkAndAwardAchievements(mockRequest as any, mockResponse as any);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to check achievements' });
  });
});
