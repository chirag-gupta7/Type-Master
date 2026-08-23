/**
 * Regression test for the cache TTL unit bug: gameAPI.getStats and
 * getLeaderboard used to pass cacheTtl values of 60 and 30, which the cache
 * treats as milliseconds - so entries expired instantly and caching was
 * silently disabled. Numeric TTLs are milliseconds.
 */

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

import { getSession } from 'next-auth/react';
import { gameAPI } from '@/lib/api';

describe('gameAPI response caching TTL', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('serves repeated getStats calls from cache within a minute', async () => {
    jest.useFakeTimers();
    const t0 = new Date('2026-01-01T00:00:00Z').getTime();
    jest.setSystemTime(t0);

    (getSession as jest.Mock).mockResolvedValue(null);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { totalGamesPlayed: 0, gameStats: [] } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await gameAPI.getStats();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Five seconds later the entry must still be fresh (the buggy code used a
    // 60ms TTL, so this call would have re-fetched).
    jest.setSystemTime(t0 + 5_000);

    await gameAPI.getStats();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
