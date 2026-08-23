/**
 * Regression tests for user-scoped response caching.
 *
 * Before the fix, fetchAPI cached responses under static keys (e.g.
 * 'lessons:dashboard') in sessionStorage, which survives logout/login within
 * the same tab. The real login flow uses NextAuth signIn directly and never
 * clears the cache, so account B could be served account A's cached data.
 */

jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

import { getSession } from 'next-auth/react';
import { fetchAPI, getCacheScopeFromToken } from '@/lib/api';

const makeBackendJwt = (userId: string): string => {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      email: `${userId}@example.com`,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64');
  return `header.${payload}.signature`;
};

describe('getCacheScopeFromToken', () => {
  it('scopes tokens to their userId and falls back to guest', () => {
    expect(getCacheScopeFromToken(makeBackendJwt('user-a'))).toBe('user:user-a');
    expect(getCacheScopeFromToken(null)).toBe('guest');
    expect(getCacheScopeFromToken('not-a-jwt')).toBe('guest');
  });

  it('produces different scopes for different users', () => {
    const scopeA = getCacheScopeFromToken(makeBackendJwt('user-a'));
    const scopeB = getCacheScopeFromToken(makeBackendJwt('user-b'));
    expect(scopeA).not.toBe(scopeB);
  });
});

describe('fetchAPI cache scoping', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    jest.resetAllMocks();
  });

  it('does not serve cached data from one user to another in the same tab', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ v: 'user-a-data' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ v: 'user-b-data' }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    (getSession as jest.Mock).mockResolvedValue({ accessToken: makeBackendJwt('user-a') });

    await expect(fetchAPI<{ v: string }>('/tests/stats')).resolves.toEqual({
      v: 'user-a-data',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Account switch: a different user signs in within the same tab/session.
    (getSession as jest.Mock).mockResolvedValue({ accessToken: makeBackendJwt('user-b') });

    // Must re-fetch instead of serving user-a's cached payload.
    await expect(fetchAPI<{ v: string }>('/tests/stats')).resolves.toEqual({
      v: 'user-b-data',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not serve guest-cached data to an authenticated user', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ v: 'guest-data' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ v: 'authed-data' }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(fetchAPI<{ v: string }>('/lessons')).resolves.toEqual({ v: 'guest-data' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    (getSession as jest.Mock).mockResolvedValue({ accessToken: makeBackendJwt('user-a') });

    await expect(fetchAPI<{ v: string }>('/lessons')).resolves.toEqual({ v: 'authed-data' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
