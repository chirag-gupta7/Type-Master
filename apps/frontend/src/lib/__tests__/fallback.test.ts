import { FALLBACK_LESSONS, isExerciseType } from '../fallback-lessons';
import { getFallbackProgress, saveFallbackLessonProgress } from '../fallbackProgress';

describe('fallback-lessons', () => {
  it('ships a non-empty lesson list with unique ids', () => {
    expect(FALLBACK_LESSONS.length).toBeGreaterThan(0);
    const ids = FALLBACK_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every lesson has required fields with sane values', () => {
    for (const l of FALLBACK_LESSONS) {
      expect(l.id.length).toBeGreaterThan(0);
      expect(l.title.length).toBeGreaterThan(0);
      expect(l.description.length).toBeGreaterThan(0);
      expect(l.targetWpm).toBeGreaterThan(0);
      expect(l.minAccuracy).toBeGreaterThan(0);
      expect(l.minAccuracy).toBeLessThanOrEqual(100);
      expect(l.content!.length).toBeGreaterThan(0);
      expect(Array.isArray(l.userProgress)).toBe(true);
    }
  });

  it('exerciseType values are valid when present', () => {
    for (const l of FALLBACK_LESSONS) {
      if (l.exerciseType !== undefined) {
        expect(isExerciseType(l.exerciseType)).toBe(true);
      }
    }
  });

  describe('isExerciseType', () => {
    it('accepts guided and timed', () => {
      expect(isExerciseType('guided')).toBe(true);
      expect(isExerciseType('timed')).toBe(true);
    });

    it('rejects everything else', () => {
      for (const v of [null, undefined, '', 'GUIDED', 'quiz', 0, {}, []] as unknown[]) {
        expect(isExerciseType(v)).toBe(false);
      }
    });
  });
});

describe('fallbackProgress (localStorage)', () => {
  const KEY = 'typemaster_fallback_progress';

  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('returns default progress when storage is empty', () => {
    expect(getFallbackProgress()).toEqual({ completedLessonIds: [], stats: {} });
  });

  it('returns default progress on corrupted JSON', () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    window.localStorage.setItem(KEY, '{not-json');
    expect(getFallbackProgress()).toEqual({ completedLessonIds: [], stats: {} });
    expect(err).toHaveBeenCalled();
  });

  it('ignores stars <= 0 (no persistence)', () => {
    saveFallbackLessonProgress('l1', { wpm: 50, accuracy: 99, stars: 0 });
    expect(window.localStorage.getItem(KEY)).toBeNull();
    saveFallbackLessonProgress('l1', { wpm: 50, accuracy: 99, stars: -1 });
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('saves progress and marks lesson completed without duplicates', () => {
    saveFallbackLessonProgress('l1', { wpm: 40, accuracy: 95, stars: 2 });
    saveFallbackLessonProgress('l1', { wpm: 30, accuracy: 90, stars: 1 });
    const p = getFallbackProgress();
    expect(p.completedLessonIds).toEqual(['l1']);
    // best values win (max)
    expect(p.stats['l1']).toEqual({ bestWpm: 40, bestAccuracy: 95, stars: 2 });
  });

  it('keeps max across repeated saves and tracks multiple lessons', () => {
    saveFallbackLessonProgress('a', { wpm: 20, accuracy: 90, stars: 1 });
    saveFallbackLessonProgress('b', { wpm: 60, accuracy: 98, stars: 3 });
    saveFallbackLessonProgress('a', { wpm: 50, accuracy: 99, stars: 2 });
    const p = getFallbackProgress();
    expect(p.completedLessonIds.sort()).toEqual(['a', 'b']);
    expect(p.stats['a']).toEqual({ bestWpm: 50, bestAccuracy: 99, stars: 2 });
  });

  it('dispatches an update event on write', () => {
    const listener = jest.fn();
    window.addEventListener('typemaster:fallback-progress-updated', listener);
    saveFallbackLessonProgress('l9', { wpm: 25, accuracy: 93, stars: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('typemaster:fallback-progress-updated', listener);
  });
});
