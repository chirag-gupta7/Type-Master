/* eslint-disable no-console */
import { PrismaClient, Difficulty, ExerciseType } from '@prisma/client';

const prisma = new PrismaClient();

const lessons = [
  // Level 1: Home Row
  {
    level: 1,
    order: 1,
    title: 'Home Row - Left Hand (ASDF)',
    description: 'Learn the home row keys for your left hand',
    keys: ['a', 's', 'd', 'f'],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 15,
    minAccuracy: 85,
    exerciseType: ExerciseType.KEYS,
    content: 'asdf fdsa asdf fdsa asdf fdsa asdf fdsa asdf fdsa',
  },
  {
    level: 1,
    order: 2,
    title: 'Home Row - Right Hand (JKL;)',
    description: 'Learn the home row keys for your right hand',
    keys: ['j', 'k', 'l', ';'],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 15,
    minAccuracy: 85,
    exerciseType: ExerciseType.KEYS,
    content: 'jkl; ;lkj jkl; ;lkj jkl; ;lkj jkl; ;lkj jkl; ;lkj',
  },
  {
    level: 1,
    order: 3,
    title: 'Home Row - Both Hands',
    description: 'Practice all home row keys together',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 20,
    minAccuracy: 90,
    exerciseType: ExerciseType.KEYS,
    content: 'asdf jkl; fdsa ;lkj asdf jkl; fdsa ;lkj asdf jkl;',
  },

  // Level 2: Top Row
  {
    level: 2,
    order: 1,
    title: 'Top Row - Left Hand (QWERT)',
    description: 'Learn the top row keys for your left hand',
    keys: ['q', 'w', 'e', 'r', 't'],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 20,
    minAccuracy: 85,
    exerciseType: ExerciseType.KEYS,
    content: 'qwert trewq qwert trewq asdf qwert fdsa trewq',
  },
  {
    level: 2,
    order: 2,
    title: 'Top Row - Right Hand (YUIOP)',
    description: 'Learn the top row keys for your right hand',
    keys: ['y', 'u', 'i', 'o', 'p'],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 20,
    minAccuracy: 85,
    exerciseType: ExerciseType.KEYS,
    content: 'yuiop poiuy yuiop poiuy jkl; yuiop ;lkj poiuy',
  },

  // Level 3: Bottom Row
  {
    level: 3,
    order: 1,
    title: 'Bottom Row - Left Hand (ZXCV)',
    description: 'Learn the bottom row keys for your left hand',
    keys: ['z', 'x', 'c', 'v'],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 20,
    minAccuracy: 85,
    exerciseType: ExerciseType.KEYS,
    content: 'zxcv vcxz zxcv vcxz asdf zxcv fdsa vcxz',
  },
  {
    level: 3,
    order: 2,
    title: 'Bottom Row - Right Hand (BNM)',
    description: 'Learn the bottom row keys for your right hand',
    keys: ['b', 'n', 'm'],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 20,
    minAccuracy: 85,
    exerciseType: ExerciseType.KEYS,
    content: 'bnm mnb bnm mnb jkl; bnm ;lkj mnb',
  },

  // Level 4: Simple Words
  {
    level: 4,
    order: 1,
    title: 'Common Words - Easy',
    description: 'Type common English words',
    keys: [],
    difficulty: Difficulty.BEGINNER,
    targetWpm: 25,
    minAccuracy: 90,
    exerciseType: ExerciseType.WORDS,
    content:
      'the and for are but not you all can her was one our out day get has him his how man new now old see two way who boy did its let put say she too use',
  },
  {
    level: 4,
    order: 2,
    title: 'Common Words - Medium',
    description: 'Type more common English words',
    keys: [],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 30,
    minAccuracy: 90,
    exerciseType: ExerciseType.WORDS,
    content:
      'about after again also another back because before between both could every first found give great hand help here high just know last little long made many more must never next only over place right same should small still such take tell than that their there these they thing think this those time very were what when where which while would write year',
  },

  // Level 5: Sentences
  {
    level: 5,
    order: 1,
    title: 'Simple Sentences',
    description: 'Practice typing complete sentences',
    keys: [],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 35,
    minAccuracy: 92,
    exerciseType: ExerciseType.SENTENCES,
    content:
      'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly.',
  },
  {
    level: 5,
    order: 2,
    title: 'Complex Sentences',
    description: 'Practice typing longer sentences with punctuation',
    keys: [],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 35,
    minAccuracy: 92,
    exerciseType: ExerciseType.SENTENCES,
    content:
      'TypeMaster helps you improve your typing speed and accuracy. Regular practice is the key to becoming a proficient typist. Focus on accuracy first, speed will come naturally.',
  },

  // Level 6: Paragraphs
  {
    level: 6,
    order: 1,
    title: 'Short Paragraph',
    description: 'Practice typing complete paragraphs',
    keys: [],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 40,
    minAccuracy: 93,
    exerciseType: ExerciseType.PARAGRAPHS,
    content:
      'Touch typing is a method of typing without looking at the keyboard. The typist locates keys by touch alone. This technique relies on muscle memory to find keys quickly and efficiently. With practice, touch typing becomes second nature and significantly increases typing speed.',
  },

  // Level 7: Code Snippets
  {
    level: 7,
    order: 1,
    title: 'JavaScript - Variables',
    description: 'Practice typing JavaScript code',
    keys: [],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 35,
    minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    content:
      'const userName = "TypeMaster";\nlet score = 0;\nconst WPM = 45.5;\nlet accuracy = 98.2;',
  },
  {
    level: 7,
    order: 2,
    title: 'JavaScript - Functions',
    description: 'Practice typing JavaScript functions',
    keys: [],
    difficulty: Difficulty.EXPERT,
    targetWpm: 35,
    minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    content:
      'function calculateWPM(chars, time) {\n  return (chars / 5) / (time / 60);\n}\n\nconst result = calculateWPM(250, 60);',
  },
];

