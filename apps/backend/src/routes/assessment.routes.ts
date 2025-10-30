import express from 'express';
import {
  startAssessment,
  completeAssessment,
  getLatestAssessment,
} from '../controllers/assessment.controller';

const router = express.Router();

// POST /api/v1/assessment/start - Start placement test
router.post('/start', startAssessment);

// POST /api/v1/assessment/complete - Submit assessment results
router.post('/complete', completeAssessment);

// GET /api/v1/assessment/latest/:userId - Get latest assessment
router.get('/latest/:userId', getLatestAssessment);

export default router;
