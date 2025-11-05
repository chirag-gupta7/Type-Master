/**
 * Achievement Routes
 * Routes for achievement system
 */

import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import {
  getAllAchievements,
  checkAndAwardAchievements,
  getAchievementStats,
  getAchievementProgress,
} from '../controllers/achievement.controller';

const router = Router();

/**
 * GET /api/v1/achievements
 * Get all achievements with user's unlock status
 * Optional authentication (shows unlock status if authenticated)
 */
router.get('/', optionalAuthenticate, getAllAchievements);

/**
 * POST /api/v1/achievements/check
 * Check and award new achievements for authenticated user
 * Requires authentication
 */
router.post('/check', authenticate, checkAndAwardAchievements);

/**
 * GET /api/v1/achievements/stats
 * Get achievement statistics for authenticated user
 * Requires authentication
 */
router.get('/stats', authenticate, getAchievementStats);

/**
 * GET /api/v1/achievements/progress
 * Get progress tracking for multi-step achievements
 * Requires authentication
 */
router.get('/progress', authenticate, getAchievementProgress);

export default router;
