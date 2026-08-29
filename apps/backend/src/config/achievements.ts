/**
 * Shared achievements – single source of truth
 * Re-exported from packages/shared for backend consumption.
 * Keep in sync with packages/shared/src/achievements.ts
 * This duplicate avoids rootDir cross-package import issues while keeping a single logical source.
 */

export const ACHIEVEMENTS = [
  {
    type: 'firstSteps',
    title: 'First Steps',
    description: 'Complete your first typing test',
    icon: 'target',
    category: 'Intro',
    threshold: 1,
    points: 10,
  },
  {
    type: 'firstLesson',
    title: 'First Lesson',
    description: 'Complete your first lesson',
    icon: 'check',
    category: 'Intro',
    threshold: 1,
    points: 10,
  },
  {
    type: 'earlyBird',
    title: 'Early Bird',
    description: 'Complete 5 typing tests',
    icon: 'zap',
    category: 'Intro',
    threshold: 5,
    points: 15,
  },
  {
    type: 'dedicated',
    title: 'Dedicated',
    description: 'Complete 10 typing tests',
    icon: 'heart',
    category: 'Consistency',
    threshold: 10,
    points: 20,
  },
  {
    type: 'centuryClub',
    title: 'Century Club',
    description: 'Complete 25 typing tests',
    icon: 'award',
    category: 'Consistency',
    threshold: 25,
    points: 30,
  },
  {
    type: 'committed',
    title: 'Committed',
    description: 'Complete 50 typing tests',
    icon: 'flame',
    category: 'Consistency',
    threshold: 50,
    points: 50,
  },
  {
    type: 'unstoppable',
    title: 'Unstoppable',
    description: 'Complete 100 typing tests',
    icon: 'trophy',
    category: 'Consistency',
    threshold: 100,
    points: 100,
  },
  {
    type: 'speedDemon',
    title: 'Speed Demon',
    description: 'Reach 50 WPM in any test',
    icon: 'zap',
    category: 'Speed',
    threshold: 50,
    points: 25,
  },
  {
    type: 'lightningFast',
    title: 'Lightning Fast',
    description: 'Reach 80 WPM in any test',
    icon: 'flame',
    category: 'Speed',
    threshold: 80,
    points: 50,
  },
  {
    type: 'typingMaster',
    title: 'Typing Master',
    description: 'Reach 100 WPM in any test',
    icon: 'trophy',
    category: 'Speed',
    threshold: 100,
    points: 100,
  },
  {
    type: 'velocity120',
    title: 'Velocity 120',
    description: 'Reach 120 WPM in any test',
    icon: 'crown',
    category: 'Speed',
    threshold: 120,
    points: 150,
  },
  {
    type: 'perfectionist',
    title: 'Perfectionist',
    description: 'Achieve 100% accuracy in any test',
    icon: 'star',
    category: 'Accuracy',
    threshold: 1,
    points: 30,
  },
  {
    type: 'sharpshooter',
    title: 'Sharpshooter',
    description: 'Achieve 95%+ accuracy in 10 tests',
    icon: 'target',
    category: 'Accuracy',
    threshold: 10,
    points: 40,
  },
  {
    type: 'accuracyAce',
    title: 'Accuracy Ace',
    description: 'Achieve 95%+ accuracy in 25 tests',
    icon: 'star',
    category: 'Accuracy',
    threshold: 25,
    points: 50,
  },
  {
    type: 'student',
    title: 'Student',
    description: 'Complete 5 lessons',
    icon: 'check',
    category: 'Learning',
    threshold: 5,
    points: 25,
  },
  {
    type: 'scholar',
    title: 'Scholar',
    description: 'Complete 20 lessons',
    icon: 'award',
    category: 'Learning',
    threshold: 20,
    points: 75,
  },
  {
    type: 'codeCrafter',
    title: 'Code Crafter',
    description: 'Complete 30 lessons',
    icon: 'check',
    category: 'Learning',
    threshold: 30,
    points: 40,
  },
  {
    type: 'graduateTypist',
    title: 'Graduate Typist',
    description: 'Complete all available lessons',
    icon: 'trophy',
    category: 'Learning',
    threshold: 30,
    points: 150,
  },
  {
    type: 'hotStreak',
    title: 'Hot Streak',
    description: 'Practice typing on 3 different days in a week',
    icon: 'flame',
    category: 'Streak',
    threshold: 3,
    points: 30,
  },
  {
    type: 'weekWarrior',
    title: 'Week Warrior',
    description: 'Practice typing on 7 different days in a week',
    icon: 'flame',
    category: 'Streak',
    threshold: 7,
    points: 50,
  },
] as const;

export type AchievementType = (typeof ACHIEVEMENTS)[number]['type'];
export type AchievementCategory = (typeof ACHIEVEMENTS)[number]['category'];
export type AchievementIcon = (typeof ACHIEVEMENTS)[number]['icon'];
export type AchievementDefinition = (typeof ACHIEVEMENTS)[number];

export const THRESHOLDS = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.type, a.threshold])
) as Record<AchievementType, number>;

export const TYPE_TO_CATEGORY = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.type, a.category])
) as Record<AchievementType, AchievementCategory>;

export const TYPE_TO_POINTS = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.type, a.points])
) as Record<AchievementType, number>;

export const TYPE_TO_TITLE = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.type, a.title])
) as Record<AchievementType, string>;

export const TYPE_TO_ICON = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.type, a.icon])
) as Record<AchievementType, AchievementIcon>;

export const CATEGORIES = [...new Set(ACHIEVEMENTS.map((a) => a.category))] as AchievementCategory[];
