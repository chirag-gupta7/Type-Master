'use client';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTypingStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Target, Zap } from 'lucide-react';
import { generate as generateWords } from 'random-words';
// Word Component: Renders each word and handles its state (correct, incorrect, active).
// It's memoized to prevent re-rendering of words that haven't changed.
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
    isUpcoming: boolean; // FIX: New prop to handle untyped future words
  }) => {
    // FIX: Logic for words that haven't been reached yet (Issue #2)
    if (isUpcoming) {
      return <span className="mr-4 text-muted-foreground">{targetWord}</span>;
    }

    // Logic for words that have already been typed (not active)
    if (!isActive) {
      const isCorrect = typedWord === targetWord;
      return (
        <span className={cn('mr-4', isCorrect ? 'text-green-400' : 'text-red-500')}>
          {targetWord}
        </span>
      );
    }
    // Logic for the currently active word
    return (
      <span className="relative mr-4 text-primary-foreground">
        {targetWord.split('').map((char, index) => {
          const isTyped = index < typedWord.length;
          const isCorrect = isTyped && typedWord[index] === char;
          const isCursor = index === typedWord.length;
          return (
            <span
              key={index}
              className={cn(
                isTyped && (isCorrect ? 'text-green-400' : 'text-red-500 underline'),
                !isTyped && 'text-muted-foreground'
              )}
            >
              {/* The blinking cursor is positioned relative to the current character */}
              {isCursor && (
                <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-yellow-400 animate-blink rounded-full" />
              )}
              {char}
            </span>
          );
        })}
        {/* A separate cursor is needed for when the user is at the space after the word */}
        {typedWord.length === targetWord.length && (
          <span className="absolute -right-1 top-0 bottom-0 w-[2px] bg-yellow-400 animate-blink rounded-full" />
        )}
      </span>
    );
  }
);
Word.displayName = 'Word';
const TypingTest: React.FC = () => {
  const {
    status,
    textToType,
    userInput,
    wpm,
    accuracy,
    startTest,
    setUserInput,
    endTest,
    resetTest,
    startTime,
  } = useTypingStore();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeDuration, setActiveDuration] = useState<30 | 60 | 180>(60);
  const [view, setView] = useState<'initial' | 'typing' | 'results'>('initial');
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Memoize word arrays to prevent recalculation on every render
  const words = useMemo(() => textToType.split(' '), [textToType]);
  const typedWords = useMemo(() => userInput.split(' '), [userInput]);

  // FIX (Issue #1): Calculate the current word index correctly
  // If the user has typed a trailing space, the split creates an empty string at the end
  // We need to handle this to determine which word is actually being typed
  const currentWordIndex = useMemo(() => {
    // If input is empty, we're on the first word
    if (userInput.length === 0) return 0;

    // If the last character is a space, we've completed the current word and moved to the next
    if (userInput.endsWith(' ')) {
      return typedWords.length - 1; // The empty string after space represents the next word
    }

    // Otherwise, we're still typing the current word
    return typedWords.length - 1;
  }, [userInput, typedWords.length]);
  const prepareTest = useCallback(
    async (duration: 30 | 60 | 180) => {
      resetTest();
      setActiveDuration(duration);
      setTimeLeft(duration);
      // Generate a large number of words client-side to act as an "infinite" paragraph
      const wordsArray = generateWords({ min: 350, max: 400 });
      const newText = Array.isArray(wordsArray) ? wordsArray.join(' ') : wordsArray;
      startTest(newText);
      setView('initial');
    },
    [resetTest, startTest]
  );
  useEffect(() => {
    prepareTest(activeDuration);
  }, []); // Run only on initial mount
  // Main timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'typing' && status === 'in-progress' && startTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = activeDuration - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          endTest();
          setView('results');
          clearInterval(timer);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, status, startTime, activeDuration, endTest]);
  // This crucial effect handles scrolling the active word into the vertical center of the viewbox.
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const activeWord = activeWordRef.current;
      const container = containerRef.current;
      const wordRect = activeWord.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // If the active word's top or bottom edge is outside the visible container, scroll it to the center.
      if (wordRect.bottom > containerRect.bottom || wordRect.top < containerRect.top) {
        activeWord.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [currentWordIndex]);
  const handleStartClick = () => {
    setView('typing');
  };
  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // A guard to prevent the user's input from exceeding the length of the source text.
    if (value.length > textToType.length) return;
    // Starts the timer on the very first keypress.
    if (status === 'waiting' && value.length > 0 && view === 'typing') {
      useTypingStore.setState({ startTime: Date.now(), status: 'in-progress' });
    }
    if (status !== 'finished') {
      setUserInput(value);
    }
  };
  const handleRestart = () => {
    prepareTest(activeDuration);
    setView('initial');
  };
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground font-sans w-full">
      <AnimatePresence mode="wait">
        {view === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="text-6xl font-bold mb-2 animate-tracking-in-expand">TypeMaster</h1>
            <p className="text-xl text-muted-foreground mb-10">Test your typing skills.</p>
            <div className="mb-10 flex items-center justify-center gap-2 md:gap-4 p-2 bg-secondary/50 rounded-lg">
              {[30, 60, 180].map((duration) => (
                <button
                  key={duration}
                  onClick={() => prepareTest(duration as 30 | 60 | 180)}
                  className={cn(
                    'px-4 py-2 md:px-6 md:py-3 rounded-md text-lg font-medium transition-all duration-300',
                    activeDuration === duration
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {duration === 30 ? '30s' : `${duration / 60}m`}
                </button>
              ))}
            </div>
            <button
              onClick={handleStartClick}
              disabled={!textToType}
              className="px-12 py-4 bg-yellow-400 text-background font-bold text-2xl rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {textToType ? 'Start' : 'Loading...'}
            </button>
          </motion.div>
        )}
        {view === 'typing' && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-8 px-4 py-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-6 text-xl">
                <div className="flex items-center gap-2">
                  <Zap className="text-yellow-400" /> <span>{wpm} WPM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="text-yellow-400" /> <span>{accuracy}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-2xl font-semibold">
                <Clock className="text-yellow-400" /> <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
            {/* FIX: Changed overflow-hidden to overflow-y-auto to enable scrolling */}
            <div
              ref={containerRef}
              className="text-3xl font-mono leading-relaxed tracking-wider text-left h-40 overflow-y-auto overflow-x-hidden relative w-full scroll-smooth"
            >
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
              <div className="whitespace-normal">
                {words.map((word, index) => {
                  const isActive = index === currentWordIndex;
                  const isUpcoming = index > currentWordIndex; // FIX (Issue #2): Determine if word is untyped
                  const typedWord = isActive
                    ? typedWords[currentWordIndex] || ''
                    : typedWords[index] || '';

                  return (
                    <span key={index} ref={isActive ? activeWordRef : null}>
                      <Word
                        targetWord={word}
                        typedWord={typedWord}
                        isActive={isActive}
                        isUpcoming={isUpcoming}
                      />
                    </span>
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
            </div>
            {/* This is a hidden input field that captures all keyboard events, keeping the UI clean. */}
            <input
              type="text"
              className="absolute top-[-9999px] left-[-9999px] opacity-0"
              value={userInput}
              onChange={handleUserInput}
              onKeyDown={(e) => {
                // Prevent the default browser action for the spacebar (scrolling).
                if (e.key === ' ') {
                  e.preventDefault();
                }
              }}
              disabled={status === 'finished'}
              autoFocus
            />
            <button
              onClick={handleRestart}
              className="mt-8 flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors"
            >
              <RefreshCw size={16} />
              <span>Restart</span>
            </button>
          </motion.div>
        )}
        {view === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="text-center p-10 bg-secondary/50 rounded-xl shadow-2xl"
          >
            <h2 className="text-4xl font-bold text-yellow-400 mb-4 animate-text-focus-in">
              Results
            </h2>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-2xl my-8">
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground text-lg">WPM</span>
                <span className="font-bold text-5xl">{wpm}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground text-lg">Accuracy</span>
                <span className="font-bold text-5xl">{accuracy}%</span>
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="mt-6 flex items-center gap-3 mx-auto px-8 py-4 bg-primary text-primary-foreground font-semibold text-xl rounded-lg shadow-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCw />
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default TypingTest;
