'use client';

import { useEffect, useState, useCallback, useRef, ComponentType } from 'react';
import { useTypingStore } from '@/store';
import { lessonAPI } from '@/lib/api';
import { VisualKeyboard } from '@/components/VisualKeyboard';
import { HandPositionGuide } from '@/components/HandPositionGuide';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, Trophy, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Lazy-load react-confetti with a small typed interface to avoid using `any`
// NOTE: ambient module declarations must live in a .d.ts file (e.g. src/types/react-confetti.d.ts).
// If you need a local declaration, create that .d.ts file with the `declare module 'react-confetti' { ... }`
// and remove any in-file declaration to avoid "Invalid module name in augmentation" errors.

interface ReactConfettiProps {
  width?: number;
  height?: number;
  recycle?: boolean;
  numberOfPieces?: number;
  gravity?: number;
}
const Confetti: ComponentType<ReactConfettiProps> = dynamic(() => import('react-confetti'), {
  ssr: false,
}) as unknown as ComponentType<ReactConfettiProps>;
interface Lesson {
  id: string;
  level: number;
  order: number;
  title: string;
  description: string;
  keys: string[];
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  exerciseType: string;
  content: string;
}

interface LessonTypingInterfaceProps {
  lesson: Lesson;
  onComplete?: (stats: { wpm: number; accuracy: number; stars: number }) => void;
  onTryAgain?: () => void;
  showKeyboard?: boolean;
  className?: string;
}

/**
 * LessonTypingInterface Component
 *
 * A comprehensive typing interface for lessons with:
 * - Character-by-character text display with highlighting
 * - Visual keyboard with next key highlighted
 * - Real-time WPM and accuracy tracking
 * - Visual feedback for correct/incorrect keypresses
 * - Progress bar for lesson completion
 * - Try Again and Complete Lesson buttons
 * - Zustand state management
 * - lessonAPI integration
 */
