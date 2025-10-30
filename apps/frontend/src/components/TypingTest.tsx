'use client';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTypingStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Target, Zap, ArrowRight } from 'lucide-react';
import { generateTestText } from '@/lib/textGenerator';
import ResultsScreen from '@/components/ResultsScreen';
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
              {isCursor && (
                <span
                  className={cn(
                    'absolute top-0 bottom-0 w-[2px] bg-yellow-400 animate-blink rounded-full',
                    'left-0 -translate-x-full'
                  )}
                />
              )}
              <span
                className={cn(
                  isTyped && (isCorrect ? 'text-green-400' : 'text-red-500 underline'),
                  !isTyped && 'text-muted-foreground'
                )}
              >
                {char}
              </span>
            </span>
          );
        })}
        {/* Cursor after the word when it's complete */}
        {typedWord.length === targetWord.length && (
          <span className="relative inline-block ml-0">
            <span className="absolute left-full top-0 bottom-0 w-[2px] bg-yellow-400 animate-blink rounded-full" />
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
    errors,
    startTest,
    setUserInput,
    endTest,
    resetTest,
    startTime,
  } = useTypingStore();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeDuration, setActiveDuration] = useState<30 | 60 | 180>(60);
  const [view, setView] = useState<'initial' | 'typing' | 'results'>('initial');
  const [displayMode, setDisplayMode] = useState<'vertical' | 'horizontal'>('horizontal');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
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
      // Use the text generator instead of random words
      const newText = generateTestText(duration);
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

  // AI Feedback Function
  const getAiTypingFeedback = useCallback(async () => {
    setIsFeedbackLoading(true);
    setAiFeedback(null);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      console.error(
        'Gemini API key (NEXT_PUBLIC_GEMINI_API_KEY) is not set in environment variables.'
      );
      setIsFeedbackLoading(false);
      return;
    }

    try {
      const systemPrompt =
        "You are a typing tutor AI. Analyze the user's typing test results (WPM, accuracy) and provide concise, helpful feedback (2-3 sentences max). Focus on constructive advice based on their performance (e.g., focus on accuracy if low, practice for speed if accuracy is high but WPM low). Be encouraging.";
      const userQuery = `Analyze typing test results:\nWPM: ${wpm}\nAccuracy: ${accuracy}%\nErrors: ${errors}\nDuration: ${activeDuration} seconds\n\nProvide helpful feedback.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\n${userQuery}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI feedback');
      }

      const data = await response.json();
      const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (feedback) {
        setAiFeedback(feedback);
      } else {
        setAiFeedback('Could not load AI feedback at this time.');
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      setAiFeedback('Could not load AI feedback. Please try again later.');
    } finally {
      setIsFeedbackLoading(false);
    }
  }, [wpm, accuracy, errors, activeDuration]);

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
          getAiTypingFeedback();
          clearInterval(timer);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, status, startTime, activeDuration, endTest, getAiTypingFeedback]);
  // This crucial effect handles scrolling the active word into the center of the viewbox.
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const activeWord = activeWordRef.current;
      const container = containerRef.current;
      const wordRect = activeWord.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (displayMode === 'horizontal') {
        // Horizontal: center the word horizontally
        const wordCenter = wordRect.left + wordRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;
        const scrollOffset = wordCenter - containerCenter;
        container.scrollBy({ left: scrollOffset, behavior: 'smooth' });
      } else {
        // Vertical: center the word vertically (original logic)
        if (wordRect.bottom > containerRect.bottom || wordRect.top < containerRect.top) {
          activeWord.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
    }
  }, [currentWordIndex, displayMode]);
  const handleStartClick = () => {
    setView('typing');
    // FIX: Focus the input immediately when test starts
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const commitUserInput = useCallback(
    (value: string) => {
      if (status === 'finished') return;
      if (value.length > textToType.length) return;
      setUserInput(value);
    },
    [status, textToType, setUserInput]
  );

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX: Delegate to commitUserInput so all pathways (change & space key) share the same logic.
    commitUserInput(e.target.value);
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
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setDisplayMode(displayMode === 'horizontal' ? 'vertical' : 'horizontal')
                  }
                  className="px-3 py-1 text-sm bg-background/50 border border-border rounded-md hover:bg-muted transition-colors"
                  title="Toggle display mode"
                >
                  {displayMode === 'horizontal' ? '↕️ Vertical' : '↔️ Horizontal'}
                </button>
                <div className="flex items-center gap-2 text-2xl font-semibold">
                  <Clock className="text-yellow-400" /> <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* Horizontal Mode (TypeRacer-style) */}
            {displayMode === 'horizontal' && (
              <div
                ref={containerRef}
                onClick={handleContainerClick}
                className="text-3xl font-mono leading-relaxed tracking-wider h-24 overflow-x-auto overflow-y-hidden relative w-full scroll-smooth cursor-text"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="whitespace-nowrap text-muted-foreground flex items-center h-full">
                  <span className="inline-block w-[50%]"></span> {/* Left padding for centering */}
                  {words.map((word, index) => {
                    const isActive = index === currentWordIndex;
                    const isCompleted = index < currentWordIndex;
                    const isUpcoming = index > currentWordIndex;

                    let typedWord = '';
                    if (isActive) {
                      typedWord = currentWordTyped;
                    } else if (isCompleted) {
                      typedWord = completedWords[index] || '';
                    }

                    return (
                      <React.Fragment key={index}>
                        <span
                          ref={isActive ? activeWordRef : null}
                          className={cn(
                            'inline-block px-2 py-1 rounded-md transition-all duration-200',
                            isActive && 'bg-yellow-400/10 border border-yellow-400/50 scale-110'
                          )}
                        >
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
                  <span className="inline-block w-[50%]"></span> {/* Right padding for centering */}
                </div>
              </div>
            )}

            {/* Vertical Mode (Original) */}
            {displayMode === 'vertical' && (
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
            )}

            {/* This is a hidden input field that captures all keyboard events, keeping the UI clean. */}
            <input
              ref={inputRef}
              type="text"
              className="absolute top-[-9999px] left-[-9999px] opacity-0"
              value={userInput}
              onChange={handleUserInput}
              onKeyDown={(e) => {
                if (e.key === ' ' && status !== 'finished') {
                  // FIX: Manually append a space so input continues to track progression while still preventing body scroll.
                  e.preventDefault();
                  commitUserInput(`${userInput} `);
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
          <ResultsScreen
            wpm={wpm}
            accuracy={accuracy}
            errors={errors}
            duration={activeDuration}
            aiFeedback={aiFeedback}
            isFeedbackLoading={isFeedbackLoading}
            footer={
              <>
                <button
                  onClick={handleRestart}
                  className="px-8 py-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white font-semibold rounded-xl hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Retry Same Text
                </button>
                <button
                  onClick={() => {
                    prepareTest(activeDuration);
                    setView('initial');
                  }}
                  className="px-8 py-4 bg-card/40 backdrop-blur-sm border-2 border-[var(--theme-primary)]/50 text-foreground font-semibold rounded-xl hover:bg-[var(--theme-primary)]/10 transition-all flex items-center justify-center gap-2"
                >
                  New Test
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
};
export default TypingTest;
