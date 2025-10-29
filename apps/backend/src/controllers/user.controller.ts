import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

// Validation schemas
const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional()
    .or(z.literal('')),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            testResults: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    // Validate input
    const data = updateProfileSchema.parse(req.body);

    // Check if username is taken
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: {
            id: req.user.userId,
          },
        },
      });

      if (existingUser) {
        throw new AppError(409, 'Username already taken');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        username: data.username,
        image: data.image,
      },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('User profile updated', { userId: user.id });

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};
