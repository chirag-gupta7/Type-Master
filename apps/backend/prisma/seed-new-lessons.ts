/* eslint-disable no-console */
import { PrismaClient, Difficulty, ExerciseType } from '@prisma/client';

const prisma = new PrismaClient();

// New Sections
// 11: Advanced Punctuation (levels/orders 201-210)
// 12: Code Syntax (levels/orders 211-220)
// 13: Speed Drills (levels/orders 221-230)

const commonFingers = [
  'pinky-left',
  'ring-left',
  'middle-left',
  'index-left',
  'index-right',
  'middle-right',
  'ring-right',
  'pinky-right',
];

const advancedPunctuationLessons = [
  {
    level: 201,
    order: 201,
    section: 11,
    title: 'Curly Brace Control',
    description: 'Build precision with curly braces and paired symbols.',
    keys: ['{', '}', '[', ']', ';'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 45,
    minAccuracy: 93,
    exerciseType: ExerciseType.KEYS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      '{ { { } } } { } [ ] ; { } ; { [ ] } { } { } { [ ] } ; { { } } [ ] { } ; { [ ] } { } { } ; { } { } [ ] [ ] ;',
  },
  {
    level: 202,
    order: 202,
    section: 11,
    title: 'Bracket Weaving',
    description: 'Alternate brackets, braces, and semicolons for clean punctuation flow.',
    keys: ['[', ']', '{', '}', ';'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 48,
    minAccuracy: 94,
    exerciseType: ExerciseType.KEYS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      '[{]; [}]; {[]}; {}; []; {{}}; [{}]; {;}; [;]; {[]} ;; []{} ;;; [][[]] {{}} ;; {[]} []{} [;]',
  },
  {
    level: 203,
    order: 203,
    section: 11,
    title: 'Semicolon Rhythm',
    description: 'Practice semicolon placement with balanced surrounding symbols.',
    keys: [';', '{', '}', '[', ']'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 50,
    minAccuracy: 94,
    exerciseType: ExerciseType.KEYS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      '; {;}; [;]; {;}; []; ;{}; ;[]; {;} ;{;} ;[{]} ;; ;{};; [;] ;; {}; ;[]; {;} ;{;} ;; {[]} ;',
  },
  {
    level: 204,
    order: 204,
    section: 11,
    title: 'Punctuation Chains',
    description: 'Chain mixed punctuation to improve balance and timing.',
    keys: ['{', '}', '[', ']', ';', ':'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 52,
    minAccuracy: 94,
    exerciseType: ExerciseType.KEYS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      '{:}; [;]; {:}; [::]; {;:}; []{};; ::;; {[]};; {{}}:: []; {}; [;:]; {;}; [;]; {::} ;; [];',
  },
  {
    level: 205,
    order: 205,
    section: 11,
    title: 'Brace Blocks',
    description: 'Hold structure while repeating nested brace blocks.',
    keys: ['{', '}', '[', ']'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 55,
    minAccuracy: 95,
    exerciseType: ExerciseType.KEYS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      '{{}} [{}] {{[]}} {[]} [{}{}] {[][]} {{}} {[]} [[]] {{}} [{}] {[]} [[]] {{[]}} {[]} {{}} [[]] {[]} {{}}',
  },
  {
    level: 206,
    order: 206,
    section: 11,
    title: 'Delimiter Dance',
    description: 'Switch quickly between delimiters to reduce hesitation.',
    keys: ['{', '}', '[', ']', ';', ':'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 58,
    minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'function demo() { const map = { key: [1,2,3], brace: true }; for (let i = 0; i < map.key.length; i++) { map.key[i]++; } return map; }; ensureClean(); stabilize(); { [] {} ; : } patterns repeat smoothly.',
  },
  {
    level: 207,
    order: 207,
    section: 11,
    title: 'Mixed Nesting',
    description: 'Navigate nested structures with steady punctuation accuracy.',
    keys: ['{', '}', '[', ']', '(', ')', ';'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 60,
    minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'const layout = { slots: [{ id: 1, items: [] }, { id: 2, items: [1,2] }], meta: () => ({ ok: true }) }; layout.slots.forEach((slot) => { if (!slot.items.length) { slot.items.push(0); } }); finalize(layout);',
  },
  {
    level: 208,
    order: 208,
    section: 11,
    title: 'Precision Semicolons',
    description: 'Place semicolons at line ends while tracking braces.',
    keys: [';', '{', '}', '[', ']'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 62,
    minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'const queue = []; for (let i = 0; i < 5; i++) { queue.push({ id: i, payload: [i, i + 1] }); }; while (queue.length) { const item = queue.shift(); process(item); if (item.payload.length > 1) { queue.push({ id: item.id + 10, payload: [] }); }; };',
  },
  {
    level: 209,
    order: 209,
    section: 11,
    title: 'Punctuation Flow',
    description: 'Sustain rhythm across structured punctuation sentences.',
    keys: ['{', '}', '[', ']', ';', ':'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 64,
    minAccuracy: 95,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'Clean punctuation keeps code readable: align { blocks }, keep [] arrays tidy, end statements with ; and reserve : for intent. Practice pairing symbols without pausing so fingers learn to glide. Flow through structured text and keep shoulders relaxed while cadence stays even across every bracket pair.',
  },
  {
    level: 210,
    order: 210,
    section: 11,
    title: 'Advanced Punctuation Checkpoint',
    description: 'Checkpoint to validate accuracy on dense punctuation.',
    keys: ['{', '}', '[', ']', ';'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 66,
    minAccuracy: 96,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    isCheckpoint: true,
    content:
      'export function format(input: Array<{ id: number; values: number[] }>) { const result = []; for (const item of input) { if (!item.values.length) { result.push({ id: item.id, status: "empty" }); continue; } const sum = item.values.reduce((a, b) => a + b, 0); result.push({ id: item.id, status: sum > 10 ? "rich" : "lean" }); } return result; }',
  },
];

const codeSyntaxLessons = [
  {
    level: 211,
    order: 211,
    section: 12,
    title: 'JavaScript Loops',
    description: 'Warm up with JS loops and conditionals.',
    keys: ['f', 'o', 'r', '{', '}', '(', ')', ';'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 52,
    minAccuracy: 94,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'for (let i = 0; i < 10; i++) { const squared = i * i; if (squared % 2 === 0) { console.log("even", squared); } else { console.log("odd", squared); } }
      const items = ["alpha", "beta", "gamma"]; items.forEach((item) => console.log(item));',
  },
  {
    level: 212,
    order: 212,
    section: 12,
    title: 'JavaScript Promises',
    description: 'Type async/await patterns with chained handlers.',
    keys: ['a', 'w', 'a', 'i', 't', '{', '}', '(', ')'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 54,
    minAccuracy: 94,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'async function fetchUser(id: number) { const res = await fetch(`/api/user/${id}`); if (!res.ok) throw new Error("failed"); return res.json(); }
      fetchUser(7).then((user) => console.log(user.name)).catch((err) => console.error(err));',
  },
  {
    level: 213,
    order: 213,
    section: 12,
    title: 'Python Loops',
    description: 'Practice Python loops and list comprehensions.',
    keys: ['f', 'o', 'r', 'i', 'n', ':', '[', ']'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 52,
    minAccuracy: 94,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'numbers = [1, 2, 3, 4, 5]
for n in numbers:
    doubled = n * 2
    if doubled % 3 == 0:
        print("triple", doubled)
    else:
        print("plain", doubled)

squares = [n * n for n in range(1, 8)]
print(squares)',
  },
  {
    level: 214,
    order: 214,
    section: 12,
    title: 'Python Functions',
    description: 'Compose Python functions with dictionaries.',
    keys: ['d', 'e', 'f', '(', ')', '{', '}', '[', ']'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 54,
    minAccuracy: 94,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'def summarize(scores):
    total = sum(scores.values())
    average = total / len(scores)
    return {"total": total, "average": average}

scores = {"alice": 88, "bob": 92, "carlos": 81}
print(summarize(scores))',
  },
  {
    level: 215,
    order: 215,
    section: 12,
    title: 'HTML Structure',
    description: 'Type semantic HTML with nested elements.',
    keys: ['<', '>', '/', '=', '"'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 50,
    minAccuracy: 93,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      '<section class="hero"><div class="wrap"><h1>TypeMaster</h1><p>Practice speed, accuracy, and rhythm with real content.</p><button aria-label="start">Begin</button></div></section><footer><nav><a href="/learn">Learn</a><a href="/test">Test</a></nav></footer>',
  },
  {
    level: 216,
    order: 216,
    section: 12,
    title: 'HTML Forms',
    description: 'Compose accessible forms with labels and inputs.',
    keys: ['<', '>', '/', '=', '"', '-'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 52,
    minAccuracy: 94,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      '<form action="/signup" method="post"><label for="email">Email</label><input id="email" name="email" type="email" required /><label for="password">Password</label><input id="password" name="password" type="password" minlength="8" required /><button type="submit">Create account</button></form>',
  },
  {
    level: 217,
    order: 217,
    section: 12,
    title: 'JavaScript Objects',
    description: 'Shape objects and destructure values.',
    keys: ['{', '}', '[', ']', ':', ','],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 56,
    minAccuracy: 94,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'const profile = { name: "Ava", skills: ["typing", "javascript"], links: { site: "https://example.com", github: "https://github.com/ava" } };
const { name, skills, links } = profile;
console.log(name, skills.join(", "), links.site);',
  },
  {
    level: 218,
    order: 218,
    section: 12,
    title: 'Python Data Classes',
    description: 'Type Python dataclass declarations and usage.',
    keys: ['@', 'c', 'l', 'a', 's', 's', ':'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 56,
    minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'from dataclasses import dataclass

@dataclass
class Lesson:
    id: int
    title: str
    wpm: int
    accuracy: int

def describe(lesson: Lesson) -> str:
    return f"{lesson.title} targets {lesson.wpm} wpm at {lesson.accuracy}% accuracy"

print(describe(Lesson(1, "Home Row", 25, 95)))',
  },
  {
    level: 219,
    order: 219,
    section: 12,
    title: 'JS Array Methods',
    description: 'Drill common JS array helpers.',
    keys: ['m', 'a', 'p', 'f', 'i', 'l', 't', 'e', 'r'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 58,
    minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'const scores = [55, 63, 72, 91, 88];
const fast = scores.filter((s) => s > 70).map((s) => s + 5);
const total = scores.reduce((sum, s) => sum + s, 0);
console.log({ fast, total, average: total / scores.length });',
  },
  {
    level: 220,
    order: 220,
    section: 12,
    title: 'Code Syntax Checkpoint',
    description: 'Checkpoint with mixed JS, Python, and HTML snippets.',
    keys: ['{', '}', '(', ')', '<', '>', '/', '=', '"'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 60,
    minAccuracy: 95,
    exerciseType: ExerciseType.CODE,
    targetFingers: commonFingers,
    unlockAfter: [],
    isCheckpoint: true,
    content:
      'const api = async () => { const res = await fetch("/api/lessons"); return res.ok ? res.json() : []; };
layout = """<article><h2>Speed Drills</h2><p>Practice every day.</p></article>"""
print(api)
<form><input name="q" /><button>Search</button></form>',
  },
];

const speedDrillLessons = [
  {
    level: 221,
    order: 221,
    section: 13,
    title: 'Bigrams Warmup',
    description: 'High-frequency bigrams to build cadence.',
    keys: ['t', 'h', 'e', 'a', 'n'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 58,
    minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'the the an an th he at ta ha ah en ne te et he the an an the the an the he the an he the an the he an the the',
  },
  {
    level: 222,
    order: 222,
    section: 13,
    title: 'Trigram Flow',
    description: 'Common trigrams repeated for smooth speed.',
    keys: ['t', 'h', 'e', 'a', 'n', 'd'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 60,
    minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'the and the and the and then and the and the end and the and and then the end and the and and the the and then and',
  },
  {
    level: 223,
    order: 223,
    section: 13,
    title: 'High-Frequency Words',
    description: 'Speed on top 50 English words.',
    keys: ['t', 'h', 'e', 'a', 'o', 'i', 'n'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 62,
    minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'the of and to a in that is was he for it with as his on be at by i this had not are but from or have an they which one you',
  },
  {
    level: 224,
    order: 224,
    section: 13,
    title: 'Rolling Quads',
    description: 'Roll across the keyboard with quad sequences.',
    keys: ['f', 'j', 'k', 'd', 'l', 's'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 64,
    minAccuracy: 95,
    exerciseType: ExerciseType.KEYS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'fjkd fjkd jklf djsk flkd sjdf kjfd lksj fdjk sjdl fkjs lkdj jfkd sklj dfjk skjf jkld fjkd slfj dkfj sljk fjkd kdjf',
  },
  {
    level: 225,
    order: 225,
    section: 13,
    title: 'Alternating Hands',
    description: 'Alternate hands to maintain rhythm at speed.',
    keys: ['f', 'j', 'd', 'k', 's', 'l', 'a'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 65,
    minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'fad jad fad jad dad jad fad jad sad lad lad sad fad jad kad lad fad jad fad jad lad lad fad jad lad fad jad lad fad',
  },
  {
    level: 226,
    order: 226,
    section: 13,
    title: 'Speed Sentences',
    description: 'Short sentences packed with frequent patterns.',
    keys: ['t', 'h', 'e', 'a', 'n', 'd', 's'],
    difficulty: Difficulty.INTERMEDIATE,
    targetWpm: 66,
    minAccuracy: 95,
    exerciseType: ExerciseType.SENTENCES,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'the sand and sea are near and the sun sets then the wind shifts and the sand drifts the hands stay light and the keys sing as the pace holds steady and smooth across the line',
  },
  {
    level: 227,
    order: 227,
    section: 13,
    title: 'Number Tempo',
    description: 'Blend numbers with high-frequency words.',
    keys: ['1', '2', '3', '4', '5', 't', 'h', 'e'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 67,
    minAccuracy: 95,
    exerciseType: ExerciseType.WORDS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'one two three four five the the three five two one the four three two one five the two three four five the one two three four five the the the',
  },
  {
    level: 228,
    order: 228,
    section: 13,
    title: 'Symbol Sprints',
    description: 'Mix letters with quick symbol taps.',
    keys: ['-', '_', '/', '.', ',', 't', 'h', 'e'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 68,
    minAccuracy: 96,
    exerciseType: ExerciseType.WORDS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'the-path/the_path the, path. the-path the_path /the-path the.path the_path the-path the_path the-path the path the-path the_path the-path the_path',
  },
  {
    level: 229,
    order: 229,
    section: 13,
    title: 'Speed Paragraph',
    description: 'Sustain speed through a dense paragraph.',
    keys: ['t', 'h', 'e', 'a', 'n', 'd', 's', 'o'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 70,
    minAccuracy: 96,
    exerciseType: ExerciseType.PARAGRAPHS,
    targetFingers: commonFingers,
    unlockAfter: [],
    content:
      'Speed comes from relaxed rhythm. The hands stay low, the wrists stay neutral, and the eyes scan ahead. The best typists trust the pattern of motion more than force. They let the flow carry them and keep breaths steady so the pace holds even through complex strings of text and numbers.',
  },
  {
    level: 230,
    order: 230,
    section: 13,
    title: 'Speed Drills Checkpoint',
    description: 'Checkpoint combining bigrams, words, and numbers at pace.',
    keys: ['t', 'h', 'e', 'a', 'n', 'd', '1', '2', '3'],
    difficulty: Difficulty.ADVANCED,
    targetWpm: 72,
    minAccuracy: 96,
    exerciseType: ExerciseType.SENTENCES,
    targetFingers: commonFingers,
    unlockAfter: [],
    isCheckpoint: true,
    content:
      'the 123 pace and the hand glide then the sand and sea blend with 23 quick taps the rhythm holds at seventy plus while accuracy stays sharp; finish strong with clear strokes and calm timing',
  },
];

const newLessons = [...advancedPunctuationLessons, ...codeSyntaxLessons, ...speedDrillLessons];

async function main() {
  console.log('🌱 Seeding new lessons for sections 11-13...');

  console.log('🧹 Removing existing lessons in sections 11, 12, 13 to avoid duplicates...');
  await prisma.lesson.deleteMany({
    where: {
      section: { in: [11, 12, 13] },
    },
  });

  let created = 0;
  for (const lesson of newLessons) {
    const normalizedLesson = {
      ...lesson,
      unlockAfter: lesson.unlockAfter.map((dependency) => dependency.toString()),
    };

    await prisma.lesson.create({ data: normalizedLesson });
    created++;
    if (created % 5 === 0) {
      console.log(`   ✓ Created ${created} lessons...`);
    }
  }

  console.log(`✅ Created ${created} lessons across sections 11-13`);
}

main()
  .catch((e) => {
    console.error('❌ Error during new lesson seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
