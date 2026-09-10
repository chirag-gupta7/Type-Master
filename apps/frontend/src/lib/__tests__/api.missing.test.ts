/**
 * Coverage for api.ts API groups + cache.ts primitives.
 * All network I/O is mocked; no real requests leave jsdom.
 */
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

import { getSession } from 'next-auth/react';
import {
  fetchAPI,
  getCacheScopeFromToken,
  authAPI,
  testAPI,
  userAPI,
  lessonAPI,
  mistakeAPI,
  achievementAPI,
  gameAPI,
  aiAPI,
} from '@/lib/api';
import {
  getCache,
  setCache,
  invalidateCache,
  invalidateCacheByPrefix,
  clearCache,
  DEFAULT_CACHE_TTL,
} from '@/lib/cache';

const mockedSession = getSession as jest.Mock;

const makeJwt = (userId: string, expOffsetSec = 3600): string => {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      email: `${userId}@example.com`,
      exp: Math.floor(Date.now() / 1000) + expOffsetSec,
    })
  ).toString('base64');
  return `header.${payload}.signature`;
};

const okJson = (data: unknown) => ({
  ok: true,
  json: async () => data,
});

const errJson = (status: number, body: unknown) => ({
  ok: false,
  status,
  json: async () => body,
});

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  jest.restoreAllMocks();
  mockedSession.mockReset();
  mockedSession.mockResolvedValue(null);
  global.fetch = jest.fn().mockResolvedValue(okJson({})) as unknown as typeof fetch;
});

const fetchMock = () => global.fetch as unknown as jest.Mock;
const lastCall = () =>
  fetchMock().mock.calls[fetchMock().mock.calls.length - 1] as [string, RequestInit & { headers?: Record<string, string> }];
const lastUrl = () => (lastCall()?.[0] ?? '') as string;
const lastInit = () => (lastCall()?.[1] ?? {}) as RequestInit & { headers?: Record<string, string> };

describe('getCacheScopeFromToken (edge cases)', () => {
  it('maps null / empty / malformed to guest', () => {
    expect(getCacheScopeFromToken(null)).toBe('guest');
    expect(getCacheScopeFromToken('')).toBe('guest');
    expect(getCacheScopeFromToken('not-a-jwt')).toBe('guest');
    expect(getCacheScopeFromToken('a.b')).toBe('guest');
  });

  it('maps token without userId to guest', () => {
    const payload = Buffer.from(JSON.stringify({ email: 'x@y.z' })).toString('base64');
    expect(getCacheScopeFromToken(`h.${payload}.s`)).toBe('guest');
  });

  it('maps empty-string userId to guest', () => {
    const payload = Buffer.from(
      JSON.stringify({ userId: '', email: 'x@y.z' })
    ).toString('base64');
    expect(getCacheScopeFromToken(`h.${payload}.s`)).toBe('guest');
  });

  it('scopes valid JWTs per user', () => {
    expect(getCacheScopeFromToken(makeJwt('u1'))).toBe('user:u1');
    expect(getCacheScopeFromToken(makeJwt('u2'))).not.toBe(getCacheScopeFromToken(makeJwt('u1')));
  });
});

