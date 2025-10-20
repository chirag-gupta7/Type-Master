'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Lock, Star } from 'lucide-react';
import { HandPositionGuide } from '@/components/HandPositionGuide';
import { lessonAPI } from '@/lib/api';
import {
  FALLBACK_LESSONS,
  Lesson,
  buildFallbackStats,
  isExerciseType,
} from '@/lib/fallback-lessons';

interface LearningStats {
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  totalStars: number;
  maxStars: number;
  averageWpm: number;
  averageAccuracy: number;
}

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

        if (!hasToken) {
          if (isMounted) {
            setLessons(FALLBACK_LESSONS);
            setStats(buildFallbackStats(FALLBACK_LESSONS.length));
            setUsingFallback(true);
            setError("You're viewing the sample lesson plan. Sign in to sync your progress.");
          }
          return;
        }

        const [lessonsData, statsData] = await Promise.all([
          lessonAPI.getAllLessons(),
          lessonAPI.getLearningStats(),
        ]);

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
          setStats(statsData?.stats ?? null);
          setUsingFallback(false);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load lessons:', err);

        if (isMounted) {
          setLessons(FALLBACK_LESSONS);
          setStats(buildFallbackStats(FALLBACK_LESSONS.length));
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

  // Hooks stay above conditional returns so React executes a consistent hook order.
  const lessonsByLevel = useMemo(() => {
    return lessons.reduce<Record<number, Lesson[]>>((acc, lesson) => {
      if (!acc[lesson.level]) {
        acc[lesson.level] = [];
      }
      acc[lesson.level].push(lesson);
      return acc;
    }, {});
  }, [lessons]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading lessons...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Learn to Type</h1>
      <p className="text-muted-foreground mb-8">
        Master typing through structured lessons from basic to advanced
      </p>

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

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold">
              {stats.completedLessons}/{stats.totalLessons}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Stars</p>
            <p className="text-2xl font-bold">
              {stats.totalStars}/{stats.maxStars}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg WPM</p>
            <p className="text-2xl font-bold">{stats.averageWpm}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg Accuracy</p>
            <p className="text-2xl font-bold">{stats.averageAccuracy}%</p>
          </div>
        </div>
      )}

      {/* Lessons by Level */}
      {Object.entries(lessonsByLevel).map(([level, levelLessons]) => (
        <div key={level} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Level {level}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levelLessons.map((lesson) => {
              const progress = lesson.userProgress?.[0];
              const isLocked = false; // Implement lock logic based on previous lessons
              const stars = progress?.stars || 0;

              return (
                <Link
                  key={lesson.id}
                  href={`/learn/${lesson.id}`}
                  className={`bg-card border rounded-lg p-6 transition-all hover:shadow-lg ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{lesson.title}</h3>
                    {isLocked ? (
                      <Lock className="text-muted-foreground" size={20} />
                    ) : progress?.completed ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : null}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>

                  {/* Stars */}
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>

                  {/* Stats */}
                  {progress && (
                    <div className="text-xs text-muted-foreground">
                      Best: {progress.bestWpm.toFixed(0)} WPM • {progress.bestAccuracy.toFixed(0)}%
                      Accuracy
                    </div>
                  )}

                  {/* Target */}
                  <div className="text-xs text-muted-foreground mt-2">
                    Target: {lesson.targetWpm} WPM • {lesson.minAccuracy}% Accuracy
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

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
