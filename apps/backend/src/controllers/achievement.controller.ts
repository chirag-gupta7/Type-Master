/**
 * Achievement Controller
 * Handles achievement-related operations
 */

import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { THRESHOLDS } from '../config/achievements';

interface AuthRequest extends Request {
  userId?: string;
}

/**
 * User metrics for achievement calculation
 */
interface UserMetrics {
  testCount: number;
  maxWpm: number;
  highAccuracyCount: number;
  hasPerfectAccuracy: boolean;
  completedLessonsCount: number;
  totalLessonsCount: number;
  uniqueDaysThisWeek: number;
}

// THRESHOLDS now sourced from shared single source
export { THRESHOLDS };

/**
 * Fetch all required user metrics in parallel for performance
 * Streak merges TestResult (createdAt) + UserLessonProgress (lastAttempt) into single UTC YYYY-MM-DD Set
 */
const fetchUserMetrics = async (userId: string): Promise<UserMetrics> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    testStats,
    highAccuracyCount,
    perfectAccuracy,
    completedLessonsCount,
    totalLessonsCount,
    recentTests,
    recentLessonAttempts,
  ] = await Promise.all([
    prisma.testResult.aggregate({
      where: { userId },
      _count: { _all: true },
      _max: { wpm: true },
    }),
    prisma.testResult.count({
      where: { userId, accuracy: { gte: 95 } },
    }),
    prisma.testResult.findFirst({
      where: { userId, accuracy: 100 },
      select: { id: true },
    }),
    prisma.userLessonProgress.count({
      where: { userId, completed: true },
    }),
    prisma.lesson.count(),
    prisma.testResult.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    }),
    prisma.userLessonProgress.findMany({
      where: {
        userId,
        lastAttempt: { gte: sevenDaysAgo },
      },
      select: { lastAttempt: true },
    }),
  ]);

  const uniqueDays = new Set<string>([
    ...recentTests.map((r) => r.createdAt.toISOString().split('T')[0]),
    ...recentLessonAttempts.map((r) => r.lastAttempt.toISOString().split('T')[0]),
  ]);

  return {
    testCount: testStats._count._all,
    maxWpm: testStats._max.wpm || 0,
    highAccuracyCount,
    hasPerfectAccuracy: !!perfectAccuracy,
    completedLessonsCount,
    totalLessonsCount,
    uniqueDaysThisWeek: uniqueDays.size,
  };
};

/**
 * Achievement requirement checkers
 * Optimized to use pre-fetched metrics instead of database calls
 * Thresholds sourced from THRESHOLDS to prevent drift with getAchievementProgress
 */
const checkAchievementRequirements = {
  // Speed achievements
  speedDemon: (metrics: UserMetrics): boolean => metrics.maxWpm >= THRESHOLDS.speedDemon,
  lightningFast: (metrics: UserMetrics): boolean => metrics.maxWpm >= THRESHOLDS.lightningFast,
  typingMaster: (metrics: UserMetrics): boolean => metrics.maxWpm >= THRESHOLDS.typingMaster,
  velocity120: (metrics: UserMetrics): boolean => metrics.maxWpm >= THRESHOLDS.velocity120,

  // Accuracy achievements
  perfectionist: (metrics: UserMetrics): boolean => metrics.hasPerfectAccuracy,
  sharpshooter: (metrics: UserMetrics): boolean => metrics.highAccuracyCount >= THRESHOLDS.sharpshooter,
  accuracyAce: (metrics: UserMetrics): boolean => metrics.highAccuracyCount >= THRESHOLDS.accuracyAce,

  // Consistency achievements
  earlyBird: (metrics: UserMetrics): boolean => metrics.testCount >= THRESHOLDS.earlyBird,
  dedicated: (metrics: UserMetrics): boolean => metrics.testCount >= THRESHOLDS.dedicated,
  centuryClub: (metrics: UserMetrics): boolean => metrics.testCount >= THRESHOLDS.centuryClub,
  committed: (metrics: UserMetrics): boolean => metrics.testCount >= THRESHOLDS.committed,
  unstoppable: (metrics: UserMetrics): boolean => metrics.testCount >= THRESHOLDS.unstoppable,

  // Learning achievements
  student: (metrics: UserMetrics): boolean => metrics.completedLessonsCount >= THRESHOLDS.student,
  scholar: (metrics: UserMetrics): boolean => metrics.completedLessonsCount >= THRESHOLDS.scholar,
  codeCrafter: (metrics: UserMetrics): boolean => metrics.completedLessonsCount >= THRESHOLDS.codeCrafter,
  graduateTypist: (metrics: UserMetrics): boolean =>
    metrics.completedLessonsCount >= metrics.totalLessonsCount && metrics.totalLessonsCount > 0,

  // Streak achievements
  hotStreak: (metrics: UserMetrics): boolean => metrics.uniqueDaysThisWeek >= THRESHOLDS.hotStreak,
  weekWarrior: (metrics: UserMetrics): boolean => metrics.uniqueDaysThisWeek >= THRESHOLDS.weekWarrior,

  // First achievements
  firstSteps: (metrics: UserMetrics): boolean => metrics.testCount >= THRESHOLDS.firstSteps,
  firstLesson: (metrics: UserMetrics): boolean => metrics.completedLessonsCount >= THRESHOLDS.firstLesson,
};

