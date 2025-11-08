'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Check, Lock, Trophy, User, LogIn } from 'lucide-react';
import { HandPositionGuide } from '@/components/HandPositionGuide';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { lessonAPI } from '@/lib/api';
import { FALLBACK_LESSONS, Lesson, isExerciseType } from '@/lib/fallback-lessons';
import { getFallbackProgress } from '@/lib/fallbackProgress';

// Section names for displaying headers
const sectionNames: Record<number, string> = {
  1: '🏠 Foundation',
  2: '🔤 Letters',
  3: '🔢 Numbers & Symbols',
  4: '📝 Words & Sentences',
  5: '💻 Code Practice',
  6: '🚀 Programming',
};

// Helper function to determine section based on lesson level
const getLessonSection = (level: number): number => {
  if (level <= 2) return 1; // Foundation
  if (level <= 5) return 2; // Letters
  if (level <= 7) return 3; // Numbers & Symbols
  if (level <= 9) return 4; // Words & Sentences
  if (level <= 11) return 5; // Code Practice
  return 6; // Programming
};

export default function LearnPage() {
  const { data: session, status: sessionStatus } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? null;
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
    if (sessionStatus === 'loading') {
      return;
    }

    let isMounted = true;

    async function fetchData() {
      try {
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
        const isAuthenticated = sessionStatus === 'authenticated' || hasToken;

        if (!isAuthenticated) {
          if (isMounted) {
            setLessons(FALLBACK_LESSONS);
            setUsingFallback(true);
            setError('Sign in to sync your progress. Showing sample lessons for now.');
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
  }, [sessionStatus]);

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

      {/* Session-aware welcome card */}
      <div className="mb-8">
        {sessionStatus === 'authenticated' ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  Welcome back{userName ? `, ${userName}` : ''}!
                </h3>
                <p className="text-muted-foreground">
                  Pick up where you left off and keep your streak going.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Log in to sync your progress</h3>
                <p className="text-muted-foreground">
                  Sign in to save your lesson history and track achievements across devices.
                </p>
              </div>
            </div>
            <Link href="/login" className="w-full md:w-auto">
              <Button size="lg" className="w-full">
                Sign in
              </Button>
            </Link>
          </div>
        )}
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

      {/* Vertical Skill Tree Layout */}
      <TooltipProvider>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 via-primary/30 to-primary/20 -translate-x-1/2 rounded-full" />

            {/* Lesson nodes */}
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

              // Section header (display when section changes)
              const currentSection = getLessonSection(lesson.level);
              const previousSection = index > 0 ? getLessonSection(lessons[index - 1].level) : null;
              const showSectionHeader = index === 0 || currentSection !== previousSection;

              return (
                <div key={lesson.id} className="relative">
                  {/* Section Header */}
                  {showSectionHeader && (
                    <div className="flex justify-center mb-8 mt-12 first:mt-0">
                      <div className="bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 px-8 py-3 rounded-full border-2 border-primary/50 shadow-lg">
                        <h2 className="text-xl font-bold text-center flex items-center gap-2">
                          {sectionNames[currentSection] || `Section ${currentSection}`}
                        </h2>
                      </div>
                    </div>
                  )}

                  {/* Lesson Node */}
                  <div className="flex items-center justify-center mb-8">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={isUnlocked ? `/learn/${lesson.id}` : '#'}
                          className={`block ${!isUnlocked ? 'pointer-events-none' : ''}`}
                        >
                          <div
                            className={`
                              relative w-20 h-20 rounded-full flex items-center justify-center
                              transition-all duration-300 z-10
                              ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50 hover:scale-110'
                                  : isUnlocked
                                    ? 'bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/50 hover:scale-110'
                                    : 'bg-gray-300 dark:bg-gray-700 border-4 border-gray-400 dark:border-gray-600'
                              }
                            `}
                          >
                            {isCompleted ? (
                              <div className="flex flex-col items-center">
                                <Check className="w-8 h-8 text-white" strokeWidth={3} />
                                <Trophy className="w-4 h-4 text-yellow-300 -mt-1" />
                              </div>
                            ) : isUnlocked ? (
                              <span className="text-2xl font-bold text-white">{index + 1}</span>
                            ) : (
                              <Lock className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm p-4">
                        <div>
                          <h3 className="font-bold text-lg mb-2">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>
                          {(progress || fallbackStats) && (
                            <div className="text-xs text-muted-foreground border-t pt-2">
                              <div className="flex justify-between">
                                <span>Best WPM:</span>
                                <span className="font-semibold">{Math.round(bestWpm ?? 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Best Accuracy:</span>
                                <span className="font-semibold">
                                  {Math.round(bestAccuracy ?? 0)}%
                                </span>
                              </div>
                            </div>
                          )}
                          {!isUnlocked && (
                            <div className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Complete previous lesson to unlock
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TooltipProvider>

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
