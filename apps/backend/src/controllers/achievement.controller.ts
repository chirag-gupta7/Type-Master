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
 * Interface for pre-fetched user statistics to avoid redundant database queries
 */
interface UserStats {
  testCount: number;
  bestWpm: number;
  bestAccuracy: number;
  highAccuracyTests: number;
  completedLessons: number;
  totalLessons: number;
  uniqueDaysThisWeek: number;
}

/**
 * Fetch all necessary statistics for a user in parallel
 */
const fetchUserStats = async (userId: string): Promise<UserStats> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    testCount,
    bestStats,
    highAccuracyTests,
    completedLessons,
    totalLessons,
    recentTests,
  ] = await Promise.all([
    prisma.testResult.count({ where: { userId } }),
    prisma.testResult.aggregate({
      where: { userId },
      _max: { wpm: true, accuracy: true },
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

  const uniqueDays = new Set(recentTests.map((r) => r.createdAt.toISOString().split('T')[0]))
    .size;

  return {
    testCount,
    bestWpm: bestStats._max.wpm || 0,
    bestAccuracy: bestStats._max.accuracy || 0,
    highAccuracyTests,
    completedLessons,
    totalLessons,
    uniqueDaysThisWeek: uniqueDays,
  };
};

/**
 * Achievement requirement checkers using pre-fetched stats
 */
const checkAchievementRequirements = {
  // Speed achievements
  speedDemon: (stats: UserStats): boolean => stats.bestWpm >= 50,
  lightningFast: (stats: UserStats): boolean => stats.bestWpm >= 80,
  typingMaster: (stats: UserStats): boolean => stats.bestWpm >= 100,

  // Accuracy achievements
  perfectionist: (stats: UserStats): boolean => stats.bestAccuracy >= 100,
  sharpshooter: (stats: UserStats): boolean => stats.highAccuracyTests >= 10,

  // Consistency achievements
  dedicated: (stats: UserStats): boolean => stats.testCount >= 10,
  committed: (stats: UserStats): boolean => stats.testCount >= 50,
  unstoppable: (stats: UserStats): boolean => stats.testCount >= 100,

  // Learning achievements
  student: (stats: UserStats): boolean => stats.completedLessons >= 5,
  scholar: (stats: UserStats): boolean => stats.completedLessons >= 20,
  graduateTypist: (stats: UserStats): boolean =>
    stats.completedLessons >= stats.totalLessons && stats.totalLessons > 0,

  // Streak achievements
  weekWarrior: (stats: UserStats): boolean => stats.uniqueDaysThisWeek >= 7,

  // First achievements
  firstSteps: (stats: UserStats): boolean => stats.testCount >= 1,
  firstLesson: (stats: UserStats): boolean => stats.completedLessons >= 1,
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
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt] as [string, Date])
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
        unlockedAt: unlockedAt?.toISOString() || null,
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
 * Check and award new achievements for a user
 * POST /api/v1/achievements/check
 */
export const checkAndAwardAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Optimization: Fetch achievements, already unlocked ones, and user stats in parallel.
    // This reduces the number of database queries from O(N) to a small constant number,
    // regardless of the number of achievements.
    const [achievements, userAchievements, stats] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      fetchUserStats(userId),
    ]);

    const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const newlyUnlocked: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      points: number;
      unlockedAt: string;
    }> = [];

    // Check each achievement in memory
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedAchievementIds.has(achievement.id)) {
        continue;
      }

      // Parse requirement
      let requirementMet = false;
      try {
        const requirement = JSON.parse(achievement.requirement);
        const checkerFn =
          checkAchievementRequirements[
            requirement.type as keyof typeof checkAchievementRequirements
          ];

        if (checkerFn) {
          requirementMet = checkerFn(stats);
        }
      } catch (error) {
        logger.error(`Error checking achievement ${achievement.id}:`, error);
        continue;
      }

      // Award achievement if requirement met
      if (requirementMet) {
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        newlyUnlocked.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
          unlockedAt: userAchievement.unlockedAt.toISOString(),
        });
      }
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

    // Optimization: Parallelize independent aggregate and list queries
    const [totalStats, userAchievements, recentUnlocks] = await Promise.all([
      prisma.achievement.aggregate({
        _count: { id: true },
        _sum: { points: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: {
            select: {
              points: true,
            },
          },
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { unlockedAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalAchievements = totalStats._count.id;
    const totalPoints = totalStats._sum.points || 0;
    const unlockedCount = userAchievements.length;
    const earnedPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

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

    // Optimization: Use the centralized fetchUserStats to parallelize all data retrieval
    const stats = await fetchUserStats(userId);

    // Calculate progress for each achievement type
    const progress = {
      // Consistency achievements
      dedicated: Math.min((stats.testCount / 10) * 100, 100),
      committed: Math.min((stats.testCount / 50) * 100, 100),
      unstoppable: Math.min((stats.testCount / 100) * 100, 100),

      // Speed achievements
      speedDemon: Math.min((stats.bestWpm / 50) * 100, 100),
      lightningFast: Math.min((stats.bestWpm / 80) * 100, 100),
      typingMaster: Math.min((stats.bestWpm / 100) * 100, 100),

      // Accuracy achievements
      sharpshooter: Math.min((stats.highAccuracyTests / 10) * 100, 100),

      // Learning achievements
      student: Math.min((stats.completedLessons / 5) * 100, 100),
      scholar: Math.min((stats.completedLessons / 20) * 100, 100),
      graduateTypist:
        stats.totalLessons > 0 ? Math.min((stats.completedLessons / stats.totalLessons) * 100, 100) : 0,

      // Streak achievements
      weekWarrior: Math.min((stats.uniqueDaysThisWeek / 7) * 100, 100),
    };

    return res.json({
      progress,
      stats,
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
