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
 * Interface for pre-fetched user statistics used in achievement checking
 */
interface UserStats {
  maxWpm: number;
  maxAccuracy: number;
  highAccuracyTestsCount: number;
  testCount: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  uniqueDaysThisWeek: number;
}

/**
 * Achievement requirement checkers
 * Refactored to use pre-fetched UserStats for better performance
 */
const checkAchievementRequirements = {
  // Speed achievements
  speedDemon: (stats: UserStats): boolean => stats.maxWpm >= 50,
  lightningFast: (stats: UserStats): boolean => stats.maxWpm >= 80,
  typingMaster: (stats: UserStats): boolean => stats.maxWpm >= 100,

  // Accuracy achievements
  perfectionist: (stats: UserStats): boolean => stats.maxAccuracy >= 100,
  sharpshooter: (stats: UserStats): boolean => stats.highAccuracyTestsCount >= 10,

  // Consistency achievements
  dedicated: (stats: UserStats): boolean => stats.testCount >= 10,
  committed: (stats: UserStats): boolean => stats.testCount >= 50,
  unstoppable: (stats: UserStats): boolean => stats.testCount >= 100,

  // Learning achievements
  student: (stats: UserStats): boolean => stats.completedLessonsCount >= 5,
  scholar: (stats: UserStats): boolean => stats.completedLessonsCount >= 20,
  graduateTypist: (stats: UserStats): boolean =>
    stats.completedLessonsCount >= stats.totalLessonsCount && stats.totalLessonsCount > 0,

  // Streak achievements
  weekWarrior: (stats: UserStats): boolean => stats.uniqueDaysThisWeek >= 7,

  // First achievements
  firstSteps: (stats: UserStats): boolean => stats.testCount >= 1,
  firstLesson: (stats: UserStats): boolean => stats.completedLessonsCount >= 1,
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

    // Get all achievements
    const achievements = await prisma.achievement.findMany();

    // Get user's already unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });

    const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Consolidated data fetching for performance optimization
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      testCount,
      testAggregates,
      highAccuracyTestsCount,
      completedLessonsCount,
      totalLessonsCount,
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

    const uniqueDaysThisWeek = new Set(
      recentTests.map((r) => r.createdAt.toISOString().split('T')[0])
    ).size;

    const stats: UserStats = {
      testCount,
      maxWpm: testAggregates._max.wpm || 0,
      maxAccuracy: testAggregates._max.accuracy || 0,
      highAccuracyTestsCount,
      completedLessonsCount,
      totalLessonsCount,
      uniqueDaysThisWeek,
    };
    const newlyUnlocked: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      points: number;
      unlockedAt: string;
    }> = [];

    // Check each achievement
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
