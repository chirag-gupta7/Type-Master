/**
 * Regression tests: the leaderboard page used to render a hardcoded mock
 * table ("SpeedDemon", "Your current rank: #247") while the real
 * GET /games/leaderboard endpoint sat unused. It now renders live data with
 * loading, error, and empty states.
 */

jest.mock('@/lib/api', () => ({
  gameAPI: {
    getLeaderboard: jest.fn(),
  },
}));

import { render, screen } from '@testing-library/react';
import { gameAPI } from '@/lib/api';
import LeaderboardPage from '../page';

describe('LeaderboardPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders entries returned by the real leaderboard API', async () => {
    (gameAPI.getLeaderboard as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        gameType: 'WORD_BLITZ',
        leaderboard: [
          {
            rank: 1,
            userId: 'u1',
            username: 'SpeedDemon',
            score: 1520,
            wpm: 152,
            accuracy: 99,
            duration: 60,
            createdAt: '2026-01-01T00:00:00Z',
          },
          {
            rank: 2,
            userId: 'u2',
            username: null,
            score: 800,
            wpm: null,
            accuracy: null,
            duration: null,
            createdAt: '2026-01-02T00:00:00Z',
          },
        ],
        total: 2,
      },
    });

    render(<LeaderboardPage />);

    expect(await screen.findByText('SpeedDemon')).toBeDefined();
    // Null username falls back instead of rendering nothing.
    expect(screen.getByText('Anonymous')).toBeDefined();
    // No fake "your rank" line anymore.
    expect(screen.queryByText(/current rank/i)).toBeNull();
    expect(gameAPI.getLeaderboard).toHaveBeenCalledWith('WORD_BLITZ');
  });

  it('shows an empty state when there are no scores', async () => {
    (gameAPI.getLeaderboard as jest.Mock).mockResolvedValue({
      success: true,
      data: { gameType: 'WORD_BLITZ', leaderboard: [], total: 0 },
    });

    render(<LeaderboardPage />);

    expect(
      await screen.findByText('No scores yet. Be the first to set a record!')
    ).toBeDefined();
  });

  it('shows an error state when the API call fails', async () => {
    (gameAPI.getLeaderboard as jest.Mock).mockRejectedValue(new Error('network down'));

    render(<LeaderboardPage />);

    expect(
      await screen.findByText('Could not load the leaderboard. Please try again later.')
    ).toBeDefined();
  });
});
