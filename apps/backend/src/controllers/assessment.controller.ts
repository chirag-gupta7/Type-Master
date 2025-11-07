import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// Validation schemas
const startAssessmentSchema = z.object({
  userId: z.string(),
});

const completeAssessmentSchema = z.object({
  userId: z.string(),
  wpm: z.number().min(0),
  accuracy: z.number().min(0).max(100),
  mistakesByKey: z.record(z.number()),
  weakFingers: z.array(z.string()),
  timeSpent: z.number().min(0),
});

/**
 * Start a new skill assessment (placement test)
 * POST /api/v1/assessment/start
 */
export const startAssessment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = startAssessmentSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get assessment text (Level 1 lesson content for baseline)
    const assessmentLesson = await prisma.lesson.findFirst({
      where: { level: 1 },
      select: { content: true, targetWpm: true, minAccuracy: true },
    });

    if (!assessmentLesson) {
      return res.status(500).json({ error: 'Assessment content not found' });
    }

    logger.info(`Started skill assessment for user: ${userId}`);

    return res.json({
      message: 'Assessment started',
      content: assessmentLesson.content,
      instructions: 'Type the text below as accurately and quickly as you can.',
      targetWpm: assessmentLesson.targetWpm,
      minAccuracy: assessmentLesson.minAccuracy,
    });
  } catch (error) {
    logger.error('Error starting assessment:', error);
    return res.status(500).json({ error: 'Failed to start assessment' });
  }
};

/**
 * Complete assessment and get recommended starting lesson
 * POST /api/v1/assessment/complete
 */
export const completeAssessment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, wpm, accuracy, mistakesByKey, weakFingers, timeSpent } =
      completeAssessmentSchema.parse(req.body);

    // Determine recommended skill level based on performance
    let recommendedSkillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' = 'BEGINNER';
    let recommendedLessonLevel = 1;

    if (wpm >= 70 && accuracy >= 98) {
      recommendedSkillLevel = 'EXPERT';
      recommendedLessonLevel = 61; // Section 4: Speed & Fluency
    } else if (wpm >= 55 && accuracy >= 97) {
      recommendedSkillLevel = 'ADVANCED';
      recommendedLessonLevel = 41; // Section 3: Advanced Techniques
    } else if (wpm >= 40 && accuracy >= 95) {
      recommendedSkillLevel = 'INTERMEDIATE';
      recommendedLessonLevel = 21; // Section 2: Skill Building
    } else {
      recommendedSkillLevel = 'BEGINNER';
      recommendedLessonLevel = 1; // Section 1: Foundation
    }

    // Identify problematic keys (those with high error counts)
    const problematicKeys = Object.entries(mistakesByKey)
      .filter(([_, count]) => count >= 3)
      .map(([key]) => key);

    // Calculate finger-specific WPM scores (simplified for now)
    const fingerWpmScores = JSON.stringify({
      'pinky-left': wpm * 0.8,
      'ring-left': wpm * 0.9,
      'middle-left': wpm * 0.95,
      'index-left': wpm,
      'index-right': wpm,
      'middle-right': wpm * 0.95,
      'ring-right': wpm * 0.9,
      'pinky-right': wpm * 0.8,
    });

    // Store assessment results
    const assessment = await prisma.userSkillAssessment.create({
      data: {
        userId,
        overallWpm: wpm,
        overallAccuracy: accuracy,
        recommendedLevel: recommendedSkillLevel,
        weakFingers,
        problematicKeys,
        fingerWpmScores,
        assessmentData: JSON.stringify({ mistakesByKey, timeSpent }),
      },
    });

    // UNLOCK LESSONS BASED ON SKILL LEVEL
    // Get all lessons up to the recommended section
    let sectionsToUnlock: number[] = [];

    if (recommendedSkillLevel === 'EXPERT') {
      sectionsToUnlock = [1, 2, 3]; // Unlock Sections 1-3
    } else if (recommendedSkillLevel === 'ADVANCED') {
      sectionsToUnlock = [1, 2]; // Unlock Sections 1-2
    } else if (recommendedSkillLevel === 'INTERMEDIATE') {
      sectionsToUnlock = [1]; // Unlock Section 1
    }
    // BEGINNER starts at lesson 1, no need to unlock

    if (sectionsToUnlock.length > 0) {
      // Get all lessons in the sections to unlock
      const lessonsToUnlock = await prisma.lesson.findMany({
        where: {
          section: {
            in: sectionsToUnlock,
          },
        },
        select: { id: true },
      });

      // Create UserLessonProgress records to unlock these lessons
      // Mark them as "completed" with basic stats so they show as unlocked
      const unlockData = lessonsToUnlock.map((lesson) => ({
        userId,
        lessonId: lesson.id,
        completed: true,
        bestWpm: 0,
        bestAccuracy: 0,
        attempts: 0,
        stars: 0,
      }));

      // Batch insert (skip if already exists)
      await prisma.userLessonProgress.createMany({
        data: unlockData,
        skipDuplicates: true,
      });

      logger.info(
        `Unlocked ${lessonsToUnlock.length} lessons in sections ${sectionsToUnlock.join(', ')} for user: ${userId}`
      );
    }

    // Get the recommended lesson details
    const recommendedLesson = await prisma.lesson.findFirst({
      where: { level: recommendedLessonLevel },
      select: {
        id: true,
        level: true,
        title: true,
        description: true,
        section: true,
        targetWpm: true,
        minAccuracy: true,
      },
    });

    logger.info(
      `Assessment completed for user: ${userId}, recommended level: ${recommendedLessonLevel}, unlocked ${sectionsToUnlock.length} section(s)`
    );

    return res.json({
      message: 'Assessment completed',
      assessment: {
        id: assessment.id,
        wpm,
        accuracy,
        recommendedSkillLevel,
        recommendedLessonLevel,
        weakFingers,
        problematicKeys,
        sectionsUnlocked: sectionsToUnlock,
      },
      recommendedLesson,
      feedback: generateFeedback(wpm, accuracy),
    });
  } catch (error) {
    logger.error('Error completing assessment:', error);
    return res.status(500).json({ error: 'Failed to complete assessment' });
  }
};

