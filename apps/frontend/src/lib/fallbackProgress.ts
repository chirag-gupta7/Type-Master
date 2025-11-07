const STORAGE_KEY = 'typemaster_fallback_progress';

export type FallbackLessonStats = {
  bestWpm: number;
  bestAccuracy: number;
  stars: number;
};

export type FallbackProgress = {
  completedLessonIds: string[];
  stats: Record<string, FallbackLessonStats>;
};

const DEFAULT_PROGRESS: FallbackProgress = {
  completedLessonIds: [],
  stats: {},
};

const readFromStorage = (): FallbackProgress => {
  if (typeof window === 'undefined') {
    return DEFAULT_PROGRESS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(raw) as Partial<FallbackProgress>;
    return {
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      stats: parsed.stats ?? {},
    };
  } catch (error) {
    console.error('Failed to read fallback progress:', error);
    return DEFAULT_PROGRESS;
  }
};

const writeToStorage = (progress: FallbackProgress) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event('typemaster:fallback-progress-updated'));
  } catch (error) {
    console.error('Failed to write fallback progress:', error);
  }
};

export const getFallbackProgress = (): FallbackProgress => {
  return readFromStorage();
};

export const saveFallbackLessonProgress = (
  lessonId: string,
  stats: { wpm: number; accuracy: number; stars: number }
) => {
  if (stats.stars <= 0) {
    // Only persist completions that actually pass the lesson requirements
    return;
  }

  const progress = readFromStorage();
  const existing = progress.stats[lessonId];

  progress.stats[lessonId] = {
    bestWpm: existing ? Math.max(existing.bestWpm, stats.wpm) : stats.wpm,
    bestAccuracy: existing ? Math.max(existing.bestAccuracy, stats.accuracy) : stats.accuracy,
    stars: existing ? Math.max(existing.stars, stats.stars) : stats.stars,
  };

  if (!progress.completedLessonIds.includes(lessonId)) {
    progress.completedLessonIds.push(lessonId);
  }

  writeToStorage(progress);
};

export const clearFallbackProgress = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('typemaster:fallback-progress-updated'));
  } catch (error) {
    console.error('Failed to clear fallback progress:', error);
  }
};
