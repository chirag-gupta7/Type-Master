/**
 * API Client for TypeMaster Backend
 * Handles all HTTP requests to the backend API
 */

import { getSession } from 'next-auth/react';
import { getCache, setCache, invalidateCache, clearCache, DEFAULT_CACHE_TTL } from './cache';

// Prefer explicit public API URL; fall back to the current origin so Vercel deployments
// don't accidentally point to localhost.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const API_VERSION = 'v1';

interface FetchOptions extends RequestInit {
  cacheKey?: string;
  cacheTtl?: number;
  skipCache?: boolean;
}

const sanitizeToken = (token?: string | null): string | null => {
  if (!token) return null;
  return token.trim();
};

const base64UrlDecode = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const input = normalized + padding;

  if (typeof window === 'undefined') {
    return Buffer.from(input, 'base64').toString('utf-8');
  }

  if (typeof window.atob === 'function') {
    return window.atob(input);
  }

  return Buffer.from(input, 'base64').toString('utf-8');
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const segments = token.split('.');
    if (segments.length !== 3) return null;
    const payload = base64UrlDecode(segments[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isBackendJwt = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  return Boolean(
    payload && typeof payload.userId === 'string' && typeof payload.email === 'string'
  );
};

const isJwtExpired = (token: string, skewSeconds = 30): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - skewSeconds <= now;
};

const persistBackendToken = (token?: string | null) => {
  const cleaned = sanitizeToken(token);
  if (typeof window === 'undefined' || !cleaned) {
    return;
  }
  localStorage.setItem('accessToken', cleaned);
};

type TokenRequestPayload = {
  email?: string | null;
  name?: string | null;
  username?: string | null;
  image?: string | null;
};

const normalizeEmail = (email?: string | null): string | null => {
  if (!email) {
    return null;
  }
  const trimmed = email.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

const requestBackendToken = async (payload: TokenRequestPayload): Promise<string | null> => {
  const normalizedEmail = normalizeEmail(payload.email);

  console.log('[API] Requesting backend token for:', {
    email: normalizedEmail,
    hasUsername: !!payload.username,
  });

  if (!normalizedEmail) {
    console.error('[API] Cannot request token: no email provided');
    return null;
  }

  try {
    const requestBody = {
      email: normalizedEmail,
      name: payload.name ?? null,
      username: payload.username ?? null,
      image: payload.image ?? null,
    };
    console.log('[API] Token request payload:', requestBody);

    const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] Token request response:', response.status, response.statusText);

    if (response.ok) {
      const data = (await response.json()) as { accessToken?: string };
      const token = sanitizeToken(data.accessToken);
      if (token && isBackendJwt(token)) {
        console.log('[API] Received valid backend JWT token');
        persistBackendToken(token);
        return token;
      } else {
        console.error('[API] Token response invalid:', {
          hasToken: !!token,
          isBackendJwt: token ? isBackendJwt(token) : false,
        });
      }
    } else {
      const errorText = await response.text();
      console.error('[API] Token request failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('[API] Failed to fetch backend token:', error);
  }

  return null;
};

const getAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  let session = null;

  try {
    session = await getSession();
    console.log('[API] Session retrieved:', {
      hasUser: !!session?.user,
      email: session?.user?.email,
      hasAccessToken: !!session?.accessToken,
      hasBackendAccessToken: !!(session as any)?.backendAccessToken,
    });
  } catch (error) {
    console.error('[API] Failed to get session:', error);
  }

  const candidates = [
    sanitizeToken((session as any)?.backendAccessToken),
    sanitizeToken(session?.accessToken),
    sanitizeToken(localStorage.getItem('accessToken')),
  ];

  console.log('[API] Checking token candidates:', {
    backendAccessToken: candidates[0] ? 'present' : 'missing',
    sessionAccessToken: candidates[1] ? 'present' : 'missing',
    localStorageToken: candidates[2] ? 'present' : 'missing',
  });

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate) {
      const isValid = isBackendJwt(candidate);
      const isExpired = isJwtExpired(candidate);
      console.log(`[API] Candidate ${i}: valid=${isValid}, expired=${isExpired}`);

      if (isValid && !isExpired) {
        console.log('[API] Using valid token from candidate', i);
        persistBackendToken(candidate);
        return candidate;
      }
    }
  }

  console.log('[API] No valid token found, requesting new token from backend');
  const refreshedToken = await requestBackendToken({
    email: session?.user?.email ?? null,
    name: session?.user?.name ?? null,
    username: (session?.user as any)?.username ?? null,
    image: session?.user?.image ?? null,
  });

  if (refreshedToken) {
    console.log('[API] Successfully obtained new backend token');
    return refreshedToken;
  }

  console.error('[API] Failed to obtain any valid token');
  return null;
}; /**
 * Generate a backend JWT token by calling the backend auth endpoint
 * This is a temporary solution to integrate NextAuth with the Express backend
 */
