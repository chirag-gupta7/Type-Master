import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  logMistakes,
  getWeakKeyAnalysis,
  generatePracticeText,
} from '../controllers/mistake.controller';

const router = express.Router();

// All mistake routes require authentication (user-specific data)
router.use(authenticate);

/**
 * POST /api/v1/mistakes/log - Log typing mistakes
 * @access Private
 */
router.post('/log', logMistakes);

/**
 * GET /api/v1/mistakes/analysis/:userId - Get weak key analysis
 * @access Private
 */
router.get('/analysis/:userId', getWeakKeyAnalysis);

/**
 * GET /api/v1/mistakes/practice/:userId - Generate practice text
 * @access Private
 */
router.get('/practice/:userId', generatePracticeText);

export default router;
