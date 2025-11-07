import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getTokenForNextAuthUser,
} from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rate-limiter';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/v1/auth/token
 * @desc    Get backend JWT token for NextAuth authenticated users
 * @access  Public
 */
router.post('/token', getTokenForNextAuthUser);

export default router;
