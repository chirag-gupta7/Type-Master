'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { lessonAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Lock } from 'lucide-react';

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
  const { data: session } = useSession();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (session?.accessToken) {
        try {
          setIsLoading(true);
          const data = await lessonAPI.getLearningDashboard();
          setSections(data);
        } catch (error) {
          console.error('Failed to fetch learning dashboard:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchDashboard();
    } else {
      setIsLoading(false);
    }
  }, [session]);

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
  const cardContent = (
    <Card
      className={`h-full transition-all ${
        isUnlocked
          ? 'border-border hover:border-primary cursor-pointer'
          : 'bg-gray-800/50 border-gray-700'
      } ${isCompleted ? 'border-green-500' : ''}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{lesson.title}</CardTitle>
        {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
        {!isUnlocked && <Lock className="h-5 w-5 text-gray-500" />}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Practice{' '}
          {lesson.keys.length > 0 ? `the keys: ${lesson.keys.join(', ')}` : 'typing skills'}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Target: {lesson.targetWpm} WPM</span>
          <span>Min: {lesson.minAccuracy}%</span>
        </div>
      </CardContent>
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
