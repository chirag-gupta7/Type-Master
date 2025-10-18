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
    isUpcoming: boolean;
  }) => {
    // Upcoming words (not yet reached)
    if (isUpcoming) {
      return (
        <>
          {targetWord}
          <span className="mr-2"> </span>
        </>
      );
    }

    // Completed words (already typed)
    if (!isActive) {
      const isCorrect = typedWord === targetWord;
      return (
        <>
          <span className={isCorrect ? 'text-green-400' : 'text-red-500'}>{targetWord}</span>
          <span className="mr-2"> </span>
        </>
      );
    }

    // Active word (currently being typed)
    return (
      <>
        {targetWord.split('').map((char, index) => {
          const isTyped = index < typedWord.length;
          const isCorrect = isTyped && typedWord[index] === char;
          const isCursor = index === typedWord.length;

          return (
            <span key={index} className="relative inline-block">
              <span
                className={cn(
                  isTyped && (isCorrect ? 'text-green-400' : 'text-red-500 underline'),
                  !isTyped && 'text-muted-foreground'
                )}
              >
                {char}
              </span>
              {isCursor && (
                <span className="absolute left-full top-0 bottom-0 w-[2px] bg-yellow-400 animate-blink rounded-full" />
              )}
            </span>
          );
        })}
        {/* Cursor after the word when it's complete */}
        {typedWord.length === targetWord.length && (
          <span className="relative inline-block ml-0">
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-yellow-400 animate-blink rounded-full" />
          </span>
        )}
        <span className="mr-2"> </span>
      </>
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
  // FIX: Add ref for the hidden input to programmatically focus it
  const inputRef = useRef<HTMLInputElement>(null);
  // Memoize word arrays to prevent recalculation on every render
  const words = useMemo(() => textToType.split(' '), [textToType]);

  // Calculate the current word index based on number of spaces typed
  const currentWordIndex = useMemo(() => {
    if (userInput.length === 0) return 0;

    // Count spaces to determine word index
    // "hello " has 1 space = we're on word index 1 (second word)
    // "hello world " has 2 spaces = we're on word index 2 (third word)
    const spaceCount = (userInput.match(/ /g) || []).length;
    return spaceCount;
  }, [userInput]);

  // Get the text typed for the current word (everything after last space)
  const currentWordTyped = useMemo(() => {
    const lastSpaceIndex = userInput.lastIndexOf(' ');
    if (lastSpaceIndex === -1) return userInput; // No spaces yet, all input is current word
    return userInput.slice(lastSpaceIndex + 1); // Everything after last space
  }, [userInput]);

  // Get array of completed words (split and filter out empty strings from trailing spaces)
  const completedWords = useMemo(() => {
    if (userInput.length === 0) return [];
    const split = userInput.split(' ');
    // Filter out the last empty string if input ends with space
    return split.filter((word, idx, arr) => {
      return idx < arr.length - 1 || word.length > 0;
    });
  }, [userInput]);
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

  // FIX: Ensure input stays focused during typing view
  useEffect(() => {
    if (view === 'typing' && status !== 'finished') {
      inputRef.current?.focus();
    }
  }, [view, status]);

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
    // FIX: Focus the input immediately when test starts
    setTimeout(() => inputRef.current?.focus(), 100);
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
  // FIX: Add handler to refocus input when clicking the text container
  const handleContainerClick = () => {
    if (view === 'typing' && status !== 'finished') {
      inputRef.current?.focus();
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
            {/* FIX: Added onClick handler to refocus input when clicking anywhere in text area */}
            <div
              ref={containerRef}
              onClick={handleContainerClick}
              className="text-3xl font-mono leading-relaxed tracking-wider text-left h-40 overflow-y-auto overflow-x-hidden relative w-full scroll-smooth cursor-text"
            >
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
              <div className="whitespace-normal text-muted-foreground">
                {words.map((word, index) => {
                  const isActive = index === currentWordIndex;
                  const isCompleted = index < currentWordIndex;
                  const isUpcoming = index > currentWordIndex;

                  // Determine what the user has typed for this word
                  let typedWord = '';
                  if (isActive) {
                    typedWord = currentWordTyped;
                  } else if (isCompleted) {
                    typedWord = completedWords[index] || '';
                  }

                  return (
                    <React.Fragment key={index}>
                      <span ref={isActive ? activeWordRef : null}>
                        <Word
                          targetWord={word}
                          typedWord={typedWord}
                          isActive={isActive}
                          isUpcoming={isUpcoming}
                        />
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
            </div>
            {/* This is a hidden input field that captures all keyboard events, keeping the UI clean. */}
            <input
              ref={inputRef}
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
