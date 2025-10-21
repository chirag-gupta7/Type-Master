import { Router } from 'express';
import {
  saveGameScore,
  getLeaderboard,
  getUserHighScores,
  getUserGameHistory,
  getGameStats,
} from '../controllers/game.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/games/score
 * @desc    Save a game score
 * @access  Private
 */
router.post('/score', authenticate, saveGameScore);

/**
 * @route   GET /api/v1/games/leaderboard?gameType=WORD_BLITZ&limit=100
 * @desc    Get leaderboard for a specific game type
 * @access  Public
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @route   GET /api/v1/games/highscores
 * @desc    Get user's personal best scores for all game types
 * @access  Private
 */
router.get('/highscores', authenticate, getUserHighScores);

/**
 * @route   GET /api/v1/games/history?gameType=WORD_BLITZ&limit=50
 * @desc    Get user's game history (optionally filtered by game type)
 * @access  Private
 */
router.get('/history', authenticate, getUserGameHistory);

/**
 * @route   GET /api/v1/games/stats
 * @desc    Get user's game statistics (total games, best scores, averages)
 * @access  Private
 */
router.get('/stats', authenticate, getGameStats);

export default router;
