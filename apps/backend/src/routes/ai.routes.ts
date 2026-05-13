import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTypingFeedback,
  generateWritingPrompt,
  getWritingFeedback,
  getStoryResponse,
  getAiFeedback,
  generateAiContent,
} from '../controllers/ai.controller';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Stricter rate limit for AI features to prevent cost/abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many AI requests, please wait a moment.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);
router.use(aiLimiter);

/**
 * POST /api/v1/ai/typing-feedback
 */
router.post('/typing-feedback', getTypingFeedback);

/**
 * GET /api/v1/ai/writing-prompt
 */
router.get('/writing-prompt', generateWritingPrompt);

/**
 * POST /api/v1/ai/writing-feedback
 */
router.post('/writing-feedback', getWritingFeedback);

/**
 * POST /api/v1/ai/story-response
 */
router.post('/story-response', getStoryResponse);

// Compatibility routes for main branch changes
router.post('/feedback', getAiFeedback);
router.post('/generate', generateAiContent);

export default router;
