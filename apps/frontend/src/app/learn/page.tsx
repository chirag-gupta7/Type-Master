'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { lessonAPI } from '@/lib/api';
import { Star, Lock, CheckCircle } from 'lucide-react';

interface Lesson {
  id: string;
  level: number;
  order: number;
  title: string;
  description: string;
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
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

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [lessonsData, statsData] = await Promise.all([
          lessonAPI.getAllLessons(),
          lessonAPI.getLearningStats().catch(() => null),
        ]);
        setLessons(lessonsData.lessons);
        if (statsData) setStats(statsData.stats);
      } catch (err) {
        console.error('Failed to load lessons:', err);
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
  const lessonsByLevel = lessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.level]) acc[lesson.level] = [];
      acc[lesson.level].push(lesson);
      return acc;
    },
    {} as Record<number, Lesson[]>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Learn to Type</h1>
      <p className="text-muted-foreground mb-8">
        Master typing through structured lessons from basic to advanced
      </p>

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
    </div>
  );
}
