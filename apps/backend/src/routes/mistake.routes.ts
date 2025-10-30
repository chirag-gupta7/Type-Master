import express from 'express';
import {
  logMistakes,
  getWeakKeyAnalysis,
  generatePracticeText,
} from '../controllers/mistake.controller';

const router = express.Router();

// POST /api/v1/mistakes/log - Log typing mistakes
router.post('/log', logMistakes);

// GET /api/v1/mistakes/analysis/:userId - Get weak key analysis
router.get('/analysis/:userId', getWeakKeyAnalysis);

// GET /api/v1/mistakes/practice/:userId - Generate practice text
router.get('/practice/:userId', generatePracticeText);

export default router;
