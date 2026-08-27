/* eslint-disable no-console */
import { Difficulty, ExerciseType } from '@prisma/client';
import { deriveKeys } from './seed-utils';

// ============================================================================
// SECTION 4: SPEED & FLUENCY (Levels 61-70)
// ============================================================================

const section4Raw = [
  {
    level: 61, order: 1, section: 4,
    title: 'Speed Burst - Common Words',
    description: 'Rapid typing of frequent words.',
    difficulty: Difficulty.ADVANCED, targetWpm: 45, minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: [], unlockAfter: [],
    content: 'the and that have for with this from they will would about there which their',
  },
  {
    level: 62, order: 2, section: 4,
    title: 'Speed Burst - Bigrams',
    description: 'Flowing letter pairs at speed.',
    difficulty: Difficulty.ADVANCED, targetWpm: 48, minAccuracy: 95,
    exerciseType: ExerciseType.KEYS,
    targetFingers: [], unlockAfter: [],
    content: 'tion ing ent ion ally ment ous est ive able ance ence ical ation tial',
  },
  {
    level: 63, order: 3, section: 4,
    title: 'Flow Sentences',
    description: 'Light sentences to build cadence.',
    difficulty: Difficulty.ADVANCED, targetWpm: 45, minAccuracy: 96,
    exerciseType: ExerciseType.SENTENCES,
    targetFingers: [], unlockAfter: [],
    content: 'The wind moved through the trees and the lake turned to silver. We laughed and kept walking.',
  },
  {
    level: 64, order: 4, section: 4,
    title: 'News Headlines',
    description: 'Punchy, real-world phrasing.',
    difficulty: Difficulty.ADVANCED, targetWpm: 46, minAccuracy: 96,
    exerciseType: ExerciseType.SENTENCES,
    targetFingers: [], unlockAfter: [],
    content: 'Markets rose on strong earnings. A new bridge opened today. Scientists reported a key finding.',
  },
  {
    level: 65, order: 5, section: 4,
    title: 'Dialogue Sprint',
    description: 'Snappy back-and-forth lines.',
    difficulty: Difficulty.ADVANCED, targetWpm: 46, minAccuracy: 96,
    exerciseType: ExerciseType.SENTENCES,
    targetFingers: [], unlockAfter: [],
    content: '"Go now!" she said. "Wait for me," he replied. "Why?" "Because we are late," she answered.',
  },
  {
    level: 66, order: 6, section: 4,
    title: 'Product Copy',
    description: 'Marketing-style microcopy.',
    difficulty: Difficulty.ADVANCED, targetWpm: 48, minAccuracy: 96,
    exerciseType: ExerciseType.SENTENCES,
    targetFingers: [], unlockAfter: [],
    content: 'Built for speed. Designed for focus. Try it free for thirty days. Cancel anytime. Join thousands today.',
  },
  {
    level: 67, order: 7, section: 4,
    title: 'Technical Flow',
    description: 'API and config style text.',
    difficulty: Difficulty.ADVANCED, targetWpm: 46, minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: [], unlockAfter: [],
    content: 'api_key base_url retry_limit timeout_ms cache_ttl log_level feature_flag webhook_url',
  },
  {
    level: 68, order: 8, section: 4,
    title: 'Paragraph Sprint',
    description: 'One paragraph, paced for speed.',
    difficulty: Difficulty.EXPERT, targetWpm: 50, minAccuracy: 96,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'They shipped the feature on Friday and watched the graphs climb. By Monday the bug was found, fixed, and forgotten, and the team went back to building the next small, useful thing.',
  },
  {
    level: 69, order: 9, section: 4,
    title: 'Mixed Alphanumeric Sprint',
    description: 'Codes and sentences interleaved.',
    difficulty: Difficulty.EXPERT, targetWpm: 48, minAccuracy: 95,
    exerciseType: ExerciseType.SENTENCES,
    targetFingers: [], unlockAfter: [],
    content: 'Order #4821 shipped to zone B2. Token abc-9f3 expired at 12:00. Status: delivered, signature OK.',
  },
  {
    level: 70, order: 10, section: 4, isCheckpoint: true,
    title: 'Fluency Checkpoint',
    description: 'A long paragraph to cap the section.',
    difficulty: Difficulty.EXPERT, targetWpm: 52, minAccuracy: 97,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'Speed follows accuracy the way rivers follow gravity: quietly, then all at once. Type the line as it comes, let the mistakes fall away, and trust the rhythm you have earned through patient, daily practice.',
  },
];

// ============================================================================
// SECTION 5: MASTERY (Levels 81-88)
// ============================================================================

