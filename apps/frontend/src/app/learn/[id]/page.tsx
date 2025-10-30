'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { lessonAPI } from '@/lib/api';
import { Star, ArrowLeft, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisualKeyboard } from '@/components/VisualKeyboard';
import { MistakeAnalysis } from '@/components/MistakeAnalysis';
import { useTypingStore } from '@/store';
import { Lesson, getFallbackLessonById } from '@/lib/fallback-lessons';

export default function LessonPracticePage() {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  // All useState hooks
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'initial' | 'typing' | 'results'>('initial');
  const [isSaving, setIsSaving] = useState(false);
  const [lastPressedKey, setLastPressedKey] = useState<string>('');
  const [isCorrectKey, setIsCorrectKey] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Typing state from Zustand store
  const { userInput, wpm, accuracy, status, startTest, resetTest, setUserInput } = useTypingStore();

  // All useEffect hooks
  useEffect(() => {
    async function fetchLesson() {
      try {
        const data = await lessonAPI.getLessonById(lessonId);
        const normalizedLesson: Lesson = {
          ...data.lesson,
          exerciseType:
            data.lesson.exerciseType === 'guided' || data.lesson.exerciseType === 'timed'
              ? data.lesson.exerciseType
              : undefined,
        };
        setLesson(normalizedLesson);
        setUsingFallback(false);
      } catch (err) {
        console.error('Failed to load lesson:', err);
        const fallbackLesson = getFallbackLessonById(lessonId);
        if (fallbackLesson) {
          setLesson(fallbackLesson);
          setUsingFallback(true);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  // Monitor typing completion
  useEffect(() => {
    if (status === 'finished' && view === 'typing') {
      setView('results');
    }
  }, [status, view]);

  // All event handlers and calculations (after hooks, before conditional returns)
  const handleStart = () => {
    resetTest();
    startTest(lesson?.content || '');
    setView('typing');
  };

  const handleSaveProgress = async () => {
    if (!lesson) return;

    if (usingFallback) {
      alert('Save progress is unavailable while using offline lessons.');
      return;
    }

    setIsSaving(true);
    const completed = accuracy >= lesson.minAccuracy && wpm >= lesson.targetWpm;

    try {
      await lessonAPI.saveLessonProgress({
        lessonId: lesson.id,
        wpm,
        accuracy,
        completed,
      });

      // Redirect back to lessons
      setTimeout(() => {
        router.push('/learn');
      }, 2000);
    } catch (err) {
      console.error('Failed to save progress:', err);
      alert('Failed to save progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTryAgain = () => {
    setView('initial');
    resetTest();
  };

  // Calculate stars for current attempt
  const calculateStars = () => {
    if (!lesson) return 0;
    if (accuracy < lesson.minAccuracy || wpm < lesson.targetWpm) return 0;
    if (wpm >= lesson.targetWpm * 1.5 && accuracy >= 98) return 3;
    if (wpm >= lesson.targetWpm * 1.2 && accuracy >= 95) return 2;
    return 1;
  };

  const progress = lesson?.userProgress?.[0];
  const stars = progress?.stars || 0;
  const currentStars = view === 'results' ? calculateStars() : 0;
  const completed = lesson ? accuracy >= lesson.minAccuracy && wpm >= lesson.targetWpm : false;
  const lessonContent = lesson?.content ?? '';

  // NOW handle conditional returns AFTER all hooks
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Lesson not found</p>
        <div className="text-center mt-4">
          <Button onClick={() => router.push('/learn')}>Back to Lessons</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button variant="ghost" onClick={() => router.push('/learn')} className="mb-4">
        <ArrowLeft className="mr-2" size={16} />
        Back to Lessons
      </Button>

      {usingFallback && (
        <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-900 dark:text-yellow-200">
          You&apos;re viewing the offline sample lesson. Start the backend services and database to
          see your personalized progress.
        </div>
      )}

      {/* Initial View */}
      {view === 'initial' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="px-2 py-1 bg-primary/10 rounded text-primary">
                Level {lesson.level}
              </span>
              <span className="px-2 py-1 bg-secondary rounded">{lesson.difficulty}</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">{lesson.title}</h1>
            <p className="text-lg text-muted-foreground">{lesson.description}</p>
          </div>

          {/* Lesson Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-primary" size={20} />
                <span className="font-semibold">Target WPM</span>
              </div>
              <p className="text-2xl font-bold">{lesson.targetWpm}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-yellow-500" size={20} />
                <span className="font-semibold">Min Accuracy</span>
              </div>
              <p className="text-2xl font-bold">{lesson.minAccuracy}%</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="text-yellow-400" size={20} />
                <span className="font-semibold">Your Best</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Previous Best */}
          {progress && (
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Your Best Performance</h3>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>WPM: {progress.bestWpm.toFixed(0)}</span>
                <span>Accuracy: {progress.bestAccuracy.toFixed(1)}%</span>
                <span>Attempts: {progress.attempts}</span>
              </div>
            </div>
          )}

          {/* Lesson Preview */}
          <div className="bg-card border rounded-lg p-6">
            <p className="font-mono text-lg text-muted-foreground">{lessonContent}</p>
            <p className="font-mono text-lg text-muted-foreground">{lesson.content}</p>
          </div>

          <div className="flex gap-4">
            <Button size="lg" onClick={handleStart} className="px-8">
              Start Practice
            </Button>
          </div>
        </div>
      )}

      {/* Typing View */}
      {view === 'typing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{lesson.title}</h2>
              <p className="text-sm text-muted-foreground">Type the text below</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">WPM</p>
                <p className="text-2xl font-bold">{wpm}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{accuracy.toFixed(0)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-8">
            <div className="font-mono text-2xl leading-relaxed mb-6">
              {lessonContent.split(' ').map((word, wordIndex) => {
                const typedWords = userInput.split(' ');
                const isCurrentWord = wordIndex === typedWords.length - 1;
                const isTyped = wordIndex < typedWords.length - 1;
                const currentWordTyped = isCurrentWord ? typedWords[wordIndex] || '' : '';

                return (
                  <span key={wordIndex} className="relative inline-block mr-2">
                    {word.split('').map((char, charIndex) => {
                      let className = 'text-muted-foreground';

                      if (isTyped) {
                        const typedWord = typedWords[wordIndex];
                        if (charIndex < typedWord.length) {
                          className =
                            typedWord[charIndex] === char ? 'text-foreground' : 'text-red-500';
                        }
                      } else if (isCurrentWord && charIndex < currentWordTyped.length) {
                        className =
                          currentWordTyped[charIndex] === char ? 'text-foreground' : 'text-red-500';
                      }

                      return (
                        <span key={charIndex} className={className}>
                          {char}
                        </span>
                      );
                    })}
                    {isCurrentWord && (
                      <span
                        className={`absolute top-0 bottom-0 w-0.5 bg-primary animate-pulse ${
                          currentWordTyped.length === 0 ? 'left-0 -translate-x-full' : 'left-full'
                        }`}
                      />
                    )}
                  </span>
                );
              })}
            </div>

            {/* Hidden input for typing */}
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                setLastPressedKey(e.key);
                const nextChar = lessonContent[userInput.length];
                setIsCorrectKey(e.key === nextChar);
                setTimeout(() => setLastPressedKey(''), 200);
              }}
              placeholder="Start typing here..."
              autoFocus
            />
          </div>

          {/* Visual Keyboard */}
          <VisualKeyboard
            targetKey={lessonContent[userInput.length]}
            pressedKey={lastPressedKey}
            isCorrect={isCorrectKey}
            showHomeRowMarkers={true}
          />
          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Watch the keyboard below to see which key to press next (highlighted in yellow)</p>
            <p>
              The <strong>F</strong> and <strong>J</strong> keys have markers to help you find the
              home position
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {view === 'results' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">
              {completed ? 'Lesson Completed!' : 'Good Attempt!'}
            </h2>
            <p className="text-muted-foreground">
              {completed
                ? 'You met the requirements for this lesson!'
                : 'Keep practicing to meet the target requirements.'}
            </p>
          </div>

          {/* Stars Earned */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                size={48}
                className={
                  star <= currentStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }
              />
            ))}
          </div>

          {/* Results Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">WPM</p>
              <p className="text-3xl font-bold">{wpm}</p>
              <p className="text-xs text-muted-foreground">Target: {lesson.targetWpm}</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
              <p className="text-3xl font-bold">{accuracy.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Target: {lesson.minAccuracy}%</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Stars</p>
              <p className="text-3xl font-bold">{currentStars}</p>
              <p className="text-xs text-muted-foreground">Max: 3</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="text-lg font-bold">{completed ? '✓ Complete' : '✗ Incomplete'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleTryAgain} disabled={isSaving}>
              Try Again
            </Button>
            <Button onClick={handleSaveProgress} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Continue'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
