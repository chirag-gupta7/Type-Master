import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

// Validation schemas
const createTestResultSchema = z.object({
  wpm: z.number().min(0).max(300, 'WPM seems unrealistic'),
  accuracy: z.number().min(0).max(100, 'Accuracy must be between 0 and 100'),
  rawWpm: z.number().min(0),
  errors: z.number().int().min(0),
  duration: z.enum(['30', '60', '180']).transform(Number),
  mode: z.enum(['WORDS', 'TIME', 'QUOTE']).default('WORDS'),
});

/**
 * @route   POST /api/v1/tests
 * @desc    Create a new test result
 * @access  Private
 */
export const createTestResult = async (req: Request, res: Response, next: NextFunction) => {
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
export const getUserTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { page = '1', limit = '20', duration } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: req.user.userId,
      ...(duration && { duration: parseInt(duration as string, 10) }),
    };

    const [tests, total] = await Promise.all([
      prisma.testResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limitNum,
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
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
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
export const getTestById = async (req: Request, res: Response, next: NextFunction) => {
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
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { duration, days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const where = {
      userId: req.user.userId,
      createdAt: { gte: startDate },
      ...(duration && { duration: parseInt(duration as string, 10) }),
    };

    // Optimization: Offload statistical calculations to the database using Prisma's 'aggregate'
    // and parallelize it with fetching recent tests using Promise.all.
    // This avoids fetching potentially thousands of records into memory just to calculate averages.
    const [aggregateResult, recentTests] = await Promise.all([
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

    const stats = {
      averageWpm: Math.round(aggregateResult._avg.wpm || 0),
      averageAccuracy: Math.round(aggregateResult._avg.accuracy || 0),
      bestWpm: aggregateResult._max.wpm || 0,
      bestAccuracy: aggregateResult._max.accuracy || 0,
      totalTests: aggregateResult._count._all,
      recentTests,
    };

    res.json({
      stats,
      period: `Last ${daysNum} days`,
    });
  } catch (error) {
    next(error);
  }
};