describe('fetchAPI core', () => {
  it('GET caches: second identical call hits cache, no second fetch', async () => {
    fetchMock().mockResolvedValue(okJson({ v: 1 }));
    await expect(fetchAPI('/tests/stats')).resolves.toEqual({ v: 1 });
    await expect(fetchAPI('/tests/stats')).resolves.toEqual({ v: 1 });
    expect(fetchMock()).toHaveBeenCalledTimes(1);
  });

  it('skipCache bypasses the cache', async () => {
    fetchMock()
      .mockResolvedValueOnce(okJson({ v: 1 }))
      .mockResolvedValueOnce(okJson({ v: 2 }));
    await fetchAPI('/tests/stats');
    await expect(
      fetchAPI('/tests/stats', { skipCache: true })
    ).resolves.toEqual({ v: 2 });
    expect(fetchMock()).toHaveBeenCalledTimes(2);
  });

  it('POST is never served from cache', async () => {
    fetchMock()
      .mockResolvedValueOnce(okJson({ a: 1 }))
      .mockResolvedValueOnce(okJson({ a: 2 }));
    await fetchAPI('/tests', { method: 'POST', body: '{}' });
    await fetchAPI('/tests', { method: 'POST', body: '{}' });
    expect(fetchMock()).toHaveBeenCalledTimes(2);
  });

  it('throws backend error message on !ok', async () => {
    fetchMock().mockResolvedValue(errJson(400, { error: 'Boom' }));
    await expect(fetchAPI('/tests')).rejects.toThrow('Boom');
  });

  it('falls back to HTTP status when error body is missing/unparseable', async () => {
    fetchMock().mockResolvedValue(errJson(500, {}));
    await expect(fetchAPI('/tests')).rejects.toThrow('HTTP 500');
    fetchMock().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('bad json');
      },
    });
    await expect(fetchAPI('/tests', { skipCache: true })).rejects.toThrow();
  });

  it('sends Authorization header for a valid backend JWT', async () => {
    const token = makeJwt('u9');
    mockedSession.mockResolvedValue({ accessToken: token });
    fetchMock().mockResolvedValue(okJson({ ok: true }));
    await fetchAPI('/users/profile', { skipCache: true });
    expect(lastInit().headers?.['Authorization']).toBe(`Bearer ${token}`);
  });

  it('sends no Authorization header for guests', async () => {
    fetchMock().mockResolvedValue(okJson({ ok: true }));
    await fetchAPI('/users/profile', { skipCache: true });
    expect(lastInit().headers?.['Authorization']).toBeUndefined();
  });
});

describe('authAPI', () => {
  it('register POSTs, persists tokens, and returns payload', async () => {
    const payload = {
      message: 'ok',
      user: { id: '1', email: 'e@x.y', username: 'u', createdAt: 't' },
      accessToken: 'tok-a',
      refreshToken: 'ref-a',
    };
    fetchMock().mockResolvedValue(okJson(payload));
    await expect(
      authAPI.register({ email: 'e@x.y', username: 'u', password: 'p' })
    ).resolves.toEqual(payload);
    expect(lastUrl()).toContain('/api/v1/auth/register');
    expect(window.localStorage.getItem('accessToken')).toBe('tok-a');
    expect(window.localStorage.getItem('refreshToken')).toBe('ref-a');
  });

  it('login POSTs and persists tokens', async () => {
    const payload = {
      message: 'ok',
      user: { id: '1', email: 'e@x.y', username: 'u' },
      accessToken: 'tok-b',
      refreshToken: 'ref-b',
    };
    fetchMock().mockResolvedValue(okJson(payload));
    await authAPI.login({ email: 'e@x.y', password: 'p' });
    expect(lastUrl()).toContain('/api/v1/auth/login');
    expect(window.localStorage.getItem('accessToken')).toBe('tok-b');
  });

  it('logout clears tokens', () => {
    window.localStorage.setItem('accessToken', 'x');
    window.localStorage.setItem('refreshToken', 'y');
    authAPI.logout();
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('refreshToken')).toBeNull();
  });

  it('isAuthenticated reflects stored token', () => {
    expect(authAPI.isAuthenticated()).toBe(false);
    window.localStorage.setItem('accessToken', 'x');
    expect(authAPI.isAuthenticated()).toBe(true);
  });
});

