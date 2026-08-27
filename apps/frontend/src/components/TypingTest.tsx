'use client';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTypingStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Target, Zap, ArrowRight, Keyboard, Sparkles } from 'lucide-react';
import { generateTestText } from '@/lib/textGenerator';
import ResultsScreen from '@/components/ResultsScreen';
import { aiAPI } from '@/lib/api';

const Word = React.memo(
  ({
    targetWord,
    typedWord,
    isActive,
    isUpcoming,
  }: {
    targetWord: string;
    typedWord: string;
    isActive: boolean;
    isUpcoming: boolean;
  }) => {
    if (isUpcoming) {
      return (
        <>
          <span className="text-muted-foreground/60">{targetWord}</span>
          <span className="mr-2"> </span>
        </>
      );
    }
    if (!isActive) {
      const isCorrect = typedWord === targetWord;
      return (
        <>
          <span className={isCorrect ? 'text-emerald-500' : 'text-red-500 decoration-red-500/50 underline decoration-2 underline-offset-2'}>
            {targetWord}
          </span>
          <span className="mr-2"> </span>
        </>
      );
    }
    return (
      <>
        {targetWord.split('').map((char, index) => {
          const isTyped = index < typedWord.length;
          const isCorrect = isTyped && typedWord[index] === char;
          const isCursor = index === typedWord.length;
          return (
            <span key={index} className="relative inline-block">
              {isCursor && (
                <span className="absolute inset-y-0 -left-px w-[2px] rounded-full bg-[var(--theme-primary)] animate-blink" aria-hidden />
              )}
              <span className={cn('transition-colors', isTyped ? (isCorrect ? 'text-emerald-500' : 'text-red-500 underline decoration-red-500/50 decoration-2 underline-offset-2') : 'text-muted-foreground/70')}>
                {char}
              </span>
            </span>
          );
        })}
        {typedWord.length === targetWord.length && (
          <span className="relative inline-block">
            <span className="absolute left-full inset-y-0 w-[2px] rounded-full bg-[var(--theme-primary)] animate-blink" />
          </span>
        )}
        <span className="mr-2"> </span>
      </>
    );
  }
);
Word.displayName = 'Word';

