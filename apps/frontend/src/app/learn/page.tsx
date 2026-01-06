'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { lessonAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Lock, RefreshCw } from 'lucide-react';

type Section = {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
};

type Lesson = {
  id: string;
  level: number;
  order: number;
  title: string;
  description: string;
  keys: string[];
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  exerciseType: string;
  content: string;
  section: number;
  isCheckpoint: boolean;
  userProgress: UserProgress[];
};

type UserProgress = {
  id: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  stars: number;
  attempts: number;
};

const LearnPage = () => {
  const { data: session, status } = useSession();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      console.log('[Learn] Auth status:', status);
      console.log('[Learn] Session:', session);

      // Only attempt fetch once the user is authenticated; API client handles token retrieval.
      if (status !== 'authenticated') {
        console.log('[Learn] Not authenticated, skipping dashboard fetch');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('[Learn] Fetching dashboard for user:', session?.user?.email);
        console.log('[Learn] Session tokens:', {
          accessToken: session?.accessToken ? 'present' : 'missing',
          backendAccessToken: (session as any)?.backendAccessToken ? 'present' : 'missing',
        });

        const data = await lessonAPI.getLearningDashboard();
        console.log('[Learn] Dashboard data received:', data);
        console.log('[Learn] Number of sections:', data?.length);
        setSections(data);
      } catch (error) {
        console.error('[Learn] Failed to fetch learning dashboard:', error);
        console.error('[Learn] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          error,
        });
        setSections([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Defer until we know the auth status; avoids blocking on missing tokens.
    if (status !== 'loading') {
      fetchDashboard();
    }
  }, [status, session]);

  const renderLoadingSkeleton = () => (
    <div className="space-y-8">
      {[1, 2].map((group) => (
        <div key={group}>
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading && !sections.length) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-bold mb-8">Learn to Type</h1>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-4xl font-bold mb-8">Learn to Type</h1>
        <p>
          Please{' '}
          <Link href="/login" className="text-primary underline">
            sign in
          </Link>{' '}
          to view your lesson progress.
        </p>
      </div>
    );
  }

  // Helper to determine if a lesson is unlocked
  const isLessonUnlocked = (sectionIndex: number, lessonIndex: number): boolean => {
    if (sectionIndex === 0 && lessonIndex === 0) return true; // First lesson always unlocked

    // Check if previous lesson is complete
    let prevLesson: Lesson | undefined;
    const currentSection = sections[sectionIndex];

    if (lessonIndex > 0) {
      prevLesson = currentSection?.lessons[lessonIndex - 1];
    } else if (sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];
      const lessonsInPrevSection = prevSection?.lessons ?? [];
      prevLesson = lessonsInPrevSection[lessonsInPrevSection.length - 1];
    }

    const previousProgress = prevLesson?.userProgress?.[0];
    return previousProgress?.completed ?? false;
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8">Learn to Type</h1>
      {sections.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground mb-4">No lessons available at the moment.</p>
          <p className="text-sm text-muted-foreground">
            Please check the browser console (F12) for error details.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {sections.map((section, sectionIndex) => (
            <section key={section.id}>
              <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-gray-700">
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.lessons.map((lesson, lessonIndex) => {
                  const isCompleted =
                    lesson.userProgress.length > 0 && lesson.userProgress[0]?.completed;
                  const unlocked = isLessonUnlocked(sectionIndex, lessonIndex);

                  return (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      isCompleted={isCompleted}
                      isUnlocked={unlocked}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

// A new component for the lesson card
const LessonCard = ({
  lesson,
  isCompleted,
  isUnlocked,
}: {
  lesson: Lesson;
  isCompleted: boolean;
  isUnlocked: boolean;
}) => {
  // Check if lesson needs improvement (completed but accuracy < 95%)
  const needsImprovement =
    isCompleted && lesson.userProgress.length > 0 && lesson.userProgress[0].bestAccuracy < 95;

  const cardContent = (
    <Card
      className={`h-full transition-all relative group ${
        isUnlocked
          ? 'border-border hover:border-primary cursor-pointer'
          : 'bg-gray-800/50 border-gray-700'
      } ${isCompleted ? 'border-green-500' : ''} ${
        needsImprovement ? 'border-yellow-500 hover:border-yellow-400' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{lesson.title}</CardTitle>
        <div className="flex items-center gap-1">
          {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
          {needsImprovement && <RefreshCw className="h-4 w-4 text-yellow-500 animate-pulse" />}
          {!isUnlocked && <Lock className="h-5 w-5 text-gray-500" />}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Practice{' '}
          {lesson.keys.length > 0 ? `the keys: ${lesson.keys.join(', ')}` : 'typing skills'}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Target: {lesson.targetWpm} WPM</span>
          <span>Min: {Math.max(0, lesson.minAccuracy - 10)}%</span>
        </div>
        {needsImprovement && (
          <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            <span>Best: {lesson.userProgress[0].bestAccuracy.toFixed(1)}%</span>
          </div>
        )}
      </CardContent>

      {/* Hover tooltip for improvement suggestion */}
      {needsImprovement && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4 pointer-events-none">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white mb-1">Room for Improvement!</p>
            <p className="text-xs text-gray-300">
              Your best accuracy is {lesson.userProgress[0].bestAccuracy.toFixed(1)}%.
              <br />
              Try again to reach 95%+ for mastery!
            </p>
          </div>
        </div>
      )}
    </Card>
  );

  if (!isUnlocked) {
    return <div className="opacity-60 cursor-not-allowed">{cardContent}</div>;
  }

  return (
    <Link href={`/learn/${lesson.id}`} legacyBehavior>
      <a className="block h-full">{cardContent}</a>
    </Link>
  );
};

export default LearnPage;
