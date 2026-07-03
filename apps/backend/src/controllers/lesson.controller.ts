import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

type LessonWithProgress = Prisma.LessonGetPayload<{
  include: {
    userProgress: true;
  };
}>;

type SectionWithProgress = {
  id: number;
  title: string;
  order: number;
  lessons: LessonWithProgress[];
};

// Validation schemas
const saveLessonProgressSchema = z.object({
  lessonId: z.string().uuid(),
  wpm: z.number().min(0).max(300),
  accuracy: z.number().min(0).max(100),
  completed: z.boolean(),
});

const DEFAULT_SECTION_PAGE_COUNT = 5;
const MAX_SECTION_PAGE_COUNT = 5;
const PRACTICE_TYPE_SCHEMA = z.enum(['normal', 'coding', 'assessment']);

const SECTION_DESCRIPTIONS: Record<number, string> = {
  1: 'Master the fundamentals and home row keys',
  2: 'Build fluency with common letter combinations',
  3: 'Master numbers, symbols, and special characters',
  4: 'Increase your typing speed with real content',
  5: 'Achieve expert-level performance',
  6: 'Master code typing with brackets and operators',
  7: 'Practice typing common Python keywords and syntax',
  8: 'Practice typing Java syntax, classes, and methods',
  9: 'Practice typing C++ syntax, headers, and pointers',
  10: 'Practice typing C syntax, stdio, and structs',
  11: 'Improve punctuation precision and symbol timing',
  12: 'Practice real-world code syntax and structures',
  13: 'Short speed drills for consistency and rhythm',
};

export const PRACTICE_SECTION_IDS: Record<z.infer<typeof PRACTICE_TYPE_SCHEMA>, number[]> = {
  normal: [1, 2, 3, 4, 5, 11, 13],
  coding: [6, 7, 8, 9, 10, 12],
  assessment: [],
};

type PracticeType = z.infer<typeof PRACTICE_TYPE_SCHEMA>;

export const getPracticeSectionIds = (practiceType: PracticeType): number[] => {
  return PRACTICE_SECTION_IDS[practiceType] ?? [];
};

export const getFairPageBounds = (
  totalItems: number,
  page: number,
  pageCount: number
): { startIndex: number; endIndex: number } => {
  const normalizedTotal = Math.max(0, totalItems);
  const normalizedPageCount = Math.max(1, pageCount);
  const normalizedPage = Math.max(1, Math.min(page, normalizedPageCount));

  const baseSize = Math.floor(normalizedTotal / normalizedPageCount);
  const remainder = normalizedTotal % normalizedPageCount;

  const pagesBefore = normalizedPage - 1;
  const startIndex = pagesBefore * baseSize + Math.min(pagesBefore, remainder);
  const currentSize = baseSize + (normalizedPage <= remainder ? 1 : 0);
  const endIndex = startIndex + currentSize;

  return {
    startIndex,
    endIndex,
  };
};

export const getPageForIndex = (index: number, totalItems: number, pageCount: number): number => {
  if (index < 0) return 1;

  const normalizedPageCount = Math.max(1, pageCount);
  for (let page = 1; page <= normalizedPageCount; page++) {
    const { startIndex, endIndex } = getFairPageBounds(totalItems, page, normalizedPageCount);
    if (index >= startIndex && index < endIndex) {
      return page;
    }
  }
  return normalizedPageCount;
};

type LessonProgressSummary = {
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  stars: number;
  attempts: number;
};

type LessonForSectionResponse = {
  id: string;
  level: number;
  order: number;
  title: string;
  description: string;
  keys: string[];
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  exerciseType: string;
  content: string;
  section: number;
  isCheckpoint: boolean;
  userProgress: LessonProgressSummary[];
  isUnlocked: boolean;
  isCompleted: boolean;
};