describe('testAPI', () => {
  it('saveTestResult POSTs and auto-checks achievements', async () => {
    fetchMock()
      .mockResolvedValueOnce(okJson({ message: 'saved', testResult: { id: 't1' } }))
      .mockResolvedValueOnce(okJson({ message: 'checked', newlyUnlocked: [], totalChecked: 1 }));
    const res = await testAPI.saveTestResult({
      wpm: 60,
      accuracy: 97,
      rawWpm: 65,
      errors: 3,
      duration: 60,
    });
    expect((res as { message: string }).message).toBe('saved');
    expect(fetchMock()).toHaveBeenCalledTimes(2);
    expect(fetchMock().mock.calls[0]?.[0]).toContain('/api/v1/tests');
  });

  it('getUserStats builds query params', async () => {
    fetchMock().mockResolvedValue(okJson({ stats: {}, period: 'all' }));
    await testAPI.getUserStats({ duration: 60, days: 7 });
    expect(lastUrl()).toContain('/api/v1/tests/stats?');
    expect(lastUrl()).toContain('duration=60');
    expect(lastUrl()).toContain('days=7');
  });

  it('getUserStats omits query string when no params', async () => {
    fetchMock().mockResolvedValue(okJson({ stats: {}, period: 'all' }));
    await testAPI.getUserStats();
    expect(lastUrl()).toContain('/api/v1/tests/stats');
    expect(lastUrl().includes('?')).toBe(false);
  });

  it('getTestHistory paginates with optional duration', async () => {
    fetchMock().mockResolvedValue(okJson({ tests: [], pagination: {} }));
    await testAPI.getTestHistory(2, 10, 30);
    expect(lastUrl()).toContain('page=2');
    expect(lastUrl()).toContain('limit=10');
    expect(lastUrl()).toContain('duration=30');
  });
});

describe('userAPI', () => {
  it('getProfile GETs profile', async () => {
    fetchMock().mockResolvedValue(okJson({ user: { id: '1' } }));
    await userAPI.getProfile();
    expect(lastUrl()).toContain('/api/v1/users/profile');
  });

  it('updateUserProfile PUTs JSON body', async () => {
    fetchMock().mockResolvedValue(okJson({ message: 'ok', user: { id: '1' } }));
    await userAPI.updateUserProfile({ username: 'new' });
    expect(lastInit().method).toBe('PUT');
    expect(JSON.parse(lastInit().body as string)).toEqual({ username: 'new' });
  });
});

describe('lessonAPI', () => {
  it('getAllLessons hits /lessons', async () => {
    fetchMock().mockResolvedValue(okJson({ lessons: [] }));
    await lessonAPI.getAllLessons();
    expect(lastUrl()).toContain('/api/v1/lessons');
  });

  it('getLearningDashboard supports skipCache', async () => {
    fetchMock().mockResolvedValue(okJson([]));
    await lessonAPI.getLearningDashboard();
    expect(lastUrl()).toContain('/api/v1/lessons/dashboard');
    fetchMock().mockResolvedValue(okJson([]));
    await lessonAPI.getLearningDashboard({ skipCache: true });
    expect(fetchMock()).toHaveBeenCalledTimes(2);
  });

  it('getSectionSummaries encodes practiceType', async () => {
    fetchMock().mockResolvedValue(okJson({ practiceType: 'coding', sections: [] }));
    await lessonAPI.getSectionSummaries('coding');
    expect(lastUrl()).toContain('/api/v1/lessons/sections?');
    expect(lastUrl()).toContain('practiceType=coding');
  });

  it('getSectionPage encodes section/page/count', async () => {
    fetchMock().mockResolvedValue(okJson({ section: {}, pagination: {}, lessons: [] }));
    await lessonAPI.getSectionPage(3, 2, 5);
    expect(lastUrl()).toContain('/api/v1/lessons/section/3?');
    expect(lastUrl()).toContain('page=2');
  });

  it('getLessonById hits detail endpoint', async () => {
    fetchMock().mockResolvedValue(okJson({ lesson: { id: 'abc' } }));
    await lessonAPI.getLessonById('abc');
    expect(lastUrl()).toContain('/api/v1/lessons/abc');
  });

  it('saveLessonProgress POSTs progress', async () => {
    fetchMock()
      .mockResolvedValueOnce(okJson({ message: 'ok', progress: { id: 'p1' } }))
      .mockResolvedValue(okJson({}));
    await lessonAPI.saveLessonProgress({
      lessonId: 'l1',
      wpm: 40,
      accuracy: 95,
      completed: true,
    });
    expect(fetchMock().mock.calls[0]?.[0]).toContain('/api/v1/lessons/progress');
  });

  it('getLearningStats forwards AbortSignal', async () => {
    fetchMock().mockResolvedValue(okJson({ stats: {} }));
    const ctrl = new AbortController();
    await lessonAPI.getLearningStats({ signal: ctrl.signal });
    expect(lastUrl()).toContain('/api/v1/lessons/progress/stats');
    expect((lastInit() as { signal?: AbortSignal }).signal).toBe(ctrl.signal);
  });

  it('getProgressVisualization hits visualization endpoint', async () => {
    fetchMock().mockResolvedValue(okJson({}));
    await lessonAPI.getProgressVisualization();
    expect(lastUrl()).toContain('/api/v1/lessons/progress/visualization');
  });
});

