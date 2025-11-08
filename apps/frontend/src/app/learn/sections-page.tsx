'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Lock,
  Star,
  Trophy,
  Zap,
  Code,
  Target,
  TrendingUp,
  Award,
  User,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Lesson {
  id: string;
  level: number;
  title: string;
  description: string;
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  section: number;
  isCheckpoint: boolean;
  userProgress?: Array<{
    completed: boolean;
    bestWpm: number;
    bestAccuracy: number;
    stars: number;
    attempts: number;
  }>;
}

interface SectionData {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
  lessons: Lesson[];
  completed: number;
  total: number;
}

const SECTION_INFO = {
  1: {
    name: 'Foundation',
    icon: <Target className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    description: 'Master the fundamentals and home row keys',
  },
  2: {
    name: 'Skill Building',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500',
    description: 'Build fluency with common letter combinations',
  },
  3: {
    name: 'Advanced Techniques',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-yellow-500 to-orange-500',
    description: 'Master numbers, symbols, and special characters',
  },
  4: {
    name: 'Speed & Fluency',
    icon: <Trophy className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500',
    description: 'Increase your typing speed with real content',
  },
  5: {
    name: 'Mastery',
    icon: <Award className="w-5 h-5" />,
    color: 'from-red-500 to-rose-500',
    description: 'Achieve expert-level performance',
  },
  6: {
    name: 'Programming',
    icon: <Code className="w-5 h-5" />,
    color: 'from-indigo-500 to-blue-500',
    description: 'Master code typing with brackets and operators',
  },
  7: {
    name: 'Python Coding',
    icon: <Code className="w-5 h-5" />,
    color: 'from-blue-400 to-yellow-400',
    description: 'Practice typing common Python keywords and syntax',
  },
  8: {
    name: 'Java Coding',
    icon: <Code className="w-5 h-5" />,
    color: 'from-red-500 to-orange-500',
    description: 'Practice typing Java syntax, classes, and methods',
  },
  9: {
    name: 'C++ Coding',
    icon: <Code className="w-5 h-5" />,
    color: 'from-blue-600 to-indigo-600',
    description: 'Practice typing C++ syntax, headers, and pointers',
  },
  10: {
    name: 'C Coding',
    icon: <Code className="w-5 h-5" />,
    color: 'from-gray-500 to-gray-700',
    description: 'Practice typing C syntax, stdio, and structs',
  },
};

export default function LearnPage() {
  const { data: session, status: sessionStatus } = useSession();
  const userName = session?.user?.name ?? session?.user?.email ?? null;
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch('http://localhost:5000/api/v1/lessons');
        const data = await response.json();

        // Group lessons by section
        const lessonsBySection: Record<number, Lesson[]> = {};
        data.lessons.forEach((lesson: Lesson) => {
          if (!lessonsBySection[lesson.section]) {
            lessonsBySection[lesson.section] = [];
          }
          lessonsBySection[lesson.section].push(lesson);
        });

        // Create section data
        const sectionData: SectionData[] = Object.entries(lessonsBySection).map(
          ([sectionId, lessons]) => {
            const id = parseInt(sectionId);
            const completed = lessons.filter((l) => l.userProgress?.[0]?.completed).length;
            return {
              id,
              name: SECTION_INFO[id as keyof typeof SECTION_INFO].name,
              icon: SECTION_INFO[id as keyof typeof SECTION_INFO].icon,
              color: SECTION_INFO[id as keyof typeof SECTION_INFO].color,
              lessons: lessons.sort((a, b) => a.level - b.level),
              completed,
              total: lessons.length,
            };
          }
        );

        setSections(sectionData.sort((a, b) => a.id - b.id));
        setError(null);
      } catch (err) {
        console.error('Failed to load lessons:', err);
        setError('Failed to load lessons. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading lessons...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Learn Touch Typing</h1>
        <p className="text-muted-foreground text-lg">
          100 progressive lessons organized into 6 sections. Start from the beginning or jump to
          your level.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
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
                  Jump into any section and continue building your typing mastery.
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
                <h3 className="text-2xl font-bold">Sign in to track your progress</h3>
                <p className="text-muted-foreground">
                  Sync your section completions and unlock achievements across devices.
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
      </motion.div>

      {error && (
        <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-200">Error</p>
              <p className="text-yellow-800 dark:text-yellow-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {sections.map((section, index) => {
          const progress = (section.completed / section.total) * 100;
          const isUnlocked =
            index === 0 || sections[index - 1].completed === sections[index - 1].total;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => isUnlocked && setSelectedSection(section.id)}
              className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                isUnlocked
                  ? 'border-transparent hover:border-primary/50 hover:shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
              } ${selectedSection === section.id ? 'ring-2 ring-primary' : ''}`}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-10`} />

              {/* Lock overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Complete Section {index} first</p>
                  </div>
                </div>
              )}

              <div className="relative p-6">
                {/* Icon and title */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${section.color} text-white`}>
                    {section.icon}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Section {section.id}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{section.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {SECTION_INFO[section.id as keyof typeof SECTION_INFO].description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {section.completed}/{section.total} lessons
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                      className={`h-2 rounded-full bg-gradient-to-r ${section.color}`}
                    />
                  </div>
                </div>

                {/* Checkpoint indicator */}
                {section.lessons.some((l) => l.isCheckpoint) && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Trophy className="w-4 h-4" />
                    <span>Includes checkpoint test</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Section Lessons */}
      {selectedSection && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {SECTION_INFO[selectedSection as keyof typeof SECTION_INFO].name} - Lessons
            </h2>
            <Button variant="outline" onClick={() => setSelectedSection(null)}>
              View All Sections
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections
              .find((s) => s.id === selectedSection)
              ?.lessons.map((lesson, index) => {
                const progress = lesson.userProgress?.[0];
                const prevLesson =
                  index > 0
                    ? sections.find((s) => s.id === selectedSection)?.lessons[index - 1]
                    : null;
                const isUnlocked = index === 0 || prevLesson?.userProgress?.[0]?.completed;

                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={isUnlocked ? `/learn/${lesson.id}` : '#'}
                      className={`block ${!isUnlocked ? 'pointer-events-none' : ''}`}
                    >
                      <div
                        className={`p-4 bg-card rounded-lg border-2 transition-all ${
                          isUnlocked
                            ? 'border-transparent hover:border-primary/50 hover:shadow-md'
                            : 'border-gray-200 dark:border-gray-700 opacity-60'
                        } ${progress?.completed ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-muted-foreground">
                                Level {lesson.level}
                              </span>
                              {lesson.isCheckpoint && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  Checkpoint
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {lesson.description}
                            </p>
                          </div>

                          {/* Status icon */}
                          <div className="ml-4">
                            {!isUnlocked ? (
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            ) : progress?.completed ? (
                              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                                <Check className="w-5 h-5" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full border-2 border-primary/50 flex items-center justify-center text-primary font-bold">
                                {lesson.level}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <span>Target: {lesson.targetWpm} WPM</span>
                          <span>•</span>
                          <span>Min: {lesson.minAccuracy}% accuracy</span>
                          {progress && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {[...Array(3)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < progress.stars
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </span>
                            </>
                          )}
                        </div>

                        {progress && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Best:</span>
                              <span className="font-medium">
                                {progress.bestWpm.toFixed(0)} WPM •{' '}
                                {progress.bestAccuracy.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">Attempts:</span>
                              <span className="font-medium">{progress.attempts}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {sections.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No lessons available. Please check your connection and try again.</p>
        </div>
      )}
    </div>
  );
}
