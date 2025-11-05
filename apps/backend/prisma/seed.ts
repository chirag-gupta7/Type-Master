/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { section1Lessons, section2Lessons, section3Lessons } from './comprehensive-seed';
import { section4Lessons, section5Lessons, section6Lessons } from './seed-sections-4-6';
import { codingLessons } from './seed-coding-lessons';

const prisma = new PrismaClient();

// Combine all lesson sections (200 lessons total)
const allLessons = [
  ...section1Lessons, // Lessons 1-20: Foundation
  ...section2Lessons, // Lessons 21-40: Skill Building
  ...section3Lessons, // Lessons 41-60: Advanced Techniques
  ...section4Lessons, // Lessons 61-80: Speed & Fluency
  ...section5Lessons, // Lessons 81-95: Mastery
  ...section6Lessons, // Lessons 96-100: Programming
  ...codingLessons, // Lessons 101-200: Python, Java, C++, C
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
  console.log('🌱 Starting comprehensive database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing lessons and achievements...');
  await prisma.userLessonProgress.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.achievement.deleteMany({});

  // Seed all 100 lessons
  console.log('📝 Seeding 100 comprehensive lessons...');
  let lessonCount = 0;
  for (const lesson of allLessons) {
    const normalizedLesson = {
      ...lesson,
      unlockAfter: lesson.unlockAfter.map((dependency) => dependency.toString()),
    };

    await prisma.lesson.create({
      data: normalizedLesson,
    });
    lessonCount++;
    if (lessonCount % 10 === 0) {
      console.log(`   ✓ Created ${lessonCount} lessons...`);
    }
  }
  console.log(`✅ Created ${lessonCount} lessons across 10 sections`);

  // Seed achievements
  console.log('🏆 Seeding achievements...');
  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    });
  }
  console.log(`✅ Created ${achievements.length} achievements`);

  console.log('🎉 Comprehensive database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • Section 1 (Foundation): Lessons 1-20`);
  console.log(`   • Section 2 (Skill Building): Lessons 21-40`);
  console.log(`   • Section 3 (Advanced Techniques): Lessons 41-60`);
  console.log(`   • Section 4 (Speed & Fluency): Lessons 61-80`);
  console.log(`   • Section 5 (Mastery): Lessons 81-95`);
  console.log(`   • Section 6 (Programming): Lessons 96-100`);
  console.log(`   • Section 7 (Python): Lessons 101-125`);
  console.log(`   • Section 8 (Java): Lessons 126-150`);
  console.log(`   • Section 9 (C++): Lessons 151-175`);
  console.log(`   • Section 10 (C): Lessons 176-200`);
  console.log(`   • Total Achievements: ${achievements.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