describe('mistakeAPI', () => {
  it('logMistakes POSTs payload', async () => {
    fetchMock().mockResolvedValue(okJson({ message: 'ok', count: 2 }));
    await mistakeAPI.logMistakes({
      userId: 'u1',
      lessonId: 'l1',
      mistakes: [{ keyPressed: 'x', keyExpected: 'y' }],
    });
    expect(lastUrl()).toContain('/api/v1/mistakes/log');
    expect(lastInit().method).toBe('POST');
  });

  it('getWeakKeyAnalysis defaults limit to 5 and honors custom limit', async () => {
    fetchMock().mockResolvedValue(okJson({ weakKeys: [] }));
    await mistakeAPI.getWeakKeyAnalysis('u1');
    expect(lastUrl()).toContain('/api/v1/mistakes/analysis/u1?limit=5');
    fetchMock().mockResolvedValue(okJson({ weakKeys: [] }));
    await mistakeAPI.getWeakKeyAnalysis('u1', 10);
    expect(lastUrl()).toContain('limit=10');
  });

  it('getPracticeText hits practice endpoint', async () => {
    fetchMock().mockResolvedValue(okJson({ practiceText: 'abc' }));
    await mistakeAPI.getPracticeText('u1');
    expect(lastUrl()).toContain('/api/v1/mistakes/practice/u1');
  });
});

describe('achievementAPI', () => {
  it('getAllAchievements hits /achievements', async () => {
    fetchMock().mockResolvedValue(okJson({ achievements: [] }));
    await achievementAPI.getAllAchievements();
    expect(lastUrl()).toContain('/api/v1/achievements');
  });

  it('checkAchievements POSTs to /achievements/check', async () => {
    fetchMock().mockResolvedValue(okJson({ message: 'ok', newlyUnlocked: [], totalChecked: 0 }));
    await achievementAPI.checkAchievements();
    expect(lastUrl()).toContain('/api/v1/achievements/check');
    expect(lastInit().method).toBe('POST');
  });

  it('getAchievementStats + getAchievementProgress hit their endpoints', async () => {
    fetchMock().mockResolvedValue(okJson({ stats: {} }));
    await achievementAPI.getAchievementStats();
    expect(lastUrl()).toContain('/api/v1/achievements/stats');
    fetchMock().mockResolvedValue(okJson({ progress: {}, stats: {} }));
    await achievementAPI.getAchievementProgress();
    expect(lastUrl()).toContain('/api/v1/achievements/progress');
  });
});

