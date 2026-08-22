import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Validation schemas
const createTestResultSchema = z.object({
  wpm: z.number().min(0).max(300, 'WPM seems unrealistic'),
  accuracy: z.number().min(0).max(100, 'Accuracy must be between 0 and 100'),
  rawWpm: z.number().min(0),
  errors: z.number().int().min(0),
  duration: z.enum(['30', '60', '180']).transform(Number),
  mode: z.enum(['WORDS', 'TIME', 'QUOTE']).default('WORDS'),
});

const getUserTestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  duration: z.coerce.number().int().positive().optional(),
});

/**
 * @route   POST /api/v1/tests
 * @desc    Create a new test result
 * @access  Private
 */
export const createTestResult = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    // Validate input
    const data = createTestResultSchema.parse(req.body);

    // Create test result
    const testResult = await prisma.testResult.create({
      data: {
        userId: req.user.userId,
        wpm: data.wpm,
        accuracy: data.accuracy,
        rawWpm: data.rawWpm,
        errors: data.errors,
        duration: data.duration,
        mode: data.mode,
      },
    });

    logger.info('Test result created', {
      userId: req.user.userId,
      testId: testResult.id,
      wpm: testResult.wpm,
    });

    res.status(201).json({
      message: 'Test result saved successfully',
      testResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/tests
 * @desc    Get all tests for authenticated user
 * @access  Private
 */
export const getUserTests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { page, limit, duration } = getUserTestsQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.userId,
      ...(duration && { duration }),
    };

    const [tests, total] = await Promise.all([
      prisma.testResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          wpm: true,
          accuracy: true,
          rawWpm: true,
          errors: true,
          duration: true,
          mode: true,
          createdAt: true,
        },
      }),
      prisma.testResult.count({ where }),
    ]);

    res.json({
      tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/tests/:id
 * @desc    Get specific test by ID
 * @access  Private
 */
export const getTestById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { id } = req.params;

    const test = await prisma.testResult.findUnique({
      where: { id },
    });

    if (!test) {
      throw new AppError(404, 'Test not found');
    }

    if (test.userId !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    res.json({ test });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/tests/stats
 * @desc    Get user statistics
 * @access  Private
 */
export const getUserStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { duration, days = '30' } = req.query;
    const daysNum = Math.max(parseInt(days as string, 10) || 30, 1);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const where = {
      userId: req.user.userId,
      createdAt: { gte: startDate },
      ...(duration && { duration: parseInt(duration as string, 10) }),
    };

    // Optimization: Offload statistical calculations to the database using Prisma's 'aggregate'.
    // We also parallelize the aggregate and findMany calls to minimize total response time.
    const [aggregates, recentTests] = await Promise.all([
      prisma.testResult.aggregate({
        where,
        _avg: {
          wpm: true,
          accuracy: true,
        },
        _max: {
          wpm: true,
          accuracy: true,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.testResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          wpm: true,
          accuracy: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      stats: {
        averageWpm: Math.round(aggregates._avg.wpm || 0),
        averageAccuracy: Math.round(aggregates._avg.accuracy || 0),
        bestWpm: aggregates._max.wpm || 0,
        bestAccuracy: aggregates._max.accuracy || 0,
        totalTests: aggregates._count._all,
        recentTests,
      },
      period: `Last ${daysNum} days`,
    });
  } catch (error) {
    next(error);
  }
};