/**
 * Get user's latest assessment results
 * GET /api/v1/assessment/latest/:userId
 */
export const getLatestAssessment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;

    const assessment = await prisma.userSkillAssessment.findFirst({
      where: { userId },
      orderBy: { assessmentDate: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'No assessment found for this user' });
    }

    logger.info(`Retrieved latest assessment for user: ${userId}`);

    return res.json({
      assessment: {
        id: assessment.id,
        wpm: assessment.overallWpm,
        accuracy: assessment.overallAccuracy,
        recommendedLevel: assessment.recommendedLevel,
        weakFingers: assessment.weakFingers,
        problematicKeys: assessment.problematicKeys,
        completedAt: assessment.assessmentDate,
      },
    });
  } catch (error) {
    logger.error('Error retrieving assessment:', error);
    return res.status(500).json({ error: 'Failed to retrieve assessment' });
  }
};

/**
 * Generate personalized feedback based on assessment results
 */
function generateFeedback(wpm: number, accuracy: number): string {
  if (wpm >= 70 && accuracy >= 98) {
    return "Excellent! You're an advanced typist. We recommend starting with speed and fluency exercises.";
  } else if (wpm >= 55 && accuracy >= 97) {
    return "Great job! You have solid typing skills. Let's focus on advanced techniques and symbols.";
  } else if (wpm >= 40 && accuracy >= 95) {
    return "Good work! You have basic typing skills. We'll help you build fluency and speed.";
  } else if (accuracy < 90) {
    return "Let's focus on accuracy first! We'll start with foundational lessons to build proper technique.";
  } else {
    return "Welcome! Let's start from the beginning to build a strong typing foundation.";
  }
}