export function LessonTypingInterface({
  lesson,
  onComplete,
  onTryAgain,
  showKeyboard = true,
  className,
}: LessonTypingInterfaceProps) {
  const {
    status,
    textToType,
    userInput,
    wpm,
    accuracy,
    errors,
    startTest,
    setUserInput,
    resetTest,
  } = useTypingStore();

  const [lastKey, setLastKey] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [savedProgress, setSavedProgress] = useState(false);
  const [stars, setStars] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewport({ width: Math.round(rect.width), height: Math.round(rect.height) });
      } else if (typeof window !== 'undefined') {
        setViewport({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Initialize the test with lesson content
  useEffect(() => {
    startTest(lesson.content);
    return () => {
      resetTest();
    };
  }, [lesson.content, startTest, resetTest]);

  // Calculate stars based on performance
  const calculateStars = useCallback(
    (finalWpm: number, finalAccuracy: number): number => {
      const { targetWpm, minAccuracy } = lesson;

      // No stars if below minimum requirements
      if (finalWpm < targetWpm || finalAccuracy < minAccuracy) {
        return 0;
      }

      // 3 stars: Exceed target by 50% with 98%+ accuracy
      if (finalWpm >= targetWpm * 1.5 && finalAccuracy >= 98) {
        return 3;
      }

      // 2 stars: Exceed target by 20% with 95%+ accuracy
      if (finalWpm >= targetWpm * 1.2 && finalAccuracy >= 95) {
        return 2;
      }

      // 1 star: Meet target with minimum accuracy
      return 1;
    },
    [lesson]
  );

  // Save progress to backend when test is finished
  useEffect(() => {
    if (status === 'finished' && !savedProgress && !isSaving) {
      const earnedStars = calculateStars(wpm, accuracy);
      setStars(earnedStars);

      const saveProgress = async () => {
        setIsSaving(true);
        try {
          await lessonAPI.saveLessonProgress({
            lessonId: lesson.id,
            wpm,
            accuracy,
            completed: earnedStars > 0,
          });
          setSavedProgress(true);
          setShowConfetti(earnedStars > 0);

          // Call onComplete callback if provided
          if (onComplete) {
            onComplete({ wpm, accuracy, stars: earnedStars });
          }
        } catch (error) {
          console.error('Failed to save lesson progress:', error);
        } finally {
          setIsSaving(false);
        }
      };

      saveProgress();
    }
  }, [status, savedProgress, isSaving, wpm, accuracy, lesson.id, calculateStars, onComplete]);

  useEffect(() => {
    if (!showConfetti) return;
    const timer = setTimeout(() => setShowConfetti(false), 4500);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  // Handle keyboard input
  useEffect(() => {
    if (status === 'finished') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for most keys
      if (!['F5', 'F12'].includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
      }

      const key = e.key;

      // Ignore modifier keys
      if (['Control', 'Alt', 'Meta', 'Shift', 'CapsLock'].includes(key)) {
        return;
      }

      // Handle backspace
      if (key === 'Backspace') {
        const newInput = userInput.slice(0, -1);
        setUserInput(newInput);
        setLastKey('Backspace');
        setIsCorrect(undefined);
        setTimeout(() => {
          setLastKey('');
        }, 200);
        return;
      }

      // Ignore other special keys
      if (key.length > 1 && key !== 'Enter' && key !== ' ') {
        return;
      }

      // Get the expected character
      const expectedChar = textToType[userInput.length];

      // Check if the key press is correct
      const correct = key === expectedChar;
      setIsCorrect(correct);
      setLastKey(key);

      // Only add to input if correct
      if (correct) {
        setUserInput(userInput + key);
      }

      // Reset feedback after animation
      setTimeout(() => {
        setLastKey('');
        setIsCorrect(undefined);
      }, 300);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, userInput, textToType, setUserInput]);

  // Handle try again
  const handleTryAgain = () => {
    setSavedProgress(false);
    setStars(0);
    resetTest();
    startTest(lesson.content);
    if (onTryAgain) {
      onTryAgain();
    }
    setShowConfetti(false);
  };

  // Calculate progress percentage
  const progressPercentage = textToType
    ? Math.round((userInput.length / textToType.length) * 100)
    : 0;

  // Get target character
  const targetChar = textToType[userInput.length];

  // Determine if lesson is passed
  const isPassed = stars > 0;

  return (
    <div ref={containerRef} className={cn('relative space-y-6', className)}>
      {showConfetti && viewport.width > 0 && viewport.height > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Confetti
            width={viewport.width}
            height={viewport.height}
            recycle={false}
            numberOfPieces={220}
            gravity={0.4}
          />
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* WPM */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">WPM</span>
          </div>
          <div className="text-2xl font-bold">{wpm}</div>
          <div className="text-xs text-muted-foreground">Target: {lesson.targetWpm}</div>
        </div>

        {/* Accuracy */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Accuracy</span>
          </div>
          <div className="text-2xl font-bold">{accuracy.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Min: {lesson.minAccuracy}%</div>
        </div>

        {/* Errors */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-muted-foreground">Errors</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{errors}</div>
          <div className="text-xs text-muted-foreground">Mistakes made</div>
        </div>

        {/* Progress */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
          </div>
          <div className="text-2xl font-bold">{progressPercentage}%</div>
          <div className="text-xs text-muted-foreground">
            {userInput.length} / {textToType.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Lesson Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              status === 'finished' ? (isPassed ? 'bg-green-500' : 'bg-red-500') : 'bg-primary'
            )}
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20" />
          </div>
        </div>
      </div>

      {/* Text Display */}
      <div className="bg-card rounded-xl border border-border p-8">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
          <p className="text-sm text-muted-foreground">{lesson.description}</p>
        </div>

        {status === 'finished' ? (
          // Results View
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                {isPassed ? (
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                ) : (
                  <RefreshCw className="h-10 w-10 text-red-500" />
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {isPassed ? 'Lesson Complete!' : 'Keep Practicing!'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {isPassed
                  ? `You earned ${stars} star${stars !== 1 ? 's' : ''}!`
                  : 'Try again to pass this lesson'}
              </p>

              {/* Stars Display */}
              {isPassed && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3].map((star) => (
                    <Trophy
                      key={star}
                      className={cn(
                        'h-8 w-8 transition-all',
                        star <= stars
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground/20'
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Performance Feedback */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">WPM</div>
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      wpm >= lesson.targetWpm ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {wpm}
                  </div>
                  <div className="text-xs text-muted-foreground">Target: {lesson.targetWpm}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      accuracy >= lesson.minAccuracy ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {accuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Min: {lesson.minAccuracy}%</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button onClick={handleTryAgain} variant="outline" size="lg" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              {isPassed && (
                <Button size="lg" className="gap-2" disabled={isSaving}>
                  <CheckCircle2 className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Continue'}
                </Button>
              )}
            </div>

            <div className="mx-auto max-w-2xl border-t border-border/60 pt-6">
              <HandPositionGuide compact showArrow={false} showKeyClusters className="mx-auto" />
            </div>
          </div>
        ) : (
          // Typing View
          <div className="space-y-8">
            {/* Text to Type */}
            <div className="relative">
              <div
                className="text-2xl md:text-3xl font-mono leading-relaxed tracking-wide p-6 bg-muted/50 rounded-lg min-h-[200px] focus:outline-none"
                tabIndex={0}
              >
                {textToType.split('').map((char, index) => {
                  const isTyped = index < userInput.length;
                  const isCurrent = index === userInput.length;
                  const isCorrect = isTyped && userInput[index] === char;

                  return (
                    <span
                      key={index}
                      className={cn(
                        'relative transition-all duration-100',
                        isTyped && isCorrect && 'text-green-500',
                        isTyped && !isCorrect && 'text-red-500 underline',
                        isCurrent && 'bg-primary/20 border-b-2 border-primary animate-pulse',
                        !isTyped && !isCurrent && 'text-muted-foreground'
                      )}
                    >
                      {char === ' ' ? '\u00A0' : char}
                      {isCurrent && (
                        <span className="absolute -right-0.5 top-0 bottom-0 w-0.5 bg-primary animate-pulse" />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Current Character Hint */}
              {targetChar && status === 'waiting' && (
                <div className="absolute top-2 right-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                  Press any key to start
                </div>
              )}
            </div>

            {/* Visual Keyboard */}
            {showKeyboard && (
              <div className="border-t border-border pt-6">
                <VisualKeyboard
                  targetKey={targetChar}
                  pressedKey={lastKey}
                  isCorrect={isCorrect}
                  showHomeRowMarkers={true}
                />
              </div>
            )}

            <div className="border-t border-border pt-6">
              <HandPositionGuide
                targetKey={targetChar}
                compact
                showArrow
                showFingerLabels={false}
              />
            </div>

            {/* Instructions */}
            {status === 'waiting' && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Tip:</span> Keep your fingers on the home row
                  (ASDF JKL;) and watch the highlighted key
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
