'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  Star,
  ArrowLeft,
  Trophy,
  Target,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisualKeyboard } from '@/components/VisualKeyboard';

interface Lesson {
  id: string;
  level: number;
  title: string;
  description: string;
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  content: string;
  section: number;
  isCheckpoint: boolean;
  targetFingers?: string[];
}

interface TypingMistake {
  keyPressed: string;
  keyExpected: string;
  fingerUsed?: string;
}

interface WeakKeyAnalysis {
  key: string;
  errorCount: number;
}

export default function LessonPracticePage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'initial' | 'typing' | 'results' | 'analysis'>('initial');
  const [isSaving, setIsSaving] = useState(false);

  // Typing state
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [, setEndTime] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState<TypingMistake[]>([]);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [lastPressedKey, setLastPressedKey] = useState('');
  const [isCorrectKey, setIsCorrectKey] = useState(false);

  // Analysis state
  const [weakKeyAnalysis, setWeakKeyAnalysis] = useState<WeakKeyAnalysis[]>([]);
  const [practiceText, setPracticeText] = useState('');

  // Fetch lesson
  useEffect(() => {
    async function fetchLesson() {
      try {
        const response = await fetch(`http://localhost:5000/api/v1/lessons/${lessonId}`);
        const data = await response.json();
        setLesson(data.lesson);
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId]);

  const handleStart = useCallback(() => {
    setView('typing');
    setStartTime(Date.now());
    setUserInput('');
    setCurrentIndex(0);
    setMistakes([]);
    setWpm(0);
    setAccuracy(100);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!lesson || !startTime) return;

      const key = e.key;

      // Ignore special keys except Backspace
      if (key.length > 1 && key !== 'Backspace') return;

      if (key === 'Backspace') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setUserInput((prev) => prev.slice(0, -1));
        }
        return;
      }

      const expectedChar = lesson.content[currentIndex];
      const typedChar = key;

      // Track mistake
      if (typedChar !== expectedChar) {
        setMistakes((prev) => [
          ...prev,
          {
            keyPressed: typedChar,
            keyExpected: expectedChar,
            fingerUsed: getFingerForKey(expectedChar),
          },
        ]);
      }

      setLastPressedKey(typedChar);
      setIsCorrectKey(typedChar === expectedChar);
      setTimeout(() => setLastPressedKey(''), 200);

      setUserInput((prev) => prev + typedChar);
      setCurrentIndex((prev) => prev + 1);

      // Calculate real-time WPM and accuracy
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
      const charsTyped = currentIndex + 1;
      const wordsTyped = charsTyped / 5;
      const currentWpm = Math.round(wordsTyped / timeElapsed);
      const currentAccuracy = ((charsTyped - mistakes.length) / charsTyped) * 100;

      setWpm(currentWpm);
      setAccuracy(currentAccuracy);

      // Check if test is complete
      if (currentIndex + 1 >= lesson.content.length) {
        completeLesson(typedChar === expectedChar);
      }
    },
    [lesson, startTime, currentIndex, mistakes.length]
  );

  const completeLesson = async (lastCharCorrect: boolean) => {
    if (!lesson || !startTime) return;

    const end = Date.now();
    setEndTime(end);

    const timeSpent = (end - startTime) / 1000;
    const totalChars = lesson.content.length;
    const finalMistakes = lastCharCorrect
      ? mistakes
      : [...mistakes, { keyPressed: '', keyExpected: lesson.content[lesson.content.length - 1] }];
    const correctChars = totalChars - finalMistakes.length;
    const finalAccuracy = (correctChars / totalChars) * 100;
    const finalWpm = Math.round(totalChars / 5 / (timeSpent / 60));

    setWpm(finalWpm);
    setAccuracy(finalAccuracy);

    // Log mistakes to backend
    try {
      const userId = 'demo-user-id'; // Replace with actual auth

      if (finalMistakes.length > 0) {
        await fetch('http://localhost:5000/api/v1/mistakes/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            lessonId: lesson.id,
            mistakes: finalMistakes,
          }),
        });

        // Fetch analysis
        const analysisRes = await fetch(
          `http://localhost:5000/api/v1/mistakes/analysis/${userId}?limit=5`
        );
        const analysisData = await analysisRes.json();
        setWeakKeyAnalysis(analysisData.weakKeys || []);

        // Fetch practice text
        const practiceRes = await fetch(`http://localhost:5000/api/v1/mistakes/practice/${userId}`);
        const practiceData = await practiceRes.json();
        setPracticeText(practiceData.practiceText || '');
      }
    } catch (error) {
      console.error('Failed to log mistakes:', error);
    }

    setView('results');
  };

  const handleSaveProgress = async () => {
    if (!lesson) return;

    setIsSaving(true);

    try {
      // TODO: Save lesson progress when auth is implemented
      // await lessonAPI.saveLessonProgress({
      //   lessonId: lesson.id,
      //   wpm,
      //   accuracy,
      //   completed: accuracy >= lesson.minAccuracy && wpm >= lesson.targetWpm
      // });
      // Save to backend (requires auth)
      // await lessonAPI.saveLessonProgress({ lessonId: lesson.id, wpm, accuracy, completed });

      if (mistakes.length > 0) {
        setView('analysis');
      } else {
        router.push('/learn');
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateStars = () => {
    if (!lesson) return 0;
    if (accuracy < lesson.minAccuracy || wpm < lesson.targetWpm) return 0;
    if (wpm >= lesson.targetWpm * 1.5 && accuracy >= 98) return 3;
    if (wpm >= lesson.targetWpm * 1.2 && accuracy >= 95) return 2;
    return 1;
  };

  const getCharStatus = (index: number) => {
    if (index >= userInput.length) return 'pending';
    if (userInput[index] === lesson?.content[index]) return 'correct';
    return 'incorrect';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">Lesson not found</p>
        <Button onClick={() => router.push('/learn')}>Back to Lessons</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button variant="ghost" onClick={() => router.push('/learn')} className="mb-4">
        <ArrowLeft className="mr-2" size={16} />
        Back to Lessons
      </Button>

      <AnimatePresence mode="wait">
        {view === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="px-2 py-1 bg-primary/10 rounded text-primary font-medium">
                  Level {lesson.level}
                </span>
                <span className="px-2 py-1 bg-secondary rounded capitalize">
                  {lesson.difficulty}
                </span>
                {lesson.isCheckpoint && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded font-medium flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Checkpoint
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
              <p className="text-lg text-muted-foreground">{lesson.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="text-primary" size={20} />
                  <span className="font-semibold">Target Speed</span>
                </div>
                <p className="text-3xl font-bold">{lesson.targetWpm} WPM</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="text-yellow-500" size={20} />
                  <span className="font-semibold">Min Accuracy</span>
                </div>
                <p className="text-3xl font-bold">{lesson.minAccuracy}%</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="text-green-500" size={20} />
                  <span className="font-semibold">Section</span>
                </div>
                <p className="text-3xl font-bold">{lesson.section}</p>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Lesson Text:</h3>
              <p className="font-mono text-lg text-muted-foreground leading-relaxed">
                {lesson.content}
              </p>
            </div>

            {lesson.targetFingers && lesson.targetFingers.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Focus Fingers:</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This lesson focuses on: {lesson.targetFingers.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button size="lg" onClick={handleStart} className="w-full md:w-auto px-12">
              Start Lesson
            </Button>
          </motion.div>
        )}

        {view === 'typing' && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{lesson.title}</h2>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Speed</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{wpm}</p>
                  <p className="text-xs text-muted-foreground">WPM</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p
                    className={`text-3xl font-bold ${accuracy >= 95 ? 'text-green-600 dark:text-green-400' : accuracy >= 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {accuracy.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-8">
              <div className="mb-4 flex justify-between text-sm text-muted-foreground">
                <span>
                  Progress: {currentIndex} / {lesson.content.length}
                </span>
                <span>Mistakes: {mistakes.length}</span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentIndex / lesson.content.length) * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              <div className="font-mono text-2xl leading-relaxed mb-6">
                {lesson.content.split('').map((char, index) => {
                  const status = getCharStatus(index);
                  return (
                    <span
                      key={index}
                      className={`
                        ${index === currentIndex ? 'bg-blue-200 dark:bg-blue-800 px-1' : ''}
                        ${status === 'correct' ? 'text-green-600 dark:text-green-400' : ''}
                        ${status === 'incorrect' ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1' : ''}
                        ${status === 'pending' ? 'text-gray-400 dark:text-gray-600' : ''}
                      `}
                    >
                      {char === ' ' ? 'Â·' : char}
                    </span>
                  );
                })}
              </div>

              <textarea
                autoFocus
                value={userInput}
                onKeyDown={handleKeyPress}
                onChange={() => {}}
                className="w-full h-32 p-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-lg resize-none"
                placeholder="Start typing here..."
              />
            </div>

            <VisualKeyboard
              targetKey={lesson.content[currentIndex]}
              pressedKey={lastPressedKey}
              isCorrect={isCorrectKey}
              showHomeRowMarkers={true}
            />
          </motion.div>
        )}

        {view === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
              >
                <h2 className="text-4xl font-bold mb-2">
                  {calculateStars() > 0 ? 'ðŸŽ‰ Excellent Work!' : 'ðŸ’ª Good Effort!'}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {calculateStars() > 0
                    ? 'You met the lesson requirements!'
                    : 'Keep practicing to improve your performance'}
                </p>
              </motion.div>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((star) => (
                <motion.div
                  key={star}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: star * 0.1, type: 'spring' }}
                >
                  <Star
                    size={56}
                    className={
                      star <= calculateStars()
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card border rounded-lg p-6 text-center"
              >
                <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Speed</p>
                <p className="text-4xl font-bold">{wpm}</p>
                <p className="text-xs text-muted-foreground mt-1">Target: {lesson.targetWpm}</p>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card border rounded-lg p-6 text-center"
              >
                <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                <p className="text-4xl font-bold">{accuracy.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Target: {lesson.minAccuracy}%</p>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-card border rounded-lg p-6 text-center"
              >
                <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Mistakes</p>
                <p className="text-4xl font-bold">{mistakes.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  of {lesson.content.length} chars
                </p>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-card border rounded-lg p-6 text-center"
              >
                <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Stars Earned</p>
                <p className="text-4xl font-bold">{calculateStars()}</p>
                <p className="text-xs text-muted-foreground mt-1">Max: 3</p>
              </motion.div>
            </div>

            {mistakes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
              >
                <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  ðŸ“Š We detected some mistakes
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Click "View Analysis" to see which keys you should practice more.
                </p>
              </motion.div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setView('initial');
                  setUserInput('');
                  setCurrentIndex(0);
                  setMistakes([]);
                }}
              >
                Try Again
              </Button>
              <Button onClick={handleSaveProgress} disabled={isSaving}>
                {isSaving ? 'Saving...' : mistakes.length > 0 ? 'View Analysis' : 'Continue'}
              </Button>
            </div>
          </motion.div>
        )}

        {view === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Mistake Analysis</h2>
              <p className="text-muted-foreground">
                Here are the keys you should focus on improving
              </p>
            </div>

            {weakKeyAnalysis.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  Your Weak Keys
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {weakKeyAnalysis.map((item) => (
                    <div
                      key={item.key}
                      className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 text-center"
                    >
                      <p className="text-3xl font-mono font-bold text-red-600 dark:text-red-400 mb-1">
                        {item.key}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.errorCount} {item.errorCount === 1 ? 'error' : 'errors'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {practiceText && (
              <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Recommended Practice
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Practice this text to improve your weak keys:
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="font-mono text-lg">{practiceText}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push('/learn')}>
                Back to Lessons
              </Button>
              <Button
                onClick={() => {
                  setView('initial');
                  setUserInput('');
                  setCurrentIndex(0);
                  setMistakes([]);
                }}
              >
                Practice This Lesson Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to determine which finger should be used for a key
function getFingerForKey(key: string): string {
  const fingerMap: Record<string, string> = {
    '`': 'pinky-left',
    '1': 'pinky-left',
    q: 'pinky-left',
    a: 'pinky-left',
    z: 'pinky-left',
    '2': 'ring-left',
    w: 'ring-left',
    s: 'ring-left',
    x: 'ring-left',
    '3': 'middle-left',
    e: 'middle-left',
    d: 'middle-left',
    c: 'middle-left',
    '4': 'index-left',
    '5': 'index-left',
    r: 'index-left',
    t: 'index-left',
    f: 'index-left',
    g: 'index-left',
    v: 'index-left',
    b: 'index-left',
    '6': 'index-right',
    '7': 'index-right',
    y: 'index-right',
    u: 'index-right',
    h: 'index-right',
    j: 'index-right',
    n: 'index-right',
    m: 'index-right',
    '8': 'middle-right',
    i: 'middle-right',
    k: 'middle-right',
    ',': 'middle-right',
    '9': 'ring-right',
    o: 'ring-right',
    l: 'ring-right',
    '.': 'ring-right',
    '0': 'pinky-right',
    '-': 'pinky-right',
    '=': 'pinky-right',
    p: 'pinky-right',
    '[': 'pinky-right',
    ']': 'pinky-right',
    ';': 'pinky-right',
    "'": 'pinky-right',
    '/': 'pinky-right',
  };
  return fingerMap[key.toLowerCase()] || 'unknown';
}

