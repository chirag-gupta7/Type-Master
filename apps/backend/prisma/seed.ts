/* eslint-disable no-console */
import { PrismaClient, Difficulty, ExerciseType, GameType } from '@prisma/client';
import { makeLessons } from './seed-utils';
import { ACHIEVEMENTS } from '../src/config/achievements';

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

// Achievements now sourced from shared single source – see src/config/achievements.ts
// (kept here as re-export for tooling that expects local const, but canonical is ACHIEVEMENTS import)

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

  // Seed achievements via shared ACHIEVEMENTS + @@unique([title]) upsert (works in both dev and prod)
  console.log('🏆 Seeding achievements...');
  let achievementCreated = 0;
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { title: a.title },
      update: {
        description: a.description,
        icon: a.icon,
        requirement: JSON.stringify({ type: a.type }),
        points: a.points,
      },
      create: {
        title: a.title,
        description: a.description,
        icon: a.icon,
        requirement: JSON.stringify({ type: a.type }),
        points: a.points,
      },
    });
    achievementCreated++;
  }
  console.log(`✅ Upserted ${achievementCreated} achievements (total ${ACHIEVEMENTS.length})`);

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
  console.log(`   • Total Achievements: ${ACHIEVEMENTS.length}`);
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