/**
 * Get authentication token from NextAuth session or localStorage
 */ /**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { cacheKey, cacheTtl, skipCache, ...requestInit } = options;

  console.log(`[API] Fetching ${endpoint}`);
  const token = await getAuthToken();
  console.log(`[API] Token for ${endpoint}:`, token ? 'present' : 'MISSING');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(requestInit.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const method = (requestInit.method || 'GET').toUpperCase();
  const effectiveCacheKey = method === 'GET' && !skipCache ? (cacheKey ?? endpoint) : undefined;

  if (effectiveCacheKey) {
    const cached = getCache<T>(effectiveCacheKey);
    if (cached) {
      console.log(`[API] Returning cached data for ${endpoint}`);
      return cached;
    }
  }

  const url = `${API_BASE_URL}/api/${API_VERSION}${endpoint}`;
  console.log(`[API] Making request to: ${url}`);

  const response = await fetch(url, {
    ...requestInit,
    headers,
  });

  console.log(`[API] Response from ${endpoint}:`, response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred',
    }));
    console.error(`[API] Request failed for ${endpoint}:`, error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as T;
  console.log(`[API] Data received from ${endpoint}:`, data);

  if (effectiveCacheKey) {
    setCache(effectiveCacheKey, data, cacheTtl ?? DEFAULT_CACHE_TTL);
  }

  return data;
}

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data: { email: string; username: string; password: string }) => {
    const response = await fetchAPI<{
      message: string;
      user: {
        id: string;
        email: string;
        username: string;
        createdAt: string;
      };
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store tokens
    if (typeof window !== 'undefined') {
      persistBackendToken(response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  },

  /**
   * Login user
   */
  login: async (data: { email: string; password: string }) => {
    const response = await fetchAPI<{
      message: string;
      user: {
        id: string;
        email: string;
        username: string;
      };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store tokens
    if (typeof window !== 'undefined') {
      persistBackendToken(response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  },

  /**
   * Logout user
   */
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    clearCache();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;

    const cookieHasToken = document.cookie
      .split('; ')
      .some((cookie) => cookie.startsWith('backend_jwt='));
    const storedToken = localStorage.getItem('accessToken');

    return Boolean(storedToken || cookieHasToken);
  },
};

/**
 * Test API
 */
export const testAPI = {
  /**
   * Fetch a new test paragraph
   * Note: This endpoint doesn't exist in the backend yet
   * For now, we'll use a client-side text generator
   */
  getTest: async (duration: 30 | 60 | 180): Promise<{ text: string }> => {
    // TODO: Replace with actual API call when backend endpoint is ready
    // For now, return sample text based on duration
    const sampleTexts = {
      30: 'The quick brown fox jumps over the lazy dog. Technology advances rapidly in our modern world.',
      60: 'The quick brown fox jumps over the lazy dog. Technology advances rapidly in our modern world. Programming requires patience and practice. Every developer faces challenges daily. Learning never stops in this field. Code quality matters for maintainability.',
      180: 'The quick brown fox jumps over the lazy dog. Technology advances rapidly in our modern world. Programming requires patience and practice. Every developer faces challenges daily. Learning never stops in this field. Code quality matters for maintainability. Software engineering combines creativity with logic. Debugging teaches valuable problem-solving skills. Collaboration makes teams stronger and more efficient. Open source projects benefit the entire community. Testing ensures reliability and prevents bugs. Documentation helps others understand your work. Version control tracks changes over time. Continuous learning keeps skills sharp and relevant.',
    };

    return Promise.resolve({ text: sampleTexts[duration] });
  },

  /**
   * Save test result to backend
   */
  saveTestResult: async (payload: {
    wpm: number;
    accuracy: number;
    rawWpm: number;
    errors: number;
    duration: 30 | 60 | 180;
    mode?: 'WORDS' | 'TIME' | 'QUOTE';
  }) => {
    return fetchAPI<{
      message: string;
      testResult: {
        id: string;
        userId: string;
        wpm: number;
        accuracy: number;
        rawWpm: number;
        errors: number;
        duration: number;
        mode: string;
        createdAt: string;
      };
    }>('/tests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch user statistics
   */
  getUserStats: async (params?: { duration?: 30 | 60 | 180; days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.duration) queryParams.append('duration', params.duration.toString());
    if (params?.days) queryParams.append('days', params.days.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';

    return fetchAPI<{
      stats: {
        averageWpm: number;
        averageAccuracy: number;
        bestWpm: number;
        bestAccuracy: number;
        totalTests: number;
        recentTests: Array<{
          wpm: number;
          accuracy: number;
          createdAt: string;
        }>;
      };
      period: string;
    }>(`/tests/stats${query}`);
  },

  /**
   * Fetch paginated test history
   */
  getTestHistory: async (page = 1, limit = 20, duration?: 30 | 60 | 180) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (duration) {
      queryParams.append('duration', duration.toString());
    }

    return fetchAPI<{
      tests: Array<{
        id: string;
        wpm: number;
        accuracy: number;
        rawWpm: number;
        errors: number;
        duration: number;
        mode: string;
        createdAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/tests?${queryParams.toString()}`);
  },
};

/**
 * User API
 */
export const userAPI = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    return fetchAPI<{
      user: {
        id: string;
        email: string;
        username: string;
        image: string | null;
        createdAt: string;
        updatedAt: string;
        _count: {
          testResults: number;
        };
      };
    }>('/users/profile');
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (data: { username?: string; image?: string }) => {
    return fetchAPI<{
      message: string;
      user: {
        id: string;
        email: string;
        username: string;
        image: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Lesson API
 */
export const lessonAPI = {
  /**
   * Get learning dashboard with sections, lessons, and progress
   */
  getLearningDashboard: async () => {
    return fetchAPI<
      Array<{
        id: number;
        title: string;
        order: number;
        lessons: Array<{
          id: string;
          level: number;
          order: number;
          title: string;
          description: string;
          keys: string[];
          difficulty: string;
          targetWpm: number;
          minAccuracy: number;
          exerciseType: string;
          content: string;
          section: number;
          isCheckpoint: boolean;
          userProgress: Array<{
            id: string;
            completed: boolean;
            bestWpm: number;
            bestAccuracy: number;
            stars: number;
            attempts: number;
          }>;
        }>;
      }>
    >('/lessons/dashboard', {
      cacheKey: 'lessons:dashboard',
      cacheTtl: DEFAULT_CACHE_TTL,
    });
  },

  /**
   * Get all lessons with user progress
   */
  getAllLessons: async () => {
    const cacheKey = 'lessons:all';
    return fetchAPI<{
      lessons: Array<{
        id: string;
        level: number;
        order: number;
        title: string;
        description: string;
        keys: string[];
        difficulty: string;
        targetWpm: number;
        minAccuracy: number;
        exerciseType: string;
        content: string;
        section: number;
        isCheckpoint: boolean;
        userProgress?: Array<{
          completed: boolean;
          bestWpm: number;
          bestAccuracy: number;
          stars: number;
          attempts: number;
        }>;
      }>;
    }>('/lessons', { cacheKey, cacheTtl: DEFAULT_CACHE_TTL });
  },

  /**
   * Get single lesson by ID
   */
  getLessonById: async (id: string) => {
    const cacheKey = `lessons:detail:${id}`;
    return fetchAPI<{
      lesson: {
        id: string;
        level: number;
        order: number;
        title: string;
        description: string;
        keys: string[];
        difficulty: string;
        targetWpm: number;
        minAccuracy: number;
        exerciseType: string;
        content: string;
        userProgress?: Array<{
          completed: boolean;
          bestWpm: number;
          bestAccuracy: number;
          stars: number;
          attempts: number;
        }>;
      };
    }>(`/lessons/${id}`, { cacheKey, cacheTtl: DEFAULT_CACHE_TTL });
  },

  /**
   * Save lesson progress
   */
  saveLessonProgress: async (data: {
    lessonId: string;
    wpm: number;
    accuracy: number;
    completed: boolean;
  }) => {
    const response = await fetchAPI<{
      message: string;
      progress: {
        id: string;
        completed: boolean;
        bestWpm: number;
        bestAccuracy: number;
        stars: number;
        attempts: number;
      };
    }>('/lessons/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Invalidate all relevant caches so dashboard reflects new progress
    invalidateCache('lessons:all');
    invalidateCache('lessons:dashboard');
    invalidateCache(`lessons:detail:${data.lessonId}`);
    invalidateCache('lessons:stats');
    invalidateCache('lessons:progress');

    console.log('[API] Invalidated lesson caches after progress save');

    return response;
  },

  /**
   * Get user's learning statistics
   */
  getLearningStats: async () => {
    return fetchAPI<{
      stats: {
        totalLessons: number;
        completedLessons: number;
        completionPercentage: number;
        totalStars: number;
        maxStars: number;
        averageWpm: number;
        averageAccuracy: number;
      };
    }>('/lessons/progress/stats', { cacheKey: 'lessons:stats' });
  },

  /**
   * Get detailed progress data for visualizations
   */
  getProgressVisualization: async () => {
    return fetchAPI<{
      completionByLevel: Array<{
        level: string;
        name: string;
        percentage: number;
        completed: number;
        total: number;
        stars: number;
        maxStars: number;
      }>;
      wpmByLesson: Array<{
        lessonId: string;
        lessonTitle: string;
        level: number;
        data: Array<{
          date: string;
          wpm: number;
          accuracy: number;
        }>;
      }>;
      practiceFrequency: Array<{
        date: string;
        count: number;
      }>;
      skillTree: Array<{
        id: string;
        title: string;
        level: number;
        order: number;
        difficulty: string;
        targetWpm: number;
        completed: boolean;
        stars: number;
        bestWpm: number;
        attempts: number;
        locked: boolean;
        prerequisites: string[];
      }>;
    }>('/lessons/progress/visualization', {
      cacheKey: 'lessons:progress',
      cacheTtl: DEFAULT_CACHE_TTL,
    });
  },
};

/**
 * Mistake logging and analysis API
 */
export const mistakeAPI = {
  logMistakes: async (payload: {
    userId: string;
    lessonId: string;
    mistakes: Array<{ keyPressed: string; keyExpected: string; fingerUsed?: string }>;
  }) => {
    return fetchAPI<{ message: string; count: number }>('/mistakes/log', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getWeakKeyAnalysis: async (userId: string, limit = 5) => {
    return fetchAPI<{
      weakKeys: Array<{ key: string; errorCount: number; lastError?: string }>;
      fingerErrors: Array<{ finger: string; count: number }>;
      recentMistakes: Array<{ keyPressed: string; keyExpected: string; fingerUsed?: string }>;
      analysis: string;
    }>(`/mistakes/analysis/${userId}?limit=${limit}`);
  },

  getPracticeText: async (userId: string) => {
    return fetchAPI<{
      message: string;
      practiceText: string;
      instructions?: string;
      weakKeys?: string[];
    }>(`/mistakes/practice/${userId}`);
  },
};

/**
 * Achievement API
 */
export const achievementAPI = {
  /**
   * Get all achievements with user's unlock status
   */
  getAllAchievements: async () => {
    return fetchAPI<{
      achievements: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        points: number;
        requirement: string;
        unlocked: boolean;
        unlockedAt: string | null;
      }>;
      totalAchievements: number;
      unlockedCount: number;
      totalPoints: number;
      earnedPoints: number;
    }>('/achievements', { cacheKey: 'achievements:all', cacheTtl: DEFAULT_CACHE_TTL });
  },

  /**
   * Check and award new achievements
   */
  checkAchievements: async () => {
    const response = await fetchAPI<{
      message: string;
      newlyUnlocked: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        points: number;
        unlockedAt: string;
      }>;
      totalChecked: number;
    }>('/achievements/check', {
      method: 'POST',
    });

    invalidateCache('achievements:all');
    invalidateCache('achievements:stats');
    invalidateCache('achievements:progress');

    return response;
  },

  /**
   * Get achievement statistics
   */
  getAchievementStats: async () => {
    return fetchAPI<{
      stats: {
        totalAchievements: number;
        unlockedCount: number;
        lockedCount: number;
        completionPercentage: number;
        totalPoints: number;
        earnedPoints: number;
        pointsPercentage: number;
      };
      recentUnlocks: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        points: number;
        unlockedAt: string;
      }>;
    }>('/achievements/stats', { cacheKey: 'achievements:stats', cacheTtl: DEFAULT_CACHE_TTL });
  },

  /**
   * Get achievement progress for multi-step achievements
   */
  getAchievementProgress: async () => {
    return fetchAPI<{
      progress: {
        dedicated: number;
        committed: number;
        unstoppable: number;
        speedDemon: number;
        lightningFast: number;
        typingMaster: number;
        sharpshooter: number;
        student: number;
        scholar: number;
        graduateTypist: number;
        weekWarrior: number;
      };
      stats: {
        testCount: number;
        highAccuracyTests: number;
        completedLessons: number;
        totalLessons: number;
        bestWpm: number;
        uniqueDaysThisWeek: number;
      };
    }>('/achievements/progress', {
      cacheKey: 'achievements:progress',
      cacheTtl: DEFAULT_CACHE_TTL,
    });
  },
};

// Named export for convenience
export const getTest = testAPI.getTest;