const buildLessonsWithUnlockState = (
  lessons: Array<
    Prisma.LessonGetPayload<{
      include: {
        userProgress: {
          select: {
            completed: true;
            bestWpm: true;
            bestAccuracy: true;
            stars: true;
            attempts: true;
          };
        };
      };
    }>
  >,
  userId?: string
): LessonForSectionResponse[] => {
  if (!userId) {
    return lessons.map((lesson) => ({
      ...lesson,
      userProgress: [],
      isUnlocked: true,
      isCompleted: false,
    }));
  }

  let previousCompleted = true;
  return lessons.map((lesson, index) => {
    const currentProgress = lesson.userProgress?.[0];
    const isCompleted = Boolean(currentProgress?.completed);
    const isUnlocked = index === 0 || previousCompleted;
    previousCompleted = isCompleted;

    return {
      ...lesson,
      isUnlocked,
      isCompleted,
    };
  });
};

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

    // Try to find by UUID first, then by title (for slug-like IDs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lesson: any = null;

    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(id)) {
      // Try UUID lookup
      lesson = await prisma.lesson.findUnique({
        where: { id },
        include: userId
          ? {
              userProgress: {
                where: { userId },
              },
            }
          : undefined,
      });
    }

    // If not found by UUID or not a UUID, try finding by slug-like title
    if (!lesson) {
      // Convert slug format to title format (e.g., "home-row-basics" -> "Home Row Basics")
      const titleFromSlug = id
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      lesson = await prisma.lesson.findFirst({
        where: {
          OR: [
            { title: { equals: titleFromSlug, mode: 'insensitive' } },
            { title: { contains: id.replace(/-/g, ' '), mode: 'insensitive' } },
          ],
        },
        include: userId
          ? {
              userProgress: {
                where: { userId },
              },
            }
          : undefined,
      });
    }

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
export const saveLessonProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    // Reduce minimum accuracy requirement by 10 percentage points
    const adjustedMinAccuracy = Math.max(0, lesson.minAccuracy - 10);
    let stars = 0;
    const meetsRequirements = wpm >= lesson.targetWpm && accuracy >= adjustedMinAccuracy;

    if (meetsRequirements && completed) {
      if (wpm >= lesson.targetWpm * 1.5 && accuracy >= 98) stars = 3;
      else if (wpm >= lesson.targetWpm * 1.2 && accuracy >= 95) stars = 2;
      else stars = 1;
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

    // Override completed flag - only mark as completed if requirements are met
    const actuallyCompleted = meetsRequirements && completed;

    // Check if this is a better score (improved WPM, accuracy, or stars)
    const improvedWpm = !existingProgress || wpm > existingProgress.bestWpm;
    const improvedAccuracy = !existingProgress || accuracy > existingProgress.bestAccuracy;
    const improvedStars = !existingProgress || stars > (existingProgress?.stars || 0);
    const hasMetricImprovement = improvedWpm || improvedAccuracy || improvedStars;

    if (existingProgress && !hasMetricImprovement) {
      // New score is not better, just increment attempts and return existing progress
      const updatedProgress = await prisma.userLessonProgress.update({
        where: {
          id: existingProgress.id,
        },
        data: {
          attempts: { increment: 1 },
          lastAttempt: new Date(),
          // Still update completed if user achieved it this time and hadn't before
          completed: actuallyCompleted || existingProgress.completed,
        },
      });

      logger.info('Lesson progress updated (not a new best)', {
        userId,
        lessonId,
        currentWpm: wpm,
        bestWpm: existingProgress.bestWpm,
        bestAccuracy: existingProgress.bestAccuracy,
      });

      res.json({
        message: 'Progress saved. Previous best score maintained.',
        progress: updatedProgress,
        meetsRequirements,
        isNewBest: false,
        required: {
          targetWpm: lesson.targetWpm,
          minAccuracy: lesson.minAccuracy,
        },
        current: {
          wpm,
          accuracy,
        },
      });
      return;
    }

    // Either first attempt or better score - save the new record
    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        bestWpm: Math.max(existingProgress?.bestWpm || 0, wpm),
        bestAccuracy: Math.max(existingProgress?.bestAccuracy || 0, accuracy),
        attempts: { increment: 1 },
        completed: actuallyCompleted || existingProgress?.completed,
        stars: Math.max(existingProgress?.stars || 0, stars),
        lastAttempt: new Date(),
      },
      create: {
        userId,
        lessonId,
        bestWpm: wpm,
        bestAccuracy: accuracy,
        attempts: 1,
        completed: actuallyCompleted,
        stars,
      },
    });

    logger.info('Lesson progress saved (new best!)', {
      userId,
      lessonId,
      stars,
      completed: actuallyCompleted,
      meetsRequirements,
      wpm,
    });

    res.json({
      message: actuallyCompleted
        ? 'Lesson completed! You can move to the next lesson.'
        : meetsRequirements
          ? 'Progress saved. Lesson completed!'
          : 'Progress saved. Keep practicing to meet the requirements!',
      progress,
      meetsRequirements,
      isNewBest: hasMetricImprovement,
      required: {
        targetWpm: lesson.targetWpm,
        minAccuracy: lesson.minAccuracy,
      },
      current: {
        wpm,
        accuracy,
      },
    });
    return;
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

    // Optimization: Consolidate multiple queries into a single findMany and calculate stats in-memory.
    // This reduces database roundtrips from 3 to 2.
    const [totalLessons, allProgress] = await Promise.all([
      prisma.lesson.count(),
      prisma.userLessonProgress.findMany({
        where: { userId },
        select: {
          completed: true,
          stars: true,
          bestWpm: true,
          bestAccuracy: true,
        },
      }),
    ]);

    const completedLessons = allProgress.filter((p) => p.completed).length;
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
        completedLessons,
        completionPercentage:
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
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

    // Optimization: Derive historical metrics and activity in-memory from existing lessonsWithProgress query.
    // This reduces database roundtrips from 4 to 2 (one for lessons, one for test activity).
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Group WPM data by lesson and calculate activity from joined data in-memory
    const wpmByLessonMap = new Map<
      string,
      {
        lessonId: string;
        lessonTitle: string;
        level: number;
        data: Array<{ date: string; wpm: number; accuracy: number }>;
      }
    >();

    const lessonActivityByDate: Record<string, number> = {};

    for (const lesson of lessonsWithProgress) {
      const progress = lesson.userProgress[0];
      if (!progress?.lastAttempt) continue;

      const attemptDate = progress.lastAttempt;

      // Activity heatmap tracking
      if (attemptDate >= oneYearAgo) {
        const dateStr = attemptDate.toISOString().split('T')[0];
        lessonActivityByDate[dateStr] = (lessonActivityByDate[dateStr] || 0) + 1;
      }

      // Historical WPM tracking
      if (attemptDate >= ninetyDaysAgo) {
        wpmByLessonMap.set(lesson.id, {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          level: lesson.level,
          data: [
            {
              date: attemptDate.toISOString().split('T')[0],
              wpm: progress.bestWpm,
              accuracy: progress.bestAccuracy,
            },
          ],
        });
      }
    }

    // Only one extra database query for test results, instead of three separate queries
    const testActivity = await prisma.testResult.findMany({
      where: {
        userId,
        createdAt: { gte: oneYearAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // Combine test activity with lesson activity in-memory
    const activityByDate = { ...lessonActivityByDate };
    for (const test of testActivity) {
      const dateStr = test.createdAt.toISOString().split('T')[0];
      activityByDate[dateStr] = (activityByDate[dateStr] || 0) + 1;
    }

    const practiceFrequency = Object.entries(activityByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // Optimization: Use a Map for O(1) lesson lookups and leverage pre-sorted order for skill tree.
    // This improves complexity from O(L^2) to O(L).
    const lessonMap = new Map(lessonsWithProgress.map((l) => [l.id, l]));

    const skillTree = lessonsWithProgress.map((lesson, index) => {
      const progress = lesson.userProgress[0];

      // Optimization: Leverage the pre-sorted nature of lessonsWithProgress (by level, order).
      // This allows O(1) retrieval of preceding lessons within the same level or previous levels.
      const prerequisites: string[] = [];

      if (lesson.order > 1) {
        // Find previous lesson in same level using current index
        // Since it's sorted by (level, order), the previous lesson in the same level
        // MUST be at index-1 if it exists.
        const potentialPrev = lessonsWithProgress[index - 1];
        if (potentialPrev && potentialPrev.level === lesson.level && potentialPrev.order < lesson.order) {
          prerequisites.push(potentialPrev.id);
        }
      } else if (lesson.level > 1) {
        // First lesson of a level depends on the last 3 of the previous level.
        // We look backward from the current index to find the end of the previous level.
        let prevLevelEndIndex = index - 1;
        while (prevLevelEndIndex >= 0 && lessonsWithProgress[prevLevelEndIndex].level >= lesson.level) {
          prevLevelEndIndex--;
        }

        if (prevLevelEndIndex >= 0) {
          const start = Math.max(0, prevLevelEndIndex - 2);
          const lastThree = lessonsWithProgress.slice(start, prevLevelEndIndex + 1).map((l) => l.id);
          prerequisites.push(...lastThree);
        }
      }

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
            ? !prerequisites.every((preId) => lessonMap.get(preId)?.userProgress[0]?.completed)
            : false,
        prerequisites,
      };
    });

    res.json({
      completionByLevel,
      wpmByLesson: Array.from(wpmByLessonMap.values()),
      practiceFrequency,
      skillTree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/sections
 * @desc    Get section summaries for a given practice type
 * @access  Public
 */
export const getSectionSummaries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const practiceType = PRACTICE_TYPE_SCHEMA.catch('normal').parse(req.query.practiceType);
    const sectionIds = getPracticeSectionIds(practiceType);

    if (sectionIds.length === 0) {
      res.json({
        practiceType,
        sections: [],
      });
      return;
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        section: {
          in: sectionIds,
        },
      },
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
      include: {
        userProgress: userId
          ? {
              where: { userId },
              select: {
                completed: true,
                bestWpm: true,
                bestAccuracy: true,
                stars: true,
                attempts: true,
              },
            }
          : false,
      },
    });

    const groupedBySection = lessons.reduce<
      Record<
        number,
        Array<
          Prisma.LessonGetPayload<{
            include: {
              userProgress: {
                select: {
                  completed: true;
                  bestWpm: true;
                  bestAccuracy: true;
                  stars: true;
                  attempts: true;
                };
              };
            };
          }>
        >
      >
    >((acc, lesson) => {
      if (!acc[lesson.section]) {
        acc[lesson.section] = [];
      }
      acc[lesson.section].push(lesson);
      return acc;
    }, {});

    const sections = sectionIds
      .map((sectionId) => {
        const sectionLessons = groupedBySection[sectionId] ?? [];
        if (!sectionLessons.length) {
          return null;
        }

        const lessonsWithState = buildLessonsWithUnlockState(sectionLessons, userId);
        const totalLessons = lessonsWithState.length;
        const completedLessons = lessonsWithState.filter((lesson) => lesson.isCompleted).length;
        const completionPercentage =
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        const firstLessonId = lessonsWithState[0]?.id ?? null;
        const firstUnlockedIncompleteIndex = lessonsWithState.findIndex(
          (lesson) => lesson.isUnlocked && !lesson.isCompleted
        );
        const firstUnlockedIndex =
          firstUnlockedIncompleteIndex >= 0
            ? firstUnlockedIncompleteIndex
            : lessonsWithState.findIndex((lesson) => lesson.isUnlocked);
        const resolvedUnlockedIndex = firstUnlockedIndex >= 0 ? firstUnlockedIndex : 0;
        const firstUnlockedLessonId = lessonsWithState[resolvedUnlockedIndex]?.id ?? firstLessonId;

        return {
          sectionId,
          title: getSectionName(sectionId),
          description: getSectionDescription(sectionId),
          totalLessons,
          completedLessons,
          completionPercentage,
          firstLessonId,
          firstUnlockedLessonId,
          firstUnlockedPage: getPageForIndex(
            resolvedUnlockedIndex,
            totalLessons,
            DEFAULT_SECTION_PAGE_COUNT
          ),
          totalPages: DEFAULT_SECTION_PAGE_COUNT,
        };
      })
      .filter((section): section is NonNullable<typeof section> => section !== null);

    res.json({
      practiceType,
      sections,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/lessons/section/:sectionId
 * @desc    Get paged lessons for a specific section
 * @access  Public
 */

export const getLessonsBySection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user?.userId;
    const section = Number.parseInt(sectionId, 10);
    const page = Number.parseInt(String(req.query.page ?? '1'), 10);
    const pageCount = Number.parseInt(
      String(req.query.pageCount ?? DEFAULT_SECTION_PAGE_COUNT),
      10
    );

    if (Number.isNaN(section) || section <= 0) {
      throw new AppError(400, 'Section must be a positive integer');
    }

    if (Number.isNaN(page) || page < 1 || page > DEFAULT_SECTION_PAGE_COUNT) {
      throw new AppError(400, `Page must be between 1 and ${DEFAULT_SECTION_PAGE_COUNT}`);
    }

    if (
      Number.isNaN(pageCount) ||
      pageCount < 1 ||
      pageCount > MAX_SECTION_PAGE_COUNT ||
      pageCount !== DEFAULT_SECTION_PAGE_COUNT
    ) {
      throw new AppError(
        400,
        `Page count must be exactly ${DEFAULT_SECTION_PAGE_COUNT} for fair distribution`
      );
    }

    const lessons = await prisma.lesson.findMany({
      where: { section },
      orderBy: [{ order: 'asc' }],
      include: {
        userProgress: userId
          ? {
              where: { userId },
              select: {
                completed: true,
                bestWpm: true,
                bestAccuracy: true,
                stars: true,
                attempts: true,
              },
            }
          : false,
      },
    });

    if (lessons.length === 0) {
      throw new AppError(404, `Section ${section} not found`);
    }

    const lessonsWithState = buildLessonsWithUnlockState(lessons, userId);
    const totalLessons = lessonsWithState.length;
    const completedLessons = lessonsWithState.filter((lesson) => lesson.isCompleted).length;
    const completionPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const { startIndex, endIndex } = getFairPageBounds(totalLessons, page, pageCount);
    const pagedLessons = lessonsWithState.slice(startIndex, endIndex);

    logger.info(`Retrieved lessons for section ${section} page ${page}/${pageCount}`, {
      section,
      page,
      pageCount,
      returned: pagedLessons.length,
    });

    res.json({
      section: {
        id: section,
        name: getSectionName(section),
        description: getSectionDescription(section),
        totalLessons,
        completedLessons,
        completionPercentage,
      },
      pagination: {
        page,
        pageCount,
        totalPages: pageCount,
        totalLessons,
        startIndex,
        endIndex,
        hasPreviousPage: page > 1,
        hasNextPage: page < pageCount,
      },
      lessons: pagedLessons,
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
 * @route   GET /api/v1/lessons/dashboard
 * @desc    Get all sections with lessons and user progress
 * @access  Private
 */
export const getLearningDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const userId = req.user.userId;

    // Get all lessons with user progress grouped by section
    const lessons = await prisma.lesson.findMany({
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
      include: {
        userProgress: {
          where: { userId },
        },
      },
    });

    // Group lessons by section
    const sectionsMap = lessons.reduce<Record<number, SectionWithProgress>>((acc, lesson) => {
      const sectionId = lesson.section;
      if (!acc[sectionId]) {
        acc[sectionId] = {
          id: sectionId,
          title: getSectionName(sectionId),
          order: sectionId,
          lessons: [],
        };
      }
      acc[sectionId].lessons.push(lesson);
      return acc;
    }, {});

    // Convert to array and sort
    const sectionsWithProgress = Object.values(sectionsMap).sort((a, b) => a.order - b.order);

    logger.info(`Fetched learning dashboard for user: ${userId}`);

    res.status(200).json(sectionsWithProgress);
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
    7: 'Python Coding',
    8: 'Java Coding',
    9: 'C++ Coding',
    10: 'C Coding',
    11: 'Advanced Punctuation',
    12: 'Code Syntax',
    13: 'Speed Drills',
  };
  return sectionNames[sectionId] || `Section ${sectionId}`;
}

function getSectionDescription(sectionId: number): string {
  return SECTION_DESCRIPTIONS[sectionId] || 'Additional lesson content';
}