/**
 * Get all achievements with user's unlock status
 * GET /api/v1/achievements
 */
export const getAllAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Optimization: Fetch achievements and user's unlocked status in parallel
    const [achievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany({
        orderBy: { points: 'asc' },
      }),
      userId
        ? prisma.userAchievement.findMany({
            where: { userId },
            select: {
              achievementId: true,
              unlockedAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const userAchievementMap = new Map<string, Date>(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt as Date] as const)
    );

    // Combine data
    const achievementsWithStatus = achievements.map((achievement) => {
      const unlockedAt = userAchievementMap.get(achievement.id);
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        requirement: achievement.requirement,
        unlocked: !!unlockedAt,
        unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
      };
    });

    return res.json({
      achievements: achievementsWithStatus,
      totalAchievements: achievements.length,
      unlockedCount: userAchievements.length,
      totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
      earnedPoints: achievements
        .filter((a) => userAchievementMap.has(a.id))
        .reduce((sum, a) => sum + a.points, 0),
    });
  } catch (error) {
    logger.error('Get all achievements error:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

/**
 * Internal helper: award achievements for a user without HTTP context
 * Reusable by test/lesson controllers for auto-award on save
 * Idempotent via skipDuplicates
 */
export const awardAchievementsForUser = async (userId: string) => {
  const [achievements, userAchievements, metrics] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
    fetchUserMetrics(userId),
  ]);

  const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const toUnlock: typeof achievements = [];

  for (const achievement of achievements) {
    if (unlockedAchievementIds.has(achievement.id)) continue;
    try {
      const requirement = JSON.parse(achievement.requirement);
      const checkerFn =
        checkAchievementRequirements[requirement?.type as keyof typeof checkAchievementRequirements];
      if (!checkerFn) {
        logger.warn(`No checker defined for achievement ${achievement.id} (type: ${requirement?.type})`);
        continue;
      }
      if (checkerFn(metrics)) toUnlock.push(achievement);
    } catch (error) {
      logger.error(`Error checking achievement ${achievement.id}:`, error);
    }
  }

  if (toUnlock.length > 0) {
    await prisma.userAchievement.createMany({
      data: toUnlock.map((a) => ({ userId, achievementId: a.id })),
      skipDuplicates: true,
    });
  }

  const now = new Date().toISOString();
  return toUnlock.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    points: a.points,
    unlockedAt: now,
  }));
};

/**
 * Check and award new achievements for a user
 * POST /api/v1/achievements/check
 * Kept as thin wrapper for backward compatibility
 */
export const checkAndAwardAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const achievements = await prisma.achievement.findMany();
    const newlyUnlocked = await awardAchievementsForUser(userId);

    return res.json({
      message: `Checked achievements, ${newlyUnlocked.length} newly unlocked`,
      newlyUnlocked,
      totalChecked: achievements.length,
    });
  } catch (error) {
    logger.error('Check achievements error:', error);
    return res.status(500).json({ error: 'Failed to check achievements' });
  }
};

/**
 * Get user's achievement statistics
 * GET /api/v1/achievements/stats
 */