describe('gameAPI', () => {
  it('saveScore POSTs without caching', async () => {
    fetchMock().mockResolvedValue(okJson({ success: true, data: {} }));
    await gameAPI.saveScore({ gameType: 'WORD_BLITZ', score: 100 });
    expect(lastUrl()).toContain('/api/v1/games/score');
    expect(lastInit().method).toBe('POST');
    // second call must re-fetch (skipCache)
    fetchMock().mockResolvedValue(okJson({ success: true, data: {} }));
    await gameAPI.saveScore({ gameType: 'WORD_BLITZ', score: 100 });
    expect(fetchMock()).toHaveBeenCalledTimes(2);
  });

  it('getStats + getLeaderboard hit their endpoints', async () => {
    fetchMock().mockResolvedValue(okJson({ success: true, data: {} }));
    await gameAPI.getStats();
    expect(lastUrl()).toContain('/api/v1/games/stats');
    fetchMock().mockResolvedValue(okJson({ success: true, data: {} }));
    await gameAPI.getLeaderboard('PROMPT_DASH');
    expect(lastUrl()).toContain('/api/v1/games/leaderboard');
    expect(lastUrl()).toContain('gameType=PROMPT_DASH');
  });
});

describe('aiAPI', () => {
  it('typing-feedback / writing-prompt / writing-feedback / story-response', async () => {
    fetchMock().mockResolvedValue(okJson({ feedback: 'nice' }));
    await aiAPI.getTypingFeedback({ wpm: 60, accuracy: 95, errors: 2, duration: 60 });
    expect(lastUrl()).toContain('/api/v1/ai/typing-feedback');

    fetchMock().mockResolvedValue(okJson({ prompt: 'write...' }));
    await aiAPI.generateWritingPrompt();
    expect(lastUrl()).toContain('/api/v1/ai/writing-prompt');

    fetchMock().mockResolvedValue(okJson({ feedback: 'good' }));
    await aiAPI.getWritingFeedback({ text: 'hello', type: 'prompt-dash' });
    expect(lastUrl()).toContain('/api/v1/ai/writing-feedback');

    fetchMock().mockResolvedValue(okJson({ response: 'once...' }));
    await aiAPI.getStoryResponse(['a', 'b']);
    expect(lastUrl()).toContain('/api/v1/ai/story-response');
    expect(JSON.parse(lastInit().body as string)).toEqual({ story: ['a', 'b'] });
  });
});

describe('cache.ts primitives', () => {
  it('round-trips values and exposes default TTL', () => {
    expect(DEFAULT_CACHE_TTL).toBe(5 * 60 * 1000);
    setCache('k1', { a: 1 });
    expect(getCache('k1')).toEqual({ a: 1 });
  });

  it('returns null for missing keys and honors TTL expiry', () => {
    expect(getCache('nope')).toBeNull();
    const now = Date.now();
    const spy = jest.spyOn(Date, 'now').mockReturnValue(now);
    setCache('exp', 'v', 1000);
    spy.mockReturnValue(now + 1001);
    expect(getCache('exp')).toBeNull();
  });

  it('returns null and evicts on corrupted JSON', () => {
    window.sessionStorage.setItem('typemaster:cache:bad', '{oops');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(getCache('bad')).toBeNull();
    expect(window.sessionStorage.getItem('typemaster:cache:bad')).toBeNull();
    warn.mockRestore();
  });

  it('invalidateCache removes a single key', () => {
    setCache('a', 1);
    setCache('b', 2);
    invalidateCache('a');
    expect(getCache('a')).toBeNull();
    expect(getCache('b')).toBe(2);
  });

  it('invalidateCacheByPrefix removes only matching keys', () => {
    setCache('lessons:1', 1);
    setCache('lessons:2', 2);
    setCache('games:1', 3);
    invalidateCacheByPrefix('lessons:');
    expect(getCache('lessons:1')).toBeNull();
    expect(getCache('lessons:2')).toBeNull();
    expect(getCache('games:1')).toBe(3);
  });

  it('clearCache removes only typemaster keys', () => {
    setCache('x', 1);
    window.sessionStorage.setItem('unrelated', 'keep');
    clearCache();
    expect(getCache('x')).toBeNull();
    expect(window.sessionStorage.getItem('unrelated')).toBe('keep');
    window.sessionStorage.removeItem('unrelated');
  });
});
