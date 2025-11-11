'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { lessonAPI } from '@/lib/api';
import { FALLBACK_LESSONS, Lesson, isExerciseType } from '@/lib/fallback-lessons';
import { getFallbackProgress } from '@/lib/fallbackProgress';

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [fallbackProgress, setFallbackProgress] = useState<{
    completedLessonIds: string[];
    stats: Record<
      string,
      {
        bestWpm: number;
        bestAccuracy: number;
        stars: number;
      }
    >;
  }>({ completedLessonIds: [], stats: {} });

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

        if (!hasToken) {
          if (isMounted) {
            setLessons(FALLBACK_LESSONS);
            setUsingFallback(true);
          }
          return;
        }

        const lessonsData = await lessonAPI.getAllLessons();

        const normalizedLessons: Lesson[] = (lessonsData?.lessons ?? []).map((lesson) => {
          const exerciseType = isExerciseType(lesson.exerciseType)
            ? lesson.exerciseType
            : undefined;

          return {
            ...lesson,
            exerciseType,
          };
        });

        if (isMounted) {
          setLessons(normalizedLessons);
          setUsingFallback(false);
        }
      } catch (err) {
        console.error('Failed to load lessons:', err);

        if (isMounted) {
          setLessons(FALLBACK_LESSONS);
          setUsingFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loadFallbackProgress = () => {
      setFallbackProgress(getFallbackProgress());
    };

    if (usingFallback) {
      loadFallbackProgress();
      window.addEventListener('typemaster:fallback-progress-updated', loadFallbackProgress);
      return () => {
        window.removeEventListener('typemaster:fallback-progress-updated', loadFallbackProgress);
      };
    }

    setFallbackProgress({ completedLessonIds: [], stats: {} });
    return undefined;
  }, [usingFallback]);

  const getLessonState = (lesson: Lesson) => {
    const progress = lesson.userProgress?.[0];
    const fallbackStats = fallbackProgress.stats[lesson.id];
    const isCompleted = usingFallback
      ? fallbackProgress.completedLessonIds.includes(lesson.id)
      : Boolean(progress?.completed);
    const bestWpm = usingFallback ? fallbackStats?.bestWpm : progress?.bestWpm;
    const bestAccuracy = usingFallback ? fallbackStats?.bestAccuracy : progress?.bestAccuracy;

    return {
      isCompleted,
      bestWpm,
      bestAccuracy,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Lessons</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lessons.map((lesson, index) => {
          const { isCompleted, bestWpm, bestAccuracy } = getLessonState(lesson);

          return (
            <Link
              key={lesson.id}
              href={`/learn/${lesson.id}`}
              className="group relative block overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/50"
            >
              <div className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lesson {index + 1}
                  </span>
                  {isCompleted && <Check className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <span>Target: {lesson.targetWpm} WPM</span>
                  <span>Min: {lesson.minAccuracy}%</span>
                </div>
                {isCompleted && bestWpm && bestAccuracy && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="font-medium">{Math.round(bestWpm)} WPM</span>
                    <span className="font-medium">{Math.round(bestAccuracy)}%</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {lessons.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No lessons available.</p>
        </div>
      )}
    </div>
  );
}