export const getAchievementStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Optimization: Parallelize aggregate and list queries, and eliminate the redundant
    // userAchievement findMany query by deriving the recent unlocks and stats in-memory
    // from a single sorted userAchievement query. This reduces DB roundtrips from 3 to 2.
    const [achievementAggregates, userAchievements] = await Promise.all([
      prisma.achievement.aggregate({
        _count: { _all: true },
        _sum: { points: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { unlockedAt: 'desc' },
      }),
    ]);

    const totalAchievements = achievementAggregates._count._all;
    const totalPoints = achievementAggregates._sum.points || 0;
    const unlockedCount = userAchievements.length;
    const earnedPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

    // Get the top 5 most recent unlocks in-memory from the already fetched and sorted list
    const recentUnlocks = userAchievements.slice(0, 5);

    return res.json({
      stats: {
        totalAchievements,
        unlockedCount,
        lockedCount: totalAchievements - unlockedCount,
        completionPercentage: totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0,
        totalPoints,
        earnedPoints,
        pointsPercentage: totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0,
      },
      recentUnlocks: recentUnlocks.map((ua) => ({
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        points: ua.achievement.points,
        unlockedAt: ua.unlockedAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Get achievement stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch achievement statistics' });
  }
};

/**
 * Get achievement progress for multi-step achievements
 * GET /api/v1/achievements/progress
 */
export const getAchievementProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const metrics = await fetchUserMetrics(userId);

    const progress = {
      // First achievements
      firstSteps: Math.min((metrics.testCount / THRESHOLDS.firstSteps) * 100, 100),
      firstLesson: Math.min((metrics.completedLessonsCount / THRESHOLDS.firstLesson) * 100, 100),
      perfectionist: metrics.hasPerfectAccuracy ? 100 : 0,

      // Consistency achievements
      earlyBird: Math.min((metrics.testCount / THRESHOLDS.earlyBird) * 100, 100),
      dedicated: Math.min((metrics.testCount / THRESHOLDS.dedicated) * 100, 100),
      centuryClub: Math.min((metrics.testCount / THRESHOLDS.centuryClub) * 100, 100),
      committed: Math.min((metrics.testCount / THRESHOLDS.committed) * 100, 100),
      unstoppable: Math.min((metrics.testCount / THRESHOLDS.unstoppable) * 100, 100),

      // Speed achievements
      speedDemon: Math.min((metrics.maxWpm / THRESHOLDS.speedDemon) * 100, 100),
      lightningFast: Math.min((metrics.maxWpm / THRESHOLDS.lightningFast) * 100, 100),
      typingMaster: Math.min((metrics.maxWpm / THRESHOLDS.typingMaster) * 100, 100),
      velocity120: Math.min((metrics.maxWpm / THRESHOLDS.velocity120) * 100, 100),

      // Accuracy achievements
      sharpshooter: Math.min((metrics.highAccuracyCount / THRESHOLDS.sharpshooter) * 100, 100),
      accuracyAce: Math.min((metrics.highAccuracyCount / THRESHOLDS.accuracyAce) * 100, 100),

      // Learning achievements
      student: Math.min((metrics.completedLessonsCount / THRESHOLDS.student) * 100, 100),
      scholar: Math.min((metrics.completedLessonsCount / THRESHOLDS.scholar) * 100, 100),
      codeCrafter: Math.min((metrics.completedLessonsCount / THRESHOLDS.codeCrafter) * 100, 100),
      graduateTypist:
        metrics.totalLessonsCount > 0
          ? Math.min((metrics.completedLessonsCount / metrics.totalLessonsCount) * 100, 100)
          : 0,

      // Streak achievements
      hotStreak: Math.min((metrics.uniqueDaysThisWeek / THRESHOLDS.hotStreak) * 100, 100),
      weekWarrior: Math.min((metrics.uniqueDaysThisWeek / THRESHOLDS.weekWarrior) * 100, 100),
    };

    return res.json({
      progress,
      stats: {
        testCount: metrics.testCount,
        highAccuracyTests: metrics.highAccuracyCount,
        completedLessons: metrics.completedLessonsCount,
        totalLessons: metrics.totalLessonsCount,
        bestWpm: metrics.maxWpm,
        uniqueDaysThisWeek: metrics.uniqueDaysThisWeek,
      },
    });
  } catch (error) {
    logger.error('Get achievement progress error:', error);
    return res.status(500).json({ error: 'Failed to fetch achievement progress' });
  }
};

export default {
  getAllAchievements,
  checkAndAwardAchievements,
  getAchievementStats,
  getAchievementProgress,
};
