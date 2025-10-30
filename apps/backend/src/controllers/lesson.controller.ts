import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

// Validation schemas
const saveLessonProgressSchema = z.object({
  lessonId: z.string().uuid(),
  wpm: z.number().min(0).max(300),
  accuracy: z.number().min(0).max(100),
  completed: z.boolean(),
});

/**
 * @route   GET /api/v1/lessons
 * @desc    Get all lessons with user progress
 * @access  Public (shows progress if authenticated)
 */
export const getAllLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const lessons = await prisma.lesson.findMany({
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
      include: userId
        ? {
            userProgress: {
              where: { userId },
              select: {
                completed: true,
                bestWpm: true,
                bestAccuracy: true,
                stars: true,
                attempts: true,
              },
            },
          }
        : undefined,
    });

    res.json({ lessons });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/:id
 * @desc    Get single lesson with details
 * @access  Public
 */
export const getLessonById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: userId
        ? {
            userProgress: {
              where: { userId },
            },
          }
        : undefined,
    });

    if (!lesson) {
      throw new AppError(404, 'Lesson not found');
    }

    res.json({ lesson });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/lessons/progress
 * @desc    Save lesson progress
 * @access  Private
 */
export const saveLessonProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { lessonId, wpm, accuracy, completed } = saveLessonProgressSchema.parse(req.body);
    const userId = req.user.userId;

    // Get lesson details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new AppError(404, 'Lesson not found');
    }

    // Calculate stars (0-3 based on performance)
    let stars = 0;
    if (completed) {
      if (wpm >= lesson.targetWpm * 1.5 && accuracy >= 98) stars = 3;
      else if (wpm >= lesson.targetWpm * 1.2 && accuracy >= 95) stars = 2;
      else if (wpm >= lesson.targetWpm && accuracy >= lesson.minAccuracy) stars = 1;
    }

    // Get existing progress to compare
    const existingProgress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    // Upsert progress
    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        bestWpm: existingProgress ? Math.max(existingProgress.bestWpm, wpm) : wpm,
        bestAccuracy: existingProgress
          ? Math.max(existingProgress.bestAccuracy, accuracy)
          : accuracy,
        attempts: { increment: 1 },
        completed: completed || undefined,
        stars: existingProgress ? Math.max(existingProgress.stars, stars) : stars,
        lastAttempt: new Date(),
      },
      create: {
        userId,
        lessonId,
        bestWpm: wpm,
        bestAccuracy: accuracy,
        attempts: 1,
        completed,
        stars,
      },
    });

    logger.info('Lesson progress saved', { userId, lessonId, stars, completed });

    res.json({
      message: 'Progress saved successfully',
      progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/progress/stats
 * @desc    Get user's overall learning statistics
 * @access  Private
 */
export const getLearningStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const userId = req.user.userId;

    const [totalLessons, completedProgress, allProgress] = await Promise.all([
      prisma.lesson.count(),
      prisma.userLessonProgress.count({
        where: { userId, completed: true },
      }),
      prisma.userLessonProgress.findMany({
        where: { userId },
        select: {
          stars: true,
          bestWpm: true,
          bestAccuracy: true,
        },
      }),
    ]);

    const totalStars = allProgress.reduce((sum, p) => sum + p.stars, 0);
    const avgWpm =
      allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + p.bestWpm, 0) / allProgress.length
        : 0;
    const avgAccuracy =
      allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + p.bestAccuracy, 0) / allProgress.length
        : 0;

    res.json({
      stats: {
        totalLessons,
        completedLessons: completedProgress,
        completionPercentage:
          totalLessons > 0 ? Math.round((completedProgress / totalLessons) * 100) : 0,
        totalStars,
        maxStars: totalLessons * 3,
        averageWpm: Math.round(avgWpm),
        averageAccuracy: Math.round(avgAccuracy * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/progress/visualization
 * @desc    Get detailed progress data for visualization (charts, heatmap, skill tree)
 * @access  Private
 */
export const getProgressVisualization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const userId = req.user.userId;

    // Get all lessons with progress
    const lessonsWithProgress = await prisma.lesson.findMany({
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
      include: {
        userProgress: {
          where: { userId },
          select: {
            completed: true,
            bestWpm: true,
            bestAccuracy: true,
            stars: true,
            attempts: true,
            lastAttempt: true,
          },
        },
      },
    });

    // Calculate completion by level
    const levelStats = lessonsWithProgress.reduce(
      (acc, lesson) => {
        const levelKey = `level${lesson.level}`;
        if (!acc[levelKey]) {
          acc[levelKey] = { total: 0, completed: 0, totalStars: 0, earnedStars: 0 };
        }
        acc[levelKey].total++;
        const progress = lesson.userProgress[0];
        if (progress?.completed) {
          acc[levelKey].completed++;
        }
        acc[levelKey].totalStars += 3;
        acc[levelKey].earnedStars += progress?.stars || 0;
        return acc;
      },
      {} as Record<
        string,
        { total: number; completed: number; totalStars: number; earnedStars: number }
      >
    );

    // Format level completion data
    const completionByLevel = Object.entries(levelStats).map(([level, stats]) => ({
      level: level.replace('level', ''),
      name:
        ['Beginner', 'Intermediate', 'Advanced', 'Expert'][
          parseInt(level.replace('level', '')) - 1
        ] || `Level ${level.replace('level', '')}`,
      percentage: Math.round((stats.completed / stats.total) * 100),
      completed: stats.completed,
      total: stats.total,
      stars: stats.earnedStars,
      maxStars: stats.totalStars,
    }));

    // Get historical progress data for WPM improvement (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const lessonHistory = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        lastAttempt: { gte: ninetyDaysAgo },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            level: true,
          },
        },
      },
      orderBy: {
        lastAttempt: 'asc',
      },
    });

    // Group WPM data by lesson
    const wpmByLesson = lessonHistory.reduce(
      (acc, entry) => {
        const lessonId = entry.lesson.id;
        if (!acc[lessonId]) {
          acc[lessonId] = {
            lessonId,
            lessonTitle: entry.lesson.title,
            level: entry.lesson.level,
            data: [],
          };
        }
        acc[lessonId].data.push({
          date: entry.lastAttempt.toISOString().split('T')[0],
          wpm: entry.bestWpm,
          accuracy: entry.bestAccuracy,
        });
        return acc;
      },
      {} as Record<
        string,
        {
          lessonId: string;
          lessonTitle: string;
          level: number;
          data: Array<{ date: string; wpm: number; accuracy: number }>;
        }
      >
    );

    // Get practice frequency for heat map (last 365 days)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [testActivity, lessonActivity] = await Promise.all([
      prisma.testResult.findMany({
        where: {
          userId,
          createdAt: { gte: oneYearAgo },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.userLessonProgress.findMany({
        where: {
          userId,
          lastAttempt: { gte: oneYearAgo },
        },
        select: {
          lastAttempt: true,
        },
      }),
    ]);

    // Combine and count activities by date
    const activityByDate = [...testActivity, ...lessonActivity].reduce(
      (acc, entry) => {
        const date =
          'createdAt' in entry
            ? entry.createdAt.toISOString().split('T')[0]
            : entry.lastAttempt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const practiceFrequency = Object.entries(activityByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // Build skill tree structure with dependencies
    const skillTree = lessonsWithProgress.map((lesson) => {
      const progress = lesson.userProgress[0];
      const prerequisites =
        lesson.order > 1
          ? lessonsWithProgress
              .filter((l) => l.level === lesson.level && l.order < lesson.order)
              .slice(-1) // Only previous lesson in same level
              .map((l) => l.id)
          : lesson.level > 1
            ? lessonsWithProgress
                .filter((l) => l.level === lesson.level - 1)
                .slice(-3) // Last 3 lessons from previous level
                .map((l) => l.id)
            : [];

      return {
        id: lesson.id,
        title: lesson.title,
        level: lesson.level,
        order: lesson.order,
        difficulty: lesson.difficulty,
        targetWpm: lesson.targetWpm,
        completed: progress?.completed || false,
        stars: progress?.stars || 0,
        bestWpm: progress?.bestWpm || 0,
        attempts: progress?.attempts || 0,
        locked:
          prerequisites.length > 0
            ? !prerequisites.every((preReqId) =>
                lessonsWithProgress.find((l) => l.id === preReqId && l.userProgress[0]?.completed)
              )
            : false,
        prerequisites,
      };
    });

    res.json({
      completionByLevel,
      wpmByLesson: Object.values(wpmByLesson),
      practiceFrequency,
      skillTree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/section/:sectionId
 * @desc    Get all lessons for a specific section
 * @access  Public
 */
export const getLessonsBySection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user?.userId;
    const section = parseInt(sectionId);

    if (isNaN(section) || section < 1 || section > 6) {
      throw new AppError(400, 'Section must be between 1 and 6');
    }

    const lessons = await prisma.lesson.findMany({
      where: { section },
      orderBy: [{ order: 'asc' }],
      include: userId
        ? {
            userProgress: {
              where: { userId },
              select: {
                completed: true,
                bestWpm: true,
                bestAccuracy: true,
                stars: true,
                attempts: true,
              },
            },
          }
        : undefined,
    });

    // Calculate section progress
    const totalLessons = lessons.length;
    let completedLessons = 0;
    if (userId) {
      completedLessons = lessons.reduce((count, lesson) => {
        if (
          'userProgress' in lesson &&
          Array.isArray(lesson.userProgress) &&
          lesson.userProgress.length > 0
        ) {
          return count + (lesson.userProgress[0].completed ? 1 : 0);
        }
        return count;
      }, 0);
    }
    const completionPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    logger.info(`Retrieved ${lessons.length} lessons for section ${section}`);

    res.json({
      section: {
        id: section,
        name: getSectionName(section),
        totalLessons,
        completedLessons,
        completionPercentage,
      },
      lessons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/checkpoints
 * @desc    Get all checkpoint lessons
 * @access  Public
 */
export const getCheckpointLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const checkpoints = await prisma.lesson.findMany({
      where: { isCheckpoint: true },
      orderBy: [{ section: 'asc' }, { level: 'asc' }],
      include: userId
        ? {
            userProgress: {
              where: { userId },
              select: {
                completed: true,
                bestWpm: true,
                bestAccuracy: true,
                stars: true,
              },
            },
          }
        : undefined,
    });

    logger.info(`Retrieved ${checkpoints.length} checkpoint lessons`);

    res.json({ checkpoints });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/recommended
 * @desc    Get next recommended lesson for the user
 * @access  Private
 */
export const getRecommendedLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const userId = req.user.userId;

    // Get user's latest assessment
    const assessment = await prisma.userSkillAssessment.findFirst({
      where: { userId },
      orderBy: { assessmentDate: 'desc' },
    });

    // Get all user's completed lessons
    const completedProgress = await prisma.userLessonProgress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
    });

    const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

    // Determine starting section based on assessment or default to Section 1
    let startSection = 1;
    if (assessment) {
      if (assessment.recommendedLevel === 'EXPERT') startSection = 4;
      else if (assessment.recommendedLevel === 'ADVANCED') startSection = 3;
      else if (assessment.recommendedLevel === 'INTERMEDIATE') startSection = 2;
    }

    // Find first incomplete lesson in the appropriate section
    let recommendedLesson = await prisma.lesson.findFirst({
      where: {
        section: { gte: startSection },
        id: { notIn: Array.from(completedLessonIds) },
      },
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
    });

    // If no incomplete lesson found, get the first lesson
    if (!recommendedLesson) {
      recommendedLesson = await prisma.lesson.findFirst({
        orderBy: [{ section: 'asc' }, { order: 'asc' }],
      });
    }

    if (!recommendedLesson) {
      throw new AppError(404, 'No lessons available');
    }

    logger.info(`Recommended lesson ${recommendedLesson.level} for user: ${userId}`);

    res.json({
      lesson: recommendedLesson,
      reasoning: assessment
        ? `Based on your ${assessment.recommendedLevel} skill level assessment`
        : 'Starting with foundational lessons',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Get section name by ID
 */
function getSectionName(sectionId: number): string {
  const sectionNames: Record<number, string> = {
    1: 'Foundation',
    2: 'Skill Building',
    3: 'Advanced Techniques',
    4: 'Speed & Fluency',
    5: 'Mastery',
    6: 'Programming',
  };
  return sectionNames[sectionId] || `Section ${sectionId}`;
}