const TypingTest: React.FC = () => {
  const { status, textToType, userInput, wpm, accuracy, errors, mistakes, startTest, setUserInput, endTest, resetTest, startTime, endTime } =
    useTypingStore();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeDuration, setActiveDuration] = useState<30 | 60 | 180>(60);
  const [resultDuration, setResultDuration] = useState<number>(activeDuration);
  const [view, setView] = useState<'initial' | 'typing' | 'results'>('initial');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRequestedRef = useRef(false);

  const words = useMemo(() => textToType.split(' '), [textToType]);

  const { currentWordIndex, currentWordTyped, completedWords } = useMemo(() => {
    if (userInput.length === 0) return { currentWordIndex: 0, currentWordTyped: '', completedWords: [] as string[] };
    const splitInput = userInput.split(' ');
    const currentWordIndex = splitInput.length - 1;
    const currentWordTyped = splitInput[currentWordIndex] || '';
    const completedWords = splitInput.filter((word, idx, arr) => idx < arr.length - 1 || word.length > 0);
    return { currentWordIndex, currentWordTyped, completedWords };
  }, [userInput]);

  const { correctCharsCount, incorrectCharsCount, missedCharsCount } = useMemo(() => {
    let correct = 0;
    const typedLength = userInput.length;
    for (let i = 0; i < typedLength; i++) if (userInput[i] === textToType[i]) correct++;
    return { correctCharsCount: correct, incorrectCharsCount: typedLength - correct, missedCharsCount: Math.max(textToType.length - typedLength, 0) };
  }, [userInput, textToType]);

  const prepareTest = useCallback(
    (duration: 30 | 60 | 180, existingText?: string) => {
      const shouldPreserveText = !!existingText;
      resetTest(shouldPreserveText);
      setActiveDuration(duration);
      setResultDuration(duration);
      setTimeLeft(duration);
      setAiFeedback(null);
      setIsFeedbackLoading(false);
      feedbackRequestedRef.current = false;
      const newText = existingText ?? generateTestText(duration);
      startTest(newText);
      setView('initial');
    },
    [resetTest, startTest]
  );

  useEffect(() => { prepareTest(activeDuration); }, []); // mount only

  useEffect(() => {
    if (view === 'typing' && status !== 'finished') inputRef.current?.focus();
  }, [view, status]);

  const getAiTypingFeedback = useCallback(
    async (summaryDuration: number) => {
      setIsFeedbackLoading(true);
      setAiFeedback(null);
      try {
        const data = await aiAPI.getTypingFeedback({ wpm, accuracy, errors, duration: summaryDuration });
        setAiFeedback(data.feedback ?? 'Could not load AI feedback at this time.');
      } catch {
        setAiFeedback('Could not load AI feedback. Please try again later.');
      } finally {
        setIsFeedbackLoading(false);
      }
    },
    [wpm, accuracy, errors]
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'typing' && status === 'in-progress' && startTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = activeDuration - elapsed;
        if (remaining <= 0) { setTimeLeft(0); endTest(); clearInterval(timer); } else setTimeLeft(remaining);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, status, startTime, activeDuration, endTest]);

  useEffect(() => {
    if (status === 'finished') {
      let effectiveDuration = Math.max(activeDuration, 1);
      if (startTime) {
        const finishedAt = endTime ?? Date.now();
        effectiveDuration = Math.max(1, Math.round((finishedAt - startTime) / 1000));
      }
      setResultDuration(effectiveDuration);
      setTimeLeft(0);
      if (view !== 'results') setView('results');
      if (!feedbackRequestedRef.current) { feedbackRequestedRef.current = true; void getAiTypingFeedback(effectiveDuration); }
    } else feedbackRequestedRef.current = false;
  }, [status, startTime, endTime, activeDuration, view, getAiTypingFeedback]);

  useEffect(() => {
    if (!activeWordRef.current || !containerRef.current) return;
    const el = activeWordRef.current;
    const container = containerRef.current;
    // Smoothly keep active word centered vertically within container
    const cRect = container.getBoundingClientRect();
    const wRect = el.getBoundingClientRect();
    if (wRect.bottom > cRect.bottom - 24 || wRect.top < cRect.top + 24) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [currentWordIndex]);

  const handleStartClick = () => { setView('typing'); setTimeout(() => inputRef.current?.focus(), 80); };

  const commitUserInput = useCallback(
    (value: string | ((prev: string) => string)) => {
      if (status === 'finished') return;
      const prev = useTypingStore.getState().userInput;
      const next = typeof value === 'function' ? (value as (p: string) => string)(prev) : value;
      if (next.length > textToType.length) return;
      setUserInput(next);
    },
    [status, textToType, setUserInput]
  );

  const handleRestart = useCallback(() => {
    const currentText = textToType;
    if (currentText) prepareTest(activeDuration, currentText);
    else prepareTest(activeDuration);
  }, [prepareTest, activeDuration, textToType]);

  const handleNewTest = useCallback(() => prepareTest(activeDuration), [prepareTest, activeDuration]);
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const progress = useMemo(() => {
    if (!textToType) return 0;
    return Math.min(100, (userInput.length / textToType.length) * 100);
  }, [userInput.length, textToType.length]);

  return (
    <div className="flex w-full flex-col items-center">
      <AnimatePresence mode="wait">
        {view === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="flex w-full max-w-3xl flex-col items-center text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium backdrop-blur">
              <Keyboard className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> Real-time engine • 60fps • WCAG AA
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Test your <span className="text-gradient">typing</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-[15px]">
              Choose a duration and start instantly. Your progress is tracked live — WPM, accuracy, and character-level feedback.
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-full border bg-card/60 p-1 backdrop-blur">
              {[30, 60, 180].map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={activeDuration === d}
                  aria-label={`Select ${d === 30 ? '30 seconds' : `${d / 60} minutes`} test duration`}
                  onClick={() => prepareTest(d as 30 | 60 | 180)}
                  className={cn(
                    'rounded-full px-5 py-2 text-sm font-semibold transition-all focus-ring',
                    activeDuration === d ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d === 30 ? '30s' : `${d / 60}m`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleStartClick}
              disabled={!textToType}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] px-8 py-3 text-base font-semibold text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--theme-primary)_40%,transparent)] transition hover:brightness-[1.05] disabled:opacity-50 focus-ring"
            >
              {textToType ? 'Start test' : 'Loading…'} <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Tip: Press any key to focus — click the text to re-focus anytime.
            </div>
          </motion.div>
        )}

        {view === 'typing' && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
                  <Clock className="h-3.5 w-3.5" /> {formatTime(timeLeft)}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> {wpm} WPM
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium">
                  <Target className="h-3.5 w-3.5 text-emerald-500" /> {accuracy}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden md:inline">Progress</span>
                <div className="h-2 w-28 overflow-hidden rounded-full bg-muted md:w-40">
                  <motion.div className="h-full bg-foreground" animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                </div>
                <span className="text-xs font-medium tabular-nums">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Mobile stats */}
            <div className="mt-3 grid grid-cols-3 gap-2 sm:hidden">
              <div className="rounded-xl border bg-card p-2 text-center"><div className="text-xs text-muted-foreground">WPM</div><div className="font-semibold">{wpm}</div></div>
              <div className="rounded-xl border bg-card p-2 text-center"><div className="text-xs text-muted-foreground">Accuracy</div><div className="font-semibold">{accuracy}%</div></div>
              <div className="rounded-xl border bg-card p-2 text-center"><div className="text-xs text-muted-foreground">Errors</div><div className="font-semibold">{errors}</div></div>
            </div>

            {/* Text viewport */}
            <div
              ref={containerRef}
              onClick={() => inputRef.current?.focus()}
              className="relative mt-4 max-h-[220px] cursor-text overflow-y-auto rounded-2xl border bg-card/70 p-6 backdrop-blur"
              role="textbox"
              aria-label="Typing test text"
              aria-multiline="true"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') inputRef.current?.focus(); }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-card/70 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card/70 to-transparent" />
              <div className="whitespace-normal font-mono text-[20px] leading-8 tracking-wide md:text-[22px] md:leading-9">
                {words.map((word, index) => {
                  const isActive = index === currentWordIndex;
                  const isCompleted = index < currentWordIndex;
                  const isUpcoming = index > currentWordIndex;
                  let typedWord = '';
                  if (isActive) typedWord = currentWordTyped;
                  else if (isCompleted) typedWord = completedWords[index] || '';
                  return (
                    <span
                      key={index}
                      ref={isActive ? activeWordRef : undefined}
                      className={cn('inline-block rounded-lg px-1 py-0.5 transition', isActive && 'bg-[var(--theme-primary)]/10 ring-1 ring-[var(--theme-primary)]/20')}
                    >
                      <Word targetWord={word} typedWord={typedWord} isActive={isActive} isUpcoming={isUpcoming} />
                    </span>
                  );
                })}
              </div>
            </div>

            <input
              ref={inputRef}
              type="text"
              className="sr-only"
              value={userInput}
              onChange={(e) => commitUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace') { e.preventDefault(); return; }
                if (e.key === ' ' && status !== 'finished') { e.preventDefault(); commitUserInput((prev) => `${prev} `); }
              }}
              disabled={status === 'finished'}
              autoFocus
              aria-label="Typing input"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium hover:bg-accent focus-ring"
                aria-label="Restart typing test"
              >
                <RefreshCw className="h-4 w-4" /> Restart
              </button>
              <span className="text-xs text-muted-foreground">Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[11px]">Space</kbd> to advance • Backspace is disabled for accuracy tracking</span>
            </div>
          </motion.div>
        )}

        {view === 'results' && (
          <div className="w-full max-w-4xl">
            <ResultsScreen
              wpm={wpm}
              accuracy={accuracy}
              errors={errors}
              duration={resultDuration}
              correctChars={correctCharsCount}
              incorrectChars={incorrectCharsCount}
              missedChars={missedCharsCount}
              mistakes={mistakes}
              aiFeedback={aiFeedback}
              isFeedbackLoading={isFeedbackLoading}
              onRetry={handleRestart}
              onContinue={handleNewTest}
              footer={
                <>
                  <button onClick={handleRestart} className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 focus-ring">
                    Retry same text
                  </button>
                  <button onClick={handleNewTest} className="inline-flex items-center justify-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent focus-ring">
                    New test <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              }
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default TypingTest;
