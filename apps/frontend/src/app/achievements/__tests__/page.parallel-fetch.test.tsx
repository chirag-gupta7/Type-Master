/**
 * The achievements page used to `await` its two independent API calls one after
 * the other, paying two sequential round-trips before it could render. These
 * tests pin that they are issued concurrently, and that the render output and
 * error handling are unchanged.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { achievementAPI } from '@/lib/api';
import { useAchievementProgress } from '@/lib/useAchievements';

import AchievementsPage from '../page';

// `mock`-prefixed so the hoisted jest.mock factory may close over it.
let mockAuthenticated = true;

jest.mock('@/lib/api', () => ({
  achievementAPI: {
    getAllAchievements: jest.fn(),
    getAchievementStats: jest.fn(),
    checkAchievements: jest.fn(),
  },
  authAPI: {
    isAuthenticated: () => mockAuthenticated,
  },
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));

jest.mock('@/lib/useAchievements', () => ({
  useAchievementProgress: jest.fn(),
}));

const mockApi = achievementAPI as unknown as {
  getAllAchievements: jest.Mock;
  getAchievementStats: jest.Mock;
  checkAchievements: jest.Mock;
};

const mockUseAchievementProgress = useAchievementProgress as jest.Mock;

const ALL_ACHIEVEMENTS = {
  achievements: [
    {
      id: 'a1',
      title: 'Speed Demon',
      description: 'Hit 100 WPM',
      icon: 'zap',
      points: 25,
      unlocked: true,
      unlockedAt: '2026-01-01T00:00:00.000Z',
      requirement: JSON.stringify({ type: 'speedDemon', wpm: 100 }),
    },
  ],
};

const STATS = {
  stats: {
    totalAchievements: 1,
    unlockedCount: 1,
    lockedCount: 0,
    completionPercentage: 100,
    totalPoints: 25,
    earnedPoints: 25,
    pointsPercentage: 100,
  },
  recentUnlocks: [],
};

/**
 * Leaves the list request permanently pending, so the stats request can only be
 * observed if the component issues it *before* the list resolves. Under
 * sequential `await`s the stats call never happens and this times out.
 */
const neverResolvingList = () => {
  mockApi.getAllAchievements.mockImplementation(() => new Promise(() => {}));
  mockApi.getAchievementStats.mockResolvedValue(STATS);
};

describe('AchievementsPage data loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticated = true;
    mockUseAchievementProgress.mockReturnValue({
      progress: {},
      stats: null,
      loading: false,
      refetch: jest.fn(),
    });
  });

  it('issues the list and stats requests concurrently', async () => {
    neverResolvingList();

    render(<AchievementsPage />);

    // The list request is still pending, so this can only pass if the stats
    // request was fired without waiting for it.
    await waitFor(() => expect(mockApi.getAchievementStats).toHaveBeenCalled());
    expect(mockApi.getAllAchievements).toHaveBeenCalled();
  });

  it('still renders unlocked achievements from the loaded data', async () => {
    mockApi.getAllAchievements.mockResolvedValue(ALL_ACHIEVEMENTS);
    mockApi.getAchievementStats.mockResolvedValue(STATS);

    render(<AchievementsPage />);

    expect(await screen.findByText('Speed Demon')).toBeInTheDocument();
    expect(mockApi.getAllAchievements).toHaveBeenCalled();
  });

  it('does not request stats for an unauthenticated visitor', async () => {
    mockAuthenticated = false;
    mockApi.getAllAchievements.mockResolvedValue(ALL_ACHIEVEMENTS);

    render(<AchievementsPage />);

    await waitFor(() => expect(mockApi.getAllAchievements).toHaveBeenCalled());
    expect(mockApi.getAchievementStats).not.toHaveBeenCalled();
  });

  it('still renders the list when only the stats request fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getAllAchievements.mockResolvedValue(ALL_ACHIEVEMENTS);
    mockApi.getAchievementStats.mockRejectedValue(new Error('401 expired token'));

    render(<AchievementsPage />);

    // Regression guard: Promise.all would reject here and render an empty page.
    expect(await screen.findByText('Speed Demon')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('surfaces a failed load without crashing the page', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockApi.getAllAchievements.mockRejectedValue(new Error('network down'));

    render(<AchievementsPage />);

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
