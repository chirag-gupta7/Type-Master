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
 * Interface for pre-fetched user metrics to optimize achievement checking
 */
interface UserMetrics {
  maxWpm: number;
  maxAccuracy: number;
  testCount: number;
  highAccuracyTestCount: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  uniqueDaysThisWeek: number;
}

/**
 * Achievement requirement checkers
 */
const checkAchievementRequirements = {
  // Speed achievements
  speedDemon: (metrics: UserMetrics): boolean => {
    return metrics.maxWpm >= 50;
  },

  lightningFast: (metrics: UserMetrics): boolean => {
    return metrics.maxWpm >= 80;
  },

  typingMaster: (metrics: UserMetrics): boolean => {
    return metrics.maxWpm >= 100;
  },

  // Accuracy achievements
  perfectionist: (metrics: UserMetrics): boolean => {
    return metrics.maxAccuracy >= 100;
  },

  sharpshooter: (metrics: UserMetrics): boolean => {
    return metrics.highAccuracyTestCount >= 10;
  },

  // Consistency achievements
  dedicated: (metrics: UserMetrics): boolean => {
    return metrics.testCount >= 10;
  },

  committed: (metrics: UserMetrics): boolean => {
    return metrics.testCount >= 50;
  },

  unstoppable: (metrics: UserMetrics): boolean => {
    return metrics.testCount >= 100;
  },

  // Learning achievements
  student: (metrics: UserMetrics): boolean => {
    return metrics.completedLessonsCount >= 5;
  },

  scholar: (metrics: UserMetrics): boolean => {
    return metrics.completedLessonsCount >= 20;
  },

  graduateTypist: (metrics: UserMetrics): boolean => {
    return (
      metrics.totalLessonsCount > 0 && metrics.completedLessonsCount >= metrics.totalLessonsCount
    );
  },

  // Streak achievements
  weekWarrior: (metrics: UserMetrics): boolean => {
    return metrics.uniqueDaysThisWeek >= 7;
  },

  // First achievements
  firstSteps: (metrics: UserMetrics): boolean => {
    return metrics.testCount >= 1;
  },

  firstLesson: (metrics: UserMetrics): boolean => {
    return metrics.completedLessonsCount >= 1;
  },
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

    // Optimization: Pre-fetch all necessary user metrics in bulk to avoid N+1 queries
    // during achievement checking. This reduces database roundtrips from O(N) to O(1).
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      achievements,
      userAchievements,
      testStats,
      highAccuracyTestCount,
      completedLessonsCount,
      totalLessonsCount,
      recentTests,
    ] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      prisma.testResult.aggregate({
        where: { userId },
        _max: { wpm: true, accuracy: true },
        _count: { _all: true },
      }),
      prisma.testResult.count({
        where: { userId, accuracy: { gte: 95 } },
      }),
      prisma.userLessonProgress.count({
        where: { userId, completed: true },
      }),
      prisma.lesson.count(),
      prisma.testResult.findMany({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    const metrics: UserMetrics = {
      maxWpm: testStats._max.wpm || 0,
      maxAccuracy: testStats._max.accuracy || 0,
      testCount: testStats._count._all,
      highAccuracyTestCount,
      completedLessonsCount,
      totalLessonsCount,
      uniqueDaysThisWeek: new Set(recentTests.map((r) => r.createdAt.toISOString().split('T')[0]))
        .size,
    };

    const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const achievementsToUnlock: typeof achievements = [];

    // Check each achievement against pre-fetched metrics
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedAchievementIds.has(achievement.id)) {
        continue;
      }

      // Parse requirement
      try {
        const requirement = JSON.parse(achievement.requirement);
        const checkerFn =
          checkAchievementRequirements[
            requirement.type as keyof typeof checkAchievementRequirements
          ];

        if (checkerFn && checkerFn(metrics)) {
          achievementsToUnlock.push(achievement);
        }
      } catch (error) {
        logger.error(`Error checking achievement ${achievement.id}:`, error);
      }
    }

    const newlyUnlocked: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      points: number;
      unlockedAt: string;
    }> = [];

    // Award achievements if requirements met
    if (achievementsToUnlock.length > 0) {
      // Use a transaction to ensure all achievements are created and returned
      const now = new Date();
      await prisma.userAchievement.createMany({
        data: achievementsToUnlock.map((a) => ({
          userId,
          achievementId: a.id,
          unlockedAt: now,
        })),
        skipDuplicates: true,
      });

      achievementsToUnlock.forEach((a) => {
        newlyUnlocked.push({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          points: a.points,
          unlockedAt: now.toISOString(),
        });
      });
    }

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

    // Get user statistics
    const testCount = await prisma.testResult.count({ where: { userId } });
    const highAccuracyTests = await prisma.testResult.count({
      where: { userId, accuracy: { gte: 95 } },
    });
    const completedLessons = await prisma.userLessonProgress.count({
      where: { userId, completed: true },
    });
    const totalLessons = await prisma.lesson.count();

    // Get best WPM
    const bestWpmResult = await prisma.testResult.findFirst({
      where: { userId },
      orderBy: { wpm: 'desc' },
      select: { wpm: true },
    });
    const bestWpm = bestWpmResult?.wpm || 0;

    // Check for 7-day streak
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTests = await prisma.testResult.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });
    const uniqueDays = new Set(recentTests.map((r) => r.createdAt.toISOString().split('T')[0]))
      .size;

    // Calculate progress for each achievement type
    const progress = {
      // Consistency achievements
      dedicated: Math.min((testCount / 10) * 100, 100),
      committed: Math.min((testCount / 50) * 100, 100),
      unstoppable: Math.min((testCount / 100) * 100, 100),

      // Speed achievements
      speedDemon: Math.min((bestWpm / 50) * 100, 100),
      lightningFast: Math.min((bestWpm / 80) * 100, 100),
      typingMaster: Math.min((bestWpm / 100) * 100, 100),

      // Accuracy achievements
      sharpshooter: Math.min((highAccuracyTests / 10) * 100, 100),

      // Learning achievements
      student: Math.min((completedLessons / 5) * 100, 100),
      scholar: Math.min((completedLessons / 20) * 100, 100),
      graduateTypist: totalLessons > 0 ? Math.min((completedLessons / totalLessons) * 100, 100) : 0,

      // Streak achievements
      weekWarrior: Math.min((uniqueDays / 7) * 100, 100),
    };

    return res.json({
      progress,
      stats: {
        testCount,
        highAccuracyTests,
        completedLessons,
        totalLessons,
        bestWpm,
        uniqueDaysThisWeek: uniqueDays,
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
