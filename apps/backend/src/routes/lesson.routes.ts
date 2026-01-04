import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import {
  getAllLessons,
  getLessonById,
  saveLessonProgress,
  getLearningStats,
  getProgressVisualization,
  getLessonsBySection,
  getCheckpointLessons,
  getRecommendedLesson,
  getLearningDashboard,
} from '../controllers/lesson.controller';

const router = Router();

// Public routes (show progress if authenticated, but don't require auth)
router.get('/', optionalAuthenticate, getAllLessons);
router.get('/checkpoints', optionalAuthenticate, getCheckpointLessons);
router.get('/section/:sectionId', optionalAuthenticate, getLessonsBySection);

// Protected routes (require authentication)
router.get('/dashboard', authenticate, getLearningDashboard);
router.get('/recommended/next', authenticate, getRecommendedLesson);
router.post('/progress', authenticate, saveLessonProgress);
router.get('/progress/stats', authenticate, getLearningStats);
router.get('/progress/visualization', authenticate, getProgressVisualization);

// Dynamic routes must come last so they don't swallow the static ones above
router.get('/:id', optionalAuthenticate, getLessonById);

export default router;
