import { Difficulty, ExerciseType } from '@prisma/client';

export type LessonSeed = {
  level: number;
  order: number;
  section: number;
  title: string;
  description: string;
  keys: string[];
  difficulty: Difficulty;
  targetWpm: number;
  minAccuracy: number;
  exerciseType: ExerciseType;
  targetFingers: string[];
  unlockAfter: number[];
  content: string;
  isCheckpoint?: boolean;
};

/**
 * Derive the set of keys a lesson drills directly from its content.
 * This keeps `keys` consistent (the old hand-written lists were noisy/incomplete),
 * so the "keys to practice" UI and any key-based logic always match the text.
 */
export function deriveKeys(content: string): string[] {
  const seen = new Set<string>();
  for (const ch of content.toLowerCase()) seen.add(ch);
  return [...seen];
}
