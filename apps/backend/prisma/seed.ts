/* eslint-disable no-console */
import { PrismaClient, Difficulty, ExerciseType, GameType } from '@prisma/client';
import { makeLessons } from './seed-utils';

// Import raw content arrays from each seed file
import { section1Contents, section2Contents, section3Contents } from './comprehensive-seed';
import { section4Contents, section5Contents, section6Contents } from './seed-sections-4-6';
import { pythonContents, javaContents, cppContents, cContents } from './seed-coding-lessons';
import { advancedPunctuationLessons as section11Lessons, codeSyntaxLessons as section12Lessons, speedDrillLessons as section13Lessons } from './seed-new-lessons';

const prisma = new PrismaClient();

// Build lesson arrays using makeLessons
const section1Lessons = makeLessons(1, ExerciseType.KEYS, Difficulty.BEGINNER, section1Contents);
const section2Lessons = makeLessons(2, ExerciseType.WORDS, Difficulty.BEGINNER, section2Contents);
const section3Lessons = makeLessons(3, ExerciseType.SENTENCES, Difficulty.INTERMEDIATE, section3Contents);
const section4Lessons = makeLessons(4, ExerciseType.WORDS, Difficulty.ADVANCED, section4Contents);
const section5Lessons = makeLessons(5, ExerciseType.SENTENCES, Difficulty.ADVANCED, section5Contents);
const section6Lessons = makeLessons(6, ExerciseType.KEYS, Difficulty.ADVANCED, section6Contents);
const pythonLessons = makeLessons(7, ExerciseType.CODE, Difficulty.BEGINNER, pythonContents);
const javaLessons = makeLessons(8, ExerciseType.CODE, Difficulty.INTERMEDIATE, javaContents);
const cppLessons = makeLessons(9, ExerciseType.CODE, Difficulty.ADVANCED, cppContents);
const cLessons = makeLessons(10, ExerciseType.CODE, Difficulty.ADVANCED, cContents);

