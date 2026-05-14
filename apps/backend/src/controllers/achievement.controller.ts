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

// Achievement requirement checkers moved inside checkAndAwardAchievements for optimization

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

    // Optimization: Bulk fetch all necessary metrics to avoid N+1 queries during check
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [achievements, userAchievements, metrics] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      Promise.all([
        prisma.testResult.count({ where: { userId } }),
        prisma.testResult.aggregate({ where: { userId }, _max: { wpm: true } }),
        prisma.testResult.findFirst({ where: { userId, accuracy: 100 }, select: { id: true } }),
        prisma.testResult.count({ where: { userId, accuracy: { gte: 95 } } }),
        prisma.userLessonProgress.count({ where: { userId, completed: true } }),
        prisma.lesson.count(),
        prisma.testResult.findMany({
          where: { userId, createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
        }),
      ]),
    ]);

    const [
      testCount,
      maxWpmAgg,
      perfectionistResult,
      highAccuracyCount,
      completedLessonsCount,
      totalLessonsCount,
      recentTests,
    ] = metrics;

    const maxWpm = maxWpmAgg._max.wpm || 0;
    const uniqueDaysCount = new Set(recentTests.map((r) => r.createdAt.toISOString().split('T')[0]))
      .size;

    const unlockedAchievementIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const toAward: typeof achievements = [];

    // Check each achievement against pre-fetched metrics
    for (const achievement of achievements) {
      if (unlockedAchievementIds.has(achievement.id)) continue;

      let requirementMet = false;
      try {
        const requirement = JSON.parse(achievement.requirement);
        const type = requirement.type as string;

        switch (type) {
          case 'speedDemon':
            requirementMet = maxWpm >= 50;
            break;
          case 'lightningFast':
            requirementMet = maxWpm >= 80;
            break;
          case 'typingMaster':
            requirementMet = maxWpm >= 100;
            break;
          case 'perfectionist':
            requirementMet = !!perfectionistResult;
            break;
          case 'sharpshooter':
            requirementMet = highAccuracyCount >= 10;
            break;
          case 'dedicated':
            requirementMet = testCount >= 10;
            break;
          case 'committed':
            requirementMet = testCount >= 50;
            break;
          case 'unstoppable':
            requirementMet = testCount >= 100;
            break;
          case 'student':
            requirementMet = completedLessonsCount >= 5;
            break;
          case 'scholar':
            requirementMet = completedLessonsCount >= 20;
            break;
          case 'graduateTypist':
            requirementMet = completedLessonsCount >= totalLessonsCount && totalLessonsCount > 0;
            break;
          case 'weekWarrior':
            requirementMet = uniqueDaysCount >= 7;
            break;
          case 'firstSteps':
            requirementMet = testCount >= 1;
            break;
          case 'firstLesson':
            requirementMet = completedLessonsCount >= 1;
            break;
        }
      } catch (error) {
        logger.error(`Error checking achievement ${achievement.id}:`, error);
        continue;
      }

      if (requirementMet) {
        toAward.push(achievement);
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

    if (toAward.length > 0) {
      const now = new Date();
      await prisma.userAchievement.createMany({
        data: toAward.map((a) => ({
          userId,
          achievementId: a.id,
          unlockedAt: now,
        })),
        skipDuplicates: true,
      });

      toAward.forEach((a) => {
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

    // Optimization: Bulk fetch all necessary metrics to avoid sequential queries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      testCount,
      highAccuracyTests,
      completedLessons,
      totalLessons,
      bestWpmAgg,
      recentTests,
    ] = await Promise.all([
      prisma.testResult.count({ where: { userId } }),
      prisma.testResult.count({
        where: { userId, accuracy: { gte: 95 } },
      }),
      prisma.userLessonProgress.count({
        where: { userId, completed: true },
      }),
      prisma.lesson.count(),
      prisma.testResult.aggregate({
        where: { userId },
        _max: { wpm: true },
      }),
      prisma.testResult.findMany({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    const bestWpm = bestWpmAgg._max.wpm || 0;
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
