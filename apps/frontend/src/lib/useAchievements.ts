/**
 * Achievement Hooks
 * Custom hooks for managing achievement progress
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { achievementAPI } from '@/lib/api';
import { authAPI } from '@/lib/api';

export interface AchievementProgress {
  [key: string]: number;
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
