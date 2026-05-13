import { Router } from 'express';
import { getAiFeedback, generateAiContent } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Secure all AI routes - requires valid backend JWT
router.use(authenticate);

/**
 * @route   POST /api/v1/ai/feedback
 * @desc    Get AI feedback for typing performance or writing
 * @access  Private
 */
router.post('/feedback', getAiFeedback);

/**
 * @route   POST /api/v1/ai/generate
 * @desc    Generate AI content (e.g., writing prompts)
 * @access  Private
 */
router.post('/generate', generateAiContent);

export default router;
