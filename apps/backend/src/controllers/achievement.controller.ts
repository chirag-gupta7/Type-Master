/**
 * Achievement Controller
 * Handles achievement-related operations
 */

import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

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

/**
 * Fetch all required user metrics in parallel for performance
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
  ]);

  const uniqueDays = new Set(recentTests.map((r) => r.createdAt.toISOString().split('T')[0]));

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
 */
const checkAchievementRequirements = {
  // Speed achievements
  speedDemon: (metrics: UserMetrics): boolean => metrics.maxWpm >= 50,
  lightningFast: (metrics: UserMetrics): boolean => metrics.maxWpm >= 80,
  typingMaster: (metrics: UserMetrics): boolean => metrics.maxWpm >= 100,

  // Accuracy achievements
  perfectionist: (metrics: UserMetrics): boolean => metrics.hasPerfectAccuracy,
  sharpshooter: (metrics: UserMetrics): boolean => metrics.highAccuracyCount >= 10,

  // Consistency achievements
  dedicated: (metrics: UserMetrics): boolean => metrics.testCount >= 10,
  committed: (metrics: UserMetrics): boolean => metrics.testCount >= 50,
  unstoppable: (metrics: UserMetrics): boolean => metrics.testCount >= 100,

  // Learning achievements
  student: (metrics: UserMetrics): boolean => metrics.completedLessonsCount >= 5,
  scholar: (metrics: UserMetrics): boolean => metrics.completedLessonsCount >= 20,
  graduateTypist: (metrics: UserMetrics): boolean =>
    metrics.completedLessonsCount >= metrics.totalLessonsCount && metrics.totalLessonsCount > 0,

  // Streak achievements
  weekWarrior: (metrics: UserMetrics): boolean => metrics.uniqueDaysThisWeek >= 7,

  // First achievements
  firstSteps: (metrics: UserMetrics): boolean => metrics.testCount >= 1,
  firstLesson: (metrics: UserMetrics): boolean => metrics.completedLessonsCount >= 1,
};

/**
 * Get all achievements with user's unlock status
 * GET /api/v1/achievements
 */
export const getAllAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      orderBy: { points: 'asc' },
    });

    // Get user's unlocked achievements
    const userAchievements = userId
      ? await prisma.userAchievement.findMany({
          where: { userId },
          select: {
            achievementId: true,
            unlockedAt: true,
          },
        })
      : [];

    const userAchievementMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt])
    );

    // Combine data
    const achievementsWithStatus = achievements.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      points: achievement.points,
      requirement: achievement.requirement,
      unlocked: userAchievementMap.has(achievement.id),
      unlockedAt: userAchievementMap.get(achievement.id)?.toISOString() || null,
    }));

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
 * Check and award new achievements for a user
 * POST /api/v1/achievements/check
 */
export const checkAndAwardAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parallelize initial data fetching
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

    // Check each achievement using pre-fetched metrics
    for (const achievement of achievements) {
      if (unlockedAchievementIds.has(achievement.id)) {
        continue;
      }

      try {
        const requirement = JSON.parse(achievement.requirement);
        const checkerFn =
          checkAchievementRequirements[
            requirement.type as keyof typeof checkAchievementRequirements
          ];

        if (checkerFn && checkerFn(metrics)) {
          toUnlock.push(achievement);
        }
      } catch (error) {
        logger.error(`Error checking achievement ${achievement.id}:`, error);
      }
    }

    // Batch award new achievements if any
    if (toUnlock.length > 0) {
      await prisma.userAchievement.createMany({
        data: toUnlock.map((a) => ({
          userId,
          achievementId: a.id,
        })),
        skipDuplicates: true,
      });
    }

    const now = new Date().toISOString();
    const newlyUnlocked = toUnlock.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      points: a.points,
      unlockedAt: now,
    }));

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

    // Get total achievements
    const totalAchievements = await prisma.achievement.count();
    const totalPoints = await prisma.achievement.aggregate({
      _sum: { points: true },
    });

    // Get user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: {
            points: true,
          },
        },
      },
    });

    const unlockedCount = userAchievements.length;
    const earnedPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

    // Get recent unlocks
    const recentUnlocks = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
      take: 5,
    });

    return res.json({
      stats: {
        totalAchievements,
        unlockedCount,
        lockedCount: totalAchievements - unlockedCount,
        completionPercentage: (unlockedCount / totalAchievements) * 100,
        totalPoints: totalPoints._sum.points || 0,
        earnedPoints,
        pointsPercentage: (earnedPoints / (totalPoints._sum.points || 1)) * 100,
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

    // Use optimized fetchUserMetrics helper to get all stats in parallel
    const metrics = await fetchUserMetrics(userId);

    // Calculate progress for each achievement type using pre-fetched metrics
    const progress = {
      // Consistency achievements
      dedicated: Math.min((metrics.testCount / 10) * 100, 100),
      committed: Math.min((metrics.testCount / 50) * 100, 100),
      unstoppable: Math.min((metrics.testCount / 100) * 100, 100),

      // Speed achievements
      speedDemon: Math.min((metrics.maxWpm / 50) * 100, 100),
      lightningFast: Math.min((metrics.maxWpm / 80) * 100, 100),
      typingMaster: Math.min((metrics.maxWpm / 100) * 100, 100),

      // Accuracy achievements
      sharpshooter: Math.min((metrics.highAccuracyCount / 10) * 100, 100),

      // Learning achievements
      student: Math.min((metrics.completedLessonsCount / 5) * 100, 100),
      scholar: Math.min((metrics.completedLessonsCount / 20) * 100, 100),
      graduateTypist:
        metrics.totalLessonsCount > 0
          ? Math.min((metrics.completedLessonsCount / metrics.totalLessonsCount) * 100, 100)
          : 0,

      // Streak achievements
      weekWarrior: Math.min((metrics.uniqueDaysThisWeek / 7) * 100, 100),
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
