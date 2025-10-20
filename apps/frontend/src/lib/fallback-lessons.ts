export interface Lesson {
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

export const FALLBACK_LESSONS: Lesson[] = [
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

export const buildFallbackStats = (lessonCount: number) => ({
  totalLessons: lessonCount,
  completedLessons: 0,
  completionPercentage: 0,
  totalStars: 0,
  maxStars: lessonCount * 3,
  averageWpm: 0,
  averageAccuracy: 0,
});

export const isExerciseType = (value: unknown): value is NonNullable<Lesson['exerciseType']> =>
  value === 'guided' || value === 'timed';

export const getFallbackLessonById = (id: string) =>
  FALLBACK_LESSONS.find((lesson) => lesson.id === id);
