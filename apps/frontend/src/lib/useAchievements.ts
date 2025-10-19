/**
 * Achievement Hooks
 * Custom hooks for managing achievements and notifications
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { achievementAPI } from '@/lib/api';
import { authAPI } from '@/lib/api';

export interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
}

export interface AchievementProgress {
  [key: string]: number;
}

/**
 * Hook for managing achievement notifications
 */
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const addNotification = useCallback((achievement: AchievementNotification) => {
    setNotifications((prev) => [...prev, achievement]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Check for new achievements and show notifications
   */
  const checkAchievements = useCallback(async () => {
    if (!authAPI.isAuthenticated()) {
      return [];
    }

    try {
      setIsChecking(true);
      const result = await achievementAPI.checkAchievements();

      if (result.newlyUnlocked.length > 0) {
        // Add each newly unlocked achievement as a notification
        result.newlyUnlocked.forEach((achievement) => {
          addNotification(achievement);
        });
      }

      return result.newlyUnlocked;
    } catch (error) {
      console.error('Failed to check achievements:', error);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    checkAchievements,
    isChecking,
  };
}

/**
 * Hook for tracking achievement progress
 */
export function useAchievementProgress() {
  const [progress, setProgress] = useState<AchievementProgress>({});
  const [stats, setStats] = useState<{
    testCount: number;
    highAccuracyTests: number;
    completedLessons: number;
    totalLessons: number;
    bestWpm: number;
    uniqueDaysThisWeek: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!authAPI.isAuthenticated()) {
      return;
    }

    try {
      setLoading(true);
      const data = await achievementAPI.getAchievementProgress();
      setProgress(data.progress);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch achievement progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    stats,
    loading,
    refetch: fetchProgress,
  };
}

/**
 * Hook for automatically checking achievements after actions
 */
export function useAchievementTracker() {
  const { checkAchievements, notifications, removeNotification } = useAchievementNotifications();

  /**
   * Track test completion
   */
  const trackTestCompletion = useCallback(
    async (testData: { wpm: number; accuracy: number; duration: number }) => {
      // eslint-disable-next-line no-console
      console.log('Test completed:', testData);
      // Check for achievements after a short delay
      setTimeout(() => {
        checkAchievements();
      }, 1000);
    },
    [checkAchievements]
  );

  /**
   * Track lesson completion
   */
  const trackLessonCompletion = useCallback(
    async (lessonData: { lessonId: string; wpm: number; accuracy: number; completed: boolean }) => {
      // eslint-disable-next-line no-console
      console.log('Lesson completed:', lessonData);
      // Check for achievements after a short delay
      setTimeout(() => {
        checkAchievements();
      }, 1000);
    },
    [checkAchievements]
  );

  /**
   * Track manual check (e.g., button click)
   */
  const trackManualCheck = useCallback(async () => {
    return await checkAchievements();
  }, [checkAchievements]);

  return {
    trackTestCompletion,
    trackLessonCompletion,
    trackManualCheck,
    notifications,
    removeNotification,
  };
}

export default {
  useAchievementNotifications,
  useAchievementProgress,
  useAchievementTracker,
};
