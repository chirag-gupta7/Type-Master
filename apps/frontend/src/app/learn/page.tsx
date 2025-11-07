'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Lock } from 'lucide-react';
import { HandPositionGuide } from '@/components/HandPositionGuide';
import { Button } from '@/components/ui/button';
import { lessonAPI } from '@/lib/api';
import { FALLBACK_LESSONS, Lesson, isExerciseType } from '@/lib/fallback-lessons';
import { getFallbackProgress } from '@/lib/fallbackProgress';

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
            setError("You're viewing the sample lesson plan. Sign in to sync your progress.");
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
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load lessons:', err);

        if (isMounted) {
          setLessons(FALLBACK_LESSONS);
          setUsingFallback(true);

          const message =
            err instanceof Error && err.message.includes('token')
              ? 'We could not verify your session. Showing offline lessons instead.'
              : 'We could not reach the learning service. Showing offline lessons instead.';
          setError(message);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading lessons...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Learn</h1>
      <p className="text-muted-foreground mb-8">
        Master touch typing from the ground up. Our lessons build on each other, from basic home row
        keys to complex sentences and symbols.
      </p>

      {/* Placement Test Call-to-Action */}
      <div className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">🚀 Already know how to type?</h3>
            <p className="text-muted-foreground">
              Take our placement test to find your skill level and skip the basics. We'll unlock the
              appropriate lessons based on your performance.
            </p>
          </div>
          <Link href="/learn/assessment">
            <Button size="lg" className="whitespace-nowrap">
              Take Placement Test →
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-900 dark:text-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Heads up</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2-column grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Lesson Progress Roadmap */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-6">Your Progress</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/30" />

            {/* Lesson nodes */}
            {lessons.map((lesson, index) => {
              const progress = lesson.userProgress?.[0];
              const previousLesson = lessons[index - 1];
              const previousCompleted =
                index === 0
                  ? true
                  : usingFallback
                    ? previousLesson
                      ? fallbackProgress.completedLessonIds.includes(previousLesson.id)
                      : false
                    : Boolean(previousLesson?.userProgress?.[0]?.completed);
              const isCompleted = usingFallback
                ? fallbackProgress.completedLessonIds.includes(lesson.id)
                : Boolean(progress?.completed);
              const isUnlocked = index === 0 ? true : previousCompleted || isCompleted;

              return (
                <div key={lesson.id} className="flex items-center gap-4 mb-4 relative">
                  {/* Node */}
                  {isUnlocked ? (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                      {isCompleted ? (
                        <Check size={16} />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-primary/50 flex items-center justify-center bg-background z-10">
                      <Lock size={16} className="text-muted-foreground" />
                    </div>
                  )}

                  {/* Lesson title */}
                  <span className={`font-medium ${!isUnlocked ? 'text-muted-foreground' : ''}`}>
                    {lesson.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: All Lessons */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-6">All Lessons</h2>
          <div className="space-y-4">
            {lessons.map((lesson, index) => {
              const progress = lesson.userProgress?.[0];
              const fallbackStats = fallbackProgress.stats[lesson.id];
              const previousLesson = lessons[index - 1];
              const previousCompleted =
                index === 0
                  ? true
                  : usingFallback
                    ? previousLesson
                      ? fallbackProgress.completedLessonIds.includes(previousLesson.id)
                      : false
                    : Boolean(previousLesson?.userProgress?.[0]?.completed);
              const isCompleted = usingFallback
                ? fallbackProgress.completedLessonIds.includes(lesson.id)
                : Boolean(progress?.completed);
              const isUnlocked = index === 0 ? true : previousCompleted || isCompleted;
              const bestWpm = usingFallback ? fallbackStats?.bestWpm : progress?.bestWpm;
              const bestAccuracy = usingFallback
                ? fallbackStats?.bestAccuracy
                : progress?.bestAccuracy;

              return (
                <Link
                  key={lesson.id}
                  href={isUnlocked ? `/learn/${lesson.id}` : '#'}
                  className={`block ${!isUnlocked ? 'pointer-events-none' : ''}`}
                >
                  <div
                    className={`flex items-center justify-between p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                      !isUnlocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* Left side: title and description */}
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">{lesson.description}</p>
                      {(progress || fallbackStats) && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Best: {Math.round(bestWpm ?? 0)} WPM • {Math.round(bestAccuracy ?? 0)}%
                          Accuracy
                        </div>
                      )}
                    </div>

                    {/* Right side: button */}
                    <div>
                      <Button disabled={!isUnlocked}>
                        {isCompleted ? 'Practice Again' : 'Start Lesson'}
                      </Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {lessons.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No lessons to show yet. Check back later or try refreshing.</p>
        </div>
      )}

      <div className="mt-12">
        <HandPositionGuide
          className="mx-auto max-w-3xl"
          compact
          showArrow={false}
          showKeyClusters
          showFingerLabels
        />
        {usingFallback && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Tip: Start the backend services and database, then refresh to see your live progress.
          </p>
        )}
      </div>
    </div>
  );
}
