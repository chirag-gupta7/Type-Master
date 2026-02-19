import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  startAssessment,
  completeAssessment,
  getLatestAssessment,
} from '../controllers/assessment.controller';

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/v1/assessment/start - Start placement test
 * Optional auth (saves to user if logged in)
 */
router.post('/start', startAssessment);

/**
 * POST /api/v1/assessment/complete - Submit assessment results
 * Optional auth (saves to user if logged in)
 */
router.post('/complete', completeAssessment);

/**
 * GET /api/v1/assessment/latest/:userId - Get latest assessment
 * Optional auth (public for viewing, but validates user if authenticated)
 */
router.get('/latest/:userId', getLatestAssessment);

export default router;
