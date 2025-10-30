-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "isCheckpoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "section" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "targetFingers" TEXT[],
ADD COLUMN     "unlockAfter" TEXT[];

-- CreateTable
CREATE TABLE "typing_mistakes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "keyPressed" TEXT NOT NULL,
    "keyExpected" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fingerUsed" TEXT,

    CONSTRAINT "typing_mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_weak_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyChar" TEXT NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 1,
    "lastError" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_weak_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skill_assessments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallWpm" DOUBLE PRECISION NOT NULL,
    "overallAccuracy" DOUBLE PRECISION NOT NULL,
    "recommendedLevel" "SkillLevel" NOT NULL,
    "weakFingers" TEXT[],
    "problematicKeys" TEXT[],
    "fingerWpmScores" TEXT NOT NULL,
    "assessmentData" TEXT NOT NULL,

    CONSTRAINT "user_skill_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "typing_mistakes_userId_keyExpected_idx" ON "typing_mistakes"("userId", "keyExpected");

-- CreateIndex
CREATE INDEX "user_weak_keys_userId_errorCount_idx" ON "user_weak_keys"("userId", "errorCount");

-- CreateIndex
CREATE UNIQUE INDEX "user_weak_keys_userId_keyChar_key" ON "user_weak_keys"("userId", "keyChar");

-- CreateIndex
CREATE INDEX "user_skill_assessments_userId_assessmentDate_idx" ON "user_skill_assessments"("userId", "assessmentDate");

-- CreateIndex
CREATE INDEX "lessons_section_order_idx" ON "lessons"("section", "order");

-- AddForeignKey
ALTER TABLE "typing_mistakes" ADD CONSTRAINT "typing_mistakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_mistakes" ADD CONSTRAINT "typing_mistakes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_weak_keys" ADD CONSTRAINT "user_weak_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_assessments" ADD CONSTRAINT "user_skill_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
