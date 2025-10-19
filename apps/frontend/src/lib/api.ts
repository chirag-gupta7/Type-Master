/**
 * API Client for TypeMaster Backend
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_VERSION = 'v1';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'An error occurred',
    }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
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
      localStorage.setItem('accessToken', response.accessToken);
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
      localStorage.setItem('accessToken', response.accessToken);
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
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
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
  updateUserProfile: async (data: { username?: string }) => {
    return fetchAPI<{
      message: string;
      user: {
        id: string;
        email: string;
        username: string;
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
   * Get all lessons with user progress
   */
  getAllLessons: async () => {
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
        userProgress?: Array<{
          completed: boolean;
          bestWpm: number;
          bestAccuracy: number;
          stars: number;
          attempts: number;
        }>;
      }>;
    }>('/lessons');
  },

  /**
   * Get single lesson by ID
   */
  getLessonById: async (id: string) => {
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
    }>(`/lessons/${id}`);
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
    return fetchAPI<{
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
    }>('/lessons/progress/stats');
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
    }>('/lessons/progress/visualization');
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
    }>('/achievements');
  },

  /**
   * Check and award new achievements
   */
  checkAchievements: async () => {
    return fetchAPI<{
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
    }>('/achievements/stats');
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
    }>('/achievements/progress');
  },
};

// Named export for convenience
export const getTest = testAPI.getTest;
