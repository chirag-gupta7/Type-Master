import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import {
  getAllLessons,
  getLessonById,
  saveLessonProgress,
  getLearningStats,
  getProgressVisualization,
} from '../controllers/lesson.controller';

const router = Router();

// Public routes (show progress if authenticated, but don't require auth)
router.get('/', optionalAuthenticate, getAllLessons);
router.get('/:id', optionalAuthenticate, getLessonById);

// Protected routes (require authentication)
router.post('/progress', authenticate, saveLessonProgress);
router.get('/progress/stats', authenticate, getLearningStats);
router.get('/progress/visualization', authenticate, getProgressVisualization);

export default router;