// Combine all lesson sections (260 lessons total)
const allLessons = [
  ...section1Lessons, // Foundation
  ...section2Lessons, // Skill Building
  ...section3Lessons, // Advanced Techniques
  ...section4Lessons, // Speed & Fluency
  ...section5Lessons, // Mastery
  ...section6Lessons, // Programming
  ...pythonLessons, // Python
  ...javaLessons, // Java
  ...cppLessons, // C++
  ...cLessons, // C
  ...section11Lessons,
  ...section12Lessons,
  ...section13Lessons,
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

  // --- Expansion: 14 → 20 (fills gaps: 3-day streak, 5/25 tests, 25×95%, 30 lessons, 120 WPM)
  {
    title: 'Hot Streak',
    description: 'Practice typing on 3 different days in a week',
    icon: 'flame',
    requirement: JSON.stringify({ type: 'hotStreak' }),
    points: 30,
  },
  {
    title: 'Accuracy Ace',
    description: 'Achieve 95%+ accuracy in 25 tests',
    icon: 'star',
    requirement: JSON.stringify({ type: 'accuracyAce' }),
    points: 50,
  },
  {
    title: 'Century Club',
    description: 'Complete 25 typing tests',
    icon: 'award',
    requirement: JSON.stringify({ type: 'centuryClub' }),
    points: 30,
  },
  {
    title: 'Code Crafter',
    description: 'Complete 30 lessons',
    icon: 'check',
    requirement: JSON.stringify({ type: 'codeCrafter' }),
    points: 40,
  },
  {
    title: 'Early Bird',
    description: 'Complete 5 typing tests',
    icon: 'zap',
    requirement: JSON.stringify({ type: 'earlyBird' }),
    points: 15,
  },
  {
    title: 'Velocity 120',
    description: 'Reach 120 WPM in any test',
    icon: 'crown',
    requirement: JSON.stringify({ type: 'velocity120' }),
    points: 150,
  },
];

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  const isProduction = process.env.NODE_ENV === 'production';

  // Prod-safe: destructive deletes only in non-production
  // In production we use findFirst+create (upsert-safe without requiring @unique on title)
  if (!isProduction) {
    console.log('🧹 Cleaning existing lessons and achievements...');
    await prisma.userLessonProgress.deleteMany({});
    await prisma.userAchievement.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.achievement.deleteMany({});
  } else {
    console.log('⚠️ Production mode: skipping destructive deleteMany (using upsert-safe seeding)');
  }

  // Seed all lessons (prod-safe via findFirst by title)
  console.log('📝 Seeding lessons...');
  let lessonCount = 0;
  let lessonSkipped = 0;
  for (const lesson of allLessons) {
    const normalizedLesson = {
      ...lesson,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unlockAfter: (lesson.unlockAfter as any[]).map((dependency: any) => dependency.toString()),
    };

    if (isProduction) {
      const existing = await prisma.lesson.findFirst({ where: { title: normalizedLesson.title } });
      if (existing) {
        lessonSkipped++;
        continue;
      }
    }

    await prisma.lesson.create({
      data: normalizedLesson,
    });
    lessonCount++;
    if (lessonCount % 10 === 0) {
      console.log(`   ✓ Created ${lessonCount} lessons...`);
    }
  }
  console.log(`✅ Created ${lessonCount} lessons across 13 sections${isProduction ? ` (${lessonSkipped} skipped)` : ''}`);

  // Seed achievements (prod-safe via findFirst by title; avoids need for @unique migration)
  console.log('🏆 Seeding achievements...');
  let achievementCreated = 0;
  let achievementSkipped = 0;
  for (const achievement of achievements) {
    const existing = await prisma.achievement.findFirst({ where: { title: achievement.title } });
    if (existing) {
      achievementSkipped++;
      if (!isProduction) {
        // In dev we already cleared, this shouldn't happen; log for visibility
        console.log(`   ↷ Skipped duplicate achievement: ${achievement.title}`);
      }
      continue;
    }
    await prisma.achievement.create({
      data: achievement,
    });
    achievementCreated++;
  }
  if (isProduction) {
    console.log(`✅ Created ${achievementCreated} achievements (${achievementSkipped} skipped, total ${achievements.length})`);
  } else {
    console.log(`✅ Created ${achievementCreated} achievements`);
  }

  // Seed fake leaderboard data for motivation
  console.log('🏆 Seeding fake leaderboard data...');
  await seedFakeData();

  console.log('🎉 Comprehensive database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   • Section 1 (Foundation): Lessons 1-25');
  console.log('   • Section 2 (Skill Building): Lessons 26-50');
  console.log('   • Section 3 (Advanced Techniques): Lessons 51-75');
  console.log('   • Section 4 (Speed & Fluency): Lessons 76-85');
  console.log('   • Section 5 (Mastery): Lessons 86-95');
  console.log('   • Section 6 (Programming): Lessons 96-105');
  console.log('   • Section 7 (Python): Lessons 106-135');
  console.log('   • Section 8 (Java): Lessons 136-165');
  console.log('   • Section 9 (C++): Lessons 166-195');
  console.log('   • Section 10 (C): Lessons 196-225');
  console.log('   • Section 11 (Advanced Punctuation): Lessons 226-250');
  console.log('   • Section 12 (Code Syntax): Lessons 251-275');
  console.log('   • Section 13 (Speed Drills): Lessons 276-300');
  console.log(`   • Total Achievements: ${achievements.length}`);
}

async function seedFakeData() {
  // Create 15 fake users (idempotent via unique email)
  const fakeUsers = Array.from({ length: 15 }, (_, i) => ({
    email: `bot${i}@typemaster.dev`,
    username: `typist${i}`,
    password: null, // In a real app, you would hash a password, but for seeding we can leave null or set a dummy
  }));
  await prisma.user.createMany({ data: fakeUsers, skipDuplicates: true });
  const users = await prisma.user.findMany();
  // For each user, add a few GameScore and TestResult rows
  for (const user of users) {
    await prisma.gameScore.createMany({
      data: Array.from({ length: 3 }, () => ({
        userId: user.id,
        gameType: ['WORD_BLITZ', 'PROMPT_DASH', 'STORY_CHAIN'][Math.floor(Math.random() * 3)] as GameType,
        score: Math.floor(Math.random() * 99500) + 500,
        wpm: Math.floor(Math.random() * 110) + 30,
        accuracy: Math.floor(Math.random() * 15) + 85,
        duration: Math.floor(Math.random() * 150) + 30,
      })),
      skipDuplicates: true,
    });
    await prisma.testResult.createMany({
      data: Array.from({ length: 3 }, () => ({
        userId: user.id,
        wpm: Math.floor(Math.random() * 110) + 30,
        accuracy: Math.floor(Math.random() * 15) + 85,
        rawWpm: Math.floor(Math.random() * 110) + 30,
        errors: Math.floor(Math.random() * 10),
        duration: [30, 60, 180][Math.floor(Math.random() * 3)],
      })),
      skipDuplicates: true,
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });