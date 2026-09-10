import { awardAchievementsForUser } from './achievement.controller';
import { prisma } from '../utils/prisma';

jest.mock('../utils/prisma', () => ({
  prisma: {
    achievement: { findMany: jest.fn() },
    userAchievement: { findMany: jest.fn(), createMany: jest.fn() },
    testResult: { aggregate: jest.fn(), count: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    userLessonProgress: { count: jest.fn(), findMany: jest.fn() },
    lesson: { count: jest.fn() },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const seedMetrics = (overrides: Record<string, unknown> = {}) => {
  const testCount = (overrides.testCount as number) ?? 0;
  (prisma.testResult.aggregate as jest.Mock).mockResolvedValue({
    _count: { _all: testCount },
    _max: { wpm: (overrides.maxWpm as number) ?? 0 },
  });
  (prisma.testResult.count as jest.Mock).mockResolvedValue((overrides.highAccuracyCount as number) ?? 0);
  (prisma.testResult.findFirst as jest.Mock).mockResolvedValue(
    (overrides.hasPerfectAccuracy as boolean) ? { id: 'p1' } : null
  );
  (prisma.userLessonProgress.count as jest.Mock).mockResolvedValue(
    (overrides.completedLessonsCount as number) ?? 0
  );
  (prisma.lesson.count as jest.Mock).mockResolvedValue((overrides.totalLessonsCount as number) ?? 10);
  (prisma.testResult.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.userLessonProgress.findMany as jest.Mock).mockResolvedValue([]);
};

describe('AchievementController - awardAchievementsForUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('unlocks newly earned achievement and persists via createMany', async () => {
    seedMetrics({ testCount: 1 });
    (prisma.achievement.findMany as jest.Mock).mockResolvedValue([
      { id: 'a1', title: 'First Steps', description: 'd', icon: 'target', points: 10, requirement: JSON.stringify({ type: 'firstSteps' }) },
    ]);
    (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userAchievement.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    const unlocked = await awardAchievementsForUser('user-123');

    expect(unlocked).toHaveLength(1);
    expect(unlocked[0]).toMatchObject({ id: 'a1' });
    expect(prisma.userAchievement.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-123', achievementId: 'a1' }],
      skipDuplicates: true,
    });
  });

  it('skips already-unlocked achievements (returns empty, no write)', async () => {
    seedMetrics({ testCount: 50 });
    (prisma.achievement.findMany as jest.Mock).mockResolvedValue([
      { id: 'a1', title: 'T', description: 'd', icon: 'i', points: 10, requirement: JSON.stringify({ type: 'firstSteps' }) },
    ]);
    (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([{ achievementId: 'a1' }]);

    const unlocked = await awardAchievementsForUser('user-123');

    expect(unlocked).toHaveLength(0);
    expect(prisma.userAchievement.createMany).not.toHaveBeenCalled();
  });

  it('returns empty when requirements not met', async () => {
    seedMetrics({ testCount: 0 });
    (prisma.achievement.findMany as jest.Mock).mockResolvedValue([
      { id: 'a1', title: 'T', description: 'd', icon: 'i', points: 10, requirement: JSON.stringify({ type: 'firstSteps' }) },
    ]);
    (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([]);

    const unlocked = await awardAchievementsForUser('user-123');

    expect(unlocked).toEqual([]);
    expect(prisma.userAchievement.createMany).not.toHaveBeenCalled();
  });

  it('ignores unknown checker types and malformed JSON without throwing', async () => {
    seedMetrics({ testCount: 100 });
    (prisma.achievement.findMany as jest.Mock).mockResolvedValue([
      { id: 'bad1', title: 'X', description: 'd', icon: 'i', points: 1, requirement: 'not-json' },
      { id: 'bad2', title: 'Y', description: 'd', icon: 'i', points: 1, requirement: JSON.stringify({ type: 'nope' }) },
    ]);
    (prisma.userAchievement.findMany as jest.Mock).mockResolvedValue([]);

    const unlocked = await awardAchievementsForUser('user-123');

    expect(unlocked).toEqual([]);
    expect(prisma.userAchievement.createMany).not.toHaveBeenCalled();
  });
});