const achievements = [
  // First achievements
  {
    title: 'First Steps',
    description: 'Complete your first typing test',
    icon: 'target',
    requirement: JSON.stringify({ type: 'firstSteps' }),
    points: 10,
  },
  {
    title: 'First Lesson',
    description: 'Complete your first lesson',
    icon: 'check',
    requirement: JSON.stringify({ type: 'firstLesson' }),
    points: 10,
  },

  // Speed achievements
  {
    title: 'Speed Demon',
    description: 'Reach 50 WPM in any test',
    icon: 'zap',
    requirement: JSON.stringify({ type: 'speedDemon' }),
    points: 25,
  },
  {
    title: 'Lightning Fast',
    description: 'Reach 80 WPM in any test',
    icon: 'flame',
    requirement: JSON.stringify({ type: 'lightningFast' }),
    points: 50,
  },
  {
    title: 'Typing Master',
    description: 'Reach 100 WPM in any test',
    icon: 'trophy',
    requirement: JSON.stringify({ type: 'typingMaster' }),
    points: 100,
  },

  // Accuracy achievements
  {
    title: 'Perfectionist',
    description: 'Achieve 100% accuracy in any test',
    icon: 'star',
    requirement: JSON.stringify({ type: 'perfectionist' }),
    points: 30,
  },
  {
    title: 'Sharpshooter',
    description: 'Achieve 95%+ accuracy in 10 tests',
    icon: 'target',
    requirement: JSON.stringify({ type: 'sharpshooter' }),
    points: 40,
  },

  // Consistency achievements
  {
    title: 'Dedicated',
    description: 'Complete 10 typing tests',
    icon: 'heart',
    requirement: JSON.stringify({ type: 'dedicated' }),
    points: 20,
  },
  {
    title: 'Committed',
    description: 'Complete 50 typing tests',
    icon: 'flame',
    requirement: JSON.stringify({ type: 'committed' }),
    points: 50,
  },
  {
    title: 'Unstoppable',
    description: 'Complete 100 typing tests',
    icon: 'trophy',
    requirement: JSON.stringify({ type: 'unstoppable' }),
    points: 100,
  },

  // Learning achievements
  {
    title: 'Student',
    description: 'Complete 5 lessons',
    icon: 'check',
    requirement: JSON.stringify({ type: 'student' }),
    points: 25,
  },
  {
    title: 'Scholar',
    description: 'Complete 20 lessons',
    icon: 'award',
    requirement: JSON.stringify({ type: 'scholar' }),
    points: 75,
  },
  {
    title: 'Graduate Typist',
    description: 'Complete all available lessons',
    icon: 'trophy',
    requirement: JSON.stringify({ type: 'graduateTypist' }),
    points: 150,
  },

  // Streak achievements
  {
    title: 'Week Warrior',
    description: 'Practice typing on 7 different days in a week',
    icon: 'flame',
    requirement: JSON.stringify({ type: 'weekWarrior' }),
    points: 50,
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing lessons and achievements...');
  await prisma.userLessonProgress.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.achievement.deleteMany({});

  // Seed lessons
  console.log('📝 Seeding lessons...');
  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: lesson,
    });
  }
  console.log(`✅ Created ${lessons.length} lessons`);

  // Seed achievements
  console.log('🏆 Seeding achievements...');
  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    });
  }
  console.log(`✅ Created ${achievements.length} achievements`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
