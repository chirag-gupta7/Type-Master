import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createTestResult,
  getUserTests,
  getTestById,
  getUserStats,
} from '../controllers/test.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/tests
 * @desc    Create a new test result
 * @access  Private
 */
router.post('/', createTestResult);

/**
 * @route   GET /api/v1/tests
 * @desc    Get all tests for authenticated user
 * @access  Private
 */
router.get('/', getUserTests);

/**
 * @route   GET /api/v1/tests/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', getUserStats);

/**
 * @route   GET /api/v1/tests/:id
 * @desc    Get specific test by ID
 * @access  Private
 */
router.get('/:id', getTestById);

export default router;