const section5Raw = [
  {
    level: 81, order: 1, section: 5,
    title: 'Dense Paragraph',
    description: 'A tightly written explanatory paragraph.',
    difficulty: Difficulty.EXPERT, targetWpm: 50, minAccuracy: 97,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'Caches store recent results so repeated requests return faster. A miss forces the slower path; a hit spares it. Size, eviction policy, and invalidation rules decide whether the cache helps or quietly hurts.',
  },
  {
    level: 82, order: 2, section: 5,
    title: 'Tutorial Voice',
    description: 'Friendly instructional prose.',
    difficulty: Difficulty.EXPERT, targetWpm: 50, minAccuracy: 97,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'First, create a project folder. Next, install the dependencies. Then run the dev server and open the local URL. You should see a welcome page; if not, check the terminal for errors.',
  },
  {
    level: 83, order: 3, section: 5,
    title: 'Concise Memo',
    description: 'Business writing under pressure.',
    difficulty: Difficulty.EXPERT, targetWpm: 52, minAccuracy: 97,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'Subject: Q3 plan. We will cut costs by ten percent, pause non-critical hires, and ship the mobile beta. Risks: vendor delay and regression in checkout. Owner: platform team.',
  },
  {
    level: 84, order: 4, section: 5,
    title: 'Story Excerpt',
    description: 'Literary, descriptive passages.',
    difficulty: Difficulty.EXPERT, targetWpm: 50, minAccuracy: 97,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'The lighthouse keeper counted the ships by the sound of their horns. Fog wrapped the cliff, and the lamp turned once, twice, throwing a weak gold coin of light across the water before the dark took it back.',
  },
  {
    level: 85, order: 5, section: 5,
    title: 'Spec Snippet',
    description: 'Requirements-style text with lists.',
    difficulty: Difficulty.EXPERT, targetWpm: 50, minAccuracy: 96,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'The service must accept JSON, validate the schema, and reject unknown fields. Latency p95 must stay under 200ms. On failure it returns a structured error with a stable code and a safe message.',
  },
  {
    level: 86, order: 6, section: 5,
    title: 'Debate Lines',
    description: 'Persuasive, varied sentences.',
    difficulty: Difficulty.EXPERT, targetWpm: 52, minAccuracy: 97,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'We should invest now, not later. The cost of waiting is compound, and the upside of early action is durable. Critics exaggerate the risk; the data, read honestly, points the other way.',
  },
  {
    level: 87, order: 7, section: 5,
    title: 'Science Note',
    description: 'Plain-language explanation.',
    difficulty: Difficulty.EXPERT, targetWpm: 50, minAccuracy: 97,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'Photosynthesis turns light, water, and carbon dioxide into sugar and oxygen. Leaves are the factory; chlorophyll is the panel. Without it, almost every food chain on Earth would stall.',
  },
  {
    level: 88, order: 8, section: 5, isCheckpoint: true,
    title: 'Mastery Checkpoint',
    description: 'A demanding multi-clause paragraph.',
    difficulty: Difficulty.EXPERT, targetWpm: 55, minAccuracy: 98,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: [], unlockAfter: [],
    content: 'Mastery is not the absence of error but the speed of recovery: you notice the slip, correct it without panic, and continue. The page fills, the rhythm holds, and the work that once felt impossible becomes merely the thing you do before lunch.',
  },
];

// ============================================================================
// SECTION 6: PROGRAMMING (Levels 96-100) — language-agnostic code
// ============================================================================

const section6Raw = [
  {
    level: 96, order: 1, section: 6,
    title: 'Variables and Types',
    description: 'Declare and assign values.',
    difficulty: Difficulty.INTERMEDIATE, targetWpm: 35, minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: [], unlockAfter: [],
    content: 'count = 0\nname = "ada"\nratio = 3.14\nitems = [1, 2, 3]\nactive = True',
  },
  {
    level: 97, order: 2, section: 6,
    title: 'Control Flow',
    description: 'Conditionals and loops.',
    difficulty: Difficulty.INTERMEDIATE, targetWpm: 35, minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: [], unlockAfter: [],
    content: 'if score > 90:\n    print("great")\nelse:\n    print("retry")\n\nfor i in range(5):\n    total += i',
  },
  {
    level: 98, order: 3, section: 6,
    title: 'Functions',
    description: 'Define and call a function.',
    difficulty: Difficulty.INTERMEDIATE, targetWpm: 36, minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: [], unlockAfter: [],
    content: 'def add(a, b):\n    return a + b\n\nresult = add(2, 3)\nprint(result)',
  },
  {
    level: 99, order: 4, section: 6,
    title: 'Data Structures',
    description: 'Maps and lists in code.',
    difficulty: Difficulty.ADVANCED, targetWpm: 36, minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: [], unlockAfter: [],
    content: 'user = {"id": 1, "name": "sam"}\nkeys = user.keys()\nvals = [v for v in user.values()]\nqueue = []\nqueue.append(user)',
  },
  {
    level: 100, order: 5, section: 6, isCheckpoint: true,
    title: 'Programming Checkpoint',
    description: 'A small complete routine.',
    difficulty: Difficulty.ADVANCED, targetWpm: 38, minAccuracy: 96,
    exerciseType: ExerciseType.CODE,
    targetFingers: [], unlockAfter: [],
    content: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))',
  },
];

export const section4Lessons = section4Raw.map((l) => ({ ...l, keys: deriveKeys(l.content) }));
export const section5Lessons = section5Raw.map((l) => ({ ...l, keys: deriveKeys(l.content) }));
export const section6Lessons = section6Raw.map((l) => ({ ...l, keys: deriveKeys(l.content) }));
