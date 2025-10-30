import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// Validation schemas
const logMistakeSchema = z.object({
  userId: z.string(),
  lessonId: z.string(),
  mistakes: z.array(z.object({
    keyPressed: z.string(),
    keyExpected: z.string(),
    fingerUsed: z.string().optional(),
  })),
});

/**
 * Log typing mistakes from a lesson attempt
 * POST /api/v1/mistakes/log
 */
export const logMistakes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, lessonId, mistakes } = logMistakeSchema.parse(req.body);

    // Create all mistake records
    const mistakeRecords = await prisma.typingMistake.createMany({
      data: mistakes.map(m => ({
        userId,
        lessonId,
        keyPressed: m.keyPressed,
        keyExpected: m.keyExpected,
        fingerUsed: m.fingerUsed,
      })),
    });

    // Update or create weak keys records
    for (const mistake of mistakes) {
      await prisma.userWeakKeys.upsert({
        where: {
          userId_keyChar: {
            userId,
            keyChar: mistake.keyExpected,
          },
        },
        update: {
          errorCount: { increment: 1 },
          lastError: new Date(),
        },
        create: {
          userId,
          keyChar: mistake.keyExpected,
          errorCount: 1,
          lastError: new Date(),
        },
      });
    }

    logger.info(`Logged ${mistakes.length} typing mistakes for user: ${userId}`);

    res.json({
      message: 'Mistakes logged successfully',
      count: mistakeRecords.count,
    });
  } catch (error) {
    logger.error('Error logging mistakes:', error);
    res.status(500).json({ error: 'Failed to log mistakes' });
  }
};

/**
 * Get weak key analysis for a user
 * GET /api/v1/mistakes/analysis/:userId
 */
export const getWeakKeyAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get user's weak keys, sorted by error count
    const weakKeys = await prisma.userWeakKeys.findMany({
      where: { userId },
      orderBy: { errorCount: 'desc' },
      take: limit,
    });

    // Get finger-specific error patterns
    const fingerErrors = await prisma.$queryRaw<Array<{ fingerUsed: string; count: bigint }>>`
      SELECT 
        "fingerUsed",
        COUNT(*) as count
      FROM "typing_mistakes"
      WHERE "userId" = ${userId}
        AND "fingerUsed" IS NOT NULL
      GROUP BY "fingerUsed"
      ORDER BY count DESC
    `;

    // Get recent mistakes for context
    const recentMistakes = await prisma.typingMistake.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        keyPressed: true,
        keyExpected: true,
        fingerUsed: true,
        timestamp: true,
      },
    });

    logger.info(`Retrieved weak key analysis for user: ${userId}`);

    res.json({
      weakKeys: weakKeys.map(wk => ({
        key: wk.keyChar,
        errorCount: wk.errorCount,
        lastError: wk.lastError,
      })),
      fingerErrors: fingerErrors.map(fe => ({
        finger: fe.fingerUsed,
        count: Number(fe.count),
      })),
      recentMistakes,
      analysis: generateWeakKeyAnalysis(weakKeys, fingerErrors),
    });
  } catch (error) {
    logger.error('Error getting weak key analysis:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis' });
  }
};

/**
 * Generate targeted practice text based on weak keys
 * GET /api/v1/mistakes/practice/:userId
 */
export const generatePracticeText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Get top 5 weak keys
    const weakKeys = await prisma.userWeakKeys.findMany({
      where: { userId },
      orderBy: { errorCount: 'desc' },
      take: 5,
    });

    if (weakKeys.length === 0) {
      res.json({
        message: 'No weak keys found. Great job!',
        practiceText: '',
      });
      return;
    }

    // Generate practice text focusing on weak keys
    const keys = weakKeys.map(wk => wk.keyChar);
    const practiceText = generatePracticeContent(keys);

    logger.info(`Generated practice text for user: ${userId}`);

    res.json({
      message: 'Practice text generated',
      weakKeys: keys,
      practiceText,
      instructions: `Focus on these keys: ${keys.join(', ')}. Type slowly and accurately.`,
    });
  } catch (error) {
    logger.error('Error generating practice text:', error);
    res.status(500).json({ error: 'Failed to generate practice text' });
  }
};

/**
 * Helper: Generate analysis summary
 */
function generateWeakKeyAnalysis(
  weakKeys: Array<{ keyChar: string; errorCount: number }>,
  fingerErrors: Array<{ fingerUsed: string | null; count: bigint }>
): string {
  if (weakKeys.length === 0) {
    return 'Excellent work! No significant weak keys detected.';
  }

  const topKey = weakKeys[0];
  const topFinger = fingerErrors[0];

  let analysis = `Your most problematic key is "${topKey.keyChar}" with ${topKey.errorCount} errors. `;

  if (topFinger && topFinger.fingerUsed) {
    analysis += `Most mistakes occur with the ${topFinger.fingerUsed} finger. `;
  }

  analysis += 'We recommend focusing on targeted practice for these keys.';

  return analysis;
}

/**
 * Helper: Generate practice content focusing on specific keys
 */
function generatePracticeContent(keys: string[]): string {
  // Create exercises that focus on the problematic keys
  const exercises: string[] = [];

  // Exercise 1: Individual key practice
  exercises.push(keys.map(k => `${k} ${k} ${k} ${k} ${k}`).join(' '));

  // Exercise 2: Key pairs
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      exercises.push(`${keys[i]}${keys[j]} ${keys[j]}${keys[i]} `);
    }
  }

  // Exercise 3: Keys in common words (if possible)
  const commonWords = [
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  ];

  const relevantWords = commonWords.filter(word =>
    keys.some(key => word.includes(key.toLowerCase()))
  );

  if (relevantWords.length > 0) {
    exercises.push(relevantWords.slice(0, 10).join(' '));
  }

  return exercises.join(' ');
}
