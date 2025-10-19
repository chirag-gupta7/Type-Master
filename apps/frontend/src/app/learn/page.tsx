'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { lessonAPI } from '@/lib/api';
import { useMemo } from 'react';
import { Star, Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { HandPositionGuide } from '@/components/HandPositionGuide';

interface Lesson {
  id: string;
  level: number;
  order: number;
  title: string;
  description: string;
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  keys?: string[];
  exerciseType?: 'guided' | 'timed';
  content?: string;
  userProgress?: Array<{
    completed: boolean;
    bestWpm: number;
    bestAccuracy: number;
    stars: number;
    attempts: number;
  }>;
}

interface LearningStats {
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  totalStars: number;
  maxStars: number;
  averageWpm: number;
  averageAccuracy: number;
}

const FALLBACK_LESSONS: Lesson[] = [
  {
    id: 'home-row-basics',
    level: 1,
    order: 1,
    title: 'Home Row Basics',
    description: 'Learn the foundation keys ASDF and JKL;',
    difficulty: 'Beginner',
    targetWpm: 20,
    minAccuracy: 92,
    keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
    exerciseType: 'guided',
    content: 'asdf jkl; asdf jkl; as dj fk la sj dk fj la; asdfg jkl;',
    userProgress: [],
  },
  {
    id: 'index-finger-reach',
    level: 1,
    order: 2,
    title: 'Index Finger Reach',
    description: 'Add G, H, and basic punctuation to your home row flow.',
    difficulty: 'Beginner',
    targetWpm: 22,
    minAccuracy: 93,
    keys: ['G', 'H', 'Space'],
    exerciseType: 'guided',
    content: 'fg hj fg hj gh gh fg hj fg hj ;g ;h fg hj',
    userProgress: [],
  },
  {
    id: 'top-row-intro',
    level: 1,
    order: 3,
    title: 'Top Row Intro',
    description: 'Stretch to QWERT and YUIOP while staying anchored.',
    difficulty: 'Beginner',
    targetWpm: 24,
    minAccuracy: 94,
    keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    exerciseType: 'guided',
    content: 'qwer tyui opyu tyqw reop qwerty uiop',
    userProgress: [],
  },
  {
    id: 'bottom-row-basics',
    level: 2,
    order: 1,
    title: 'Bottom Row Basics',
    description: 'Introduce the ZXCV and BNM keys with smooth transitions.',
    difficulty: 'Intermediate',
    targetWpm: 26,
    minAccuracy: 94,
    keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    exerciseType: 'guided',
    content: 'zx cv bn mzx cnb vm zxnb cvmz xcvb nm',
    userProgress: [],
  },
  {
    id: 'mixed-practice',
    level: 2,
    order: 2,
    title: 'Mixed Practice Drill',
    description: 'Blend all learned keys with rhythmic repetitions.',
    difficulty: 'Intermediate',
    targetWpm: 28,
    minAccuracy: 95,
    keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'G', 'H', 'R', 'U'],
    exerciseType: 'timed',
    content: 'rush ugh jar fad shrug jar flask flash guard',
    userProgress: [],
  },
  {
    id: 'numbers-row',
    level: 3,
    order: 1,
    title: 'Numbers Row Warm-up',
    description: 'Practice the 12345 and 67890 reaches with precision.',
    difficulty: 'Advanced',
    targetWpm: 30,
    minAccuracy: 96,
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    exerciseType: 'guided',
    content: '12345 54321 67890 09876 13579 24680',
    userProgress: [],
  },
];

const buildFallbackStats = (lessonCount: number): LearningStats => ({
  totalLessons: lessonCount,
  completedLessons: 0,
  completionPercentage: 0,
  totalStars: 0,
  maxStars: lessonCount * 3,
  averageWpm: 0,
  averageAccuracy: 0,
});

const isExerciseType = (value: unknown): value is NonNullable<Lesson['exerciseType']> =>
  value === 'guided' || value === 'timed';

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

        if (!hasToken) {
          setLessons(FALLBACK_LESSONS);
          setStats(buildFallbackStats(FALLBACK_LESSONS.length));
          setUsingFallback(true);
          setError("You're viewing the sample lesson plan. Sign in to sync your progress.");
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

        setLessons(normalizedLessons);
        setStats(statsData?.stats ?? null);
        setUsingFallback(false);
        setError(null);
      } catch (err) {
        console.error('Failed to load lessons:', err);
        setLessons(FALLBACK_LESSONS);
        setStats(buildFallbackStats(FALLBACK_LESSONS.length));
        setUsingFallback(true);

        const message =
          err instanceof Error && err.message.includes('token')
            ? 'We could not verify your session. Showing offline lessons instead.'
            : 'We could not reach the learning service. Showing offline lessons instead.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading lessons...</p>
      </div>
    );
  }

  // Group lessons by level
  const lessonsByLevel = useMemo(() => {
    return lessons.reduce(
      (acc, lesson) => {
        if (!acc[lesson.level]) acc[lesson.level] = [];
        acc[lesson.level].push(lesson);
        return acc;
      },
      {} as Record<number, Lesson[]>
    );
  }, [lessons]);

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
