'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTypingStore } from '@/store';
import { testAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

export function TypingTest() {
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const {
    status,
    textToType,
    userInput,
    startTime,
    errors,
    wpm,
    accuracy,
    startTest,
    startTimer,
    setUserInput,
    endTest,
    resetTest,
  } = useTypingStore();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeDuration, setActiveDuration] = useState<30 | 60 | 180>(60);

  // Function to fetch and start a new test
  const fetchAndStartTest = useCallback(
    async (duration: 30 | 60 | 180) => {
      resetTest();
      setActiveDuration(duration);
      setTimeLeft(duration);
      try {
        const data = await testAPI.getTest(duration);
        startTest(data.text);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error('Failed to fetch text:', error);
      }
    },
    [resetTest, startTest]
  );

  // Initial fetch on component mount
  useEffect(() => {
    fetchAndStartTest(activeDuration);
  }, [fetchAndStartTest, activeDuration]);

  // Effect to manage timer
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (status === 'in-progress' && startTime && timeLeft > 0) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = activeDuration - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          endTest();
          if (timer) clearInterval(timer);
        } else {
          setTimeLeft(remaining);
        }
      }, 100);
    } else if (status === 'finished' || timeLeft === 0) {
      if (timer) clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, startTime, timeLeft, activeDuration, endTest]);

  // Handle user input and start timer on first keypress
  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Start timer on first keypress
    if (status === 'waiting' && value.length > 0 && !startTime) {
      startTimer();
    }

    setUserInput(value);
  };

  // Scroll management for typing text
  useEffect(() => {
    if (textContainerRef.current && userInput.length > 0) {
      const container = textContainerRef.current;
      const textNodes = Array.from(container.querySelectorAll('.char-span'));
      const cursorIndex = userInput.length;

      if (cursorIndex < textNodes.length) {
        const currentCursorSpan = textNodes[cursorIndex] as HTMLElement;
        if (currentCursorSpan) {
          const containerRect = container.getBoundingClientRect();
          const cursorRect = currentCursorSpan.getBoundingClientRect();

          // Check if cursor is out of view (bottom)
          if (cursorRect.bottom > containerRect.bottom - 20) {
            container.scrollTop += cursorRect.bottom - containerRect.bottom + 40;
          }
          // Check if cursor is out of view (top) - for backspacing
          if (cursorRect.top < containerRect.top + 20) {
            container.scrollTop -= containerRect.top - cursorRect.top + 40;
          }
        }
      }
    }
  }, [userInput]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    fetchAndStartTest(activeDuration);
  };

  // Focus the input when test starts or resets
  useEffect(() => {
    if (status !== 'finished' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      {/* Duration Selection */}
      <div className="mb-8 flex space-x-4">
        {[
          { value: 30, label: '30 Sec' },
          { value: 60, label: '1 Min' },
          { value: 180, label: '3 Min' },
        ].map((duration) => (
          <button
            key={duration.value}
            onClick={() => fetchAndStartTest(duration.value as 30 | 60 | 180)}
            disabled={status === 'in-progress'}
            className={cn(
              'px-6 py-2.5 rounded-lg text-base font-medium transition-all duration-200',
              activeDuration === duration.value
                ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
              status === 'in-progress' && 'opacity-50 cursor-not-allowed'
            )}
          >
            {duration.label}
          </button>
        ))}
      </div>

      {/* Metrics Display */}
      <div className="mb-8 flex space-x-12 text-2xl font-semibold">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-primary">{wpm}</span>
          <span className="text-sm text-muted-foreground mt-1">WPM</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-primary">{accuracy}%</span>
          <span className="text-sm text-muted-foreground mt-1">Accuracy</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-primary">{formatTime(timeLeft)}</span>
          <span className="text-sm text-muted-foreground mt-1">Time</span>
        </div>
      </div>

      {/* Typing Text Container */}
      <div
        ref={textContainerRef}
        className="relative w-full max-w-[800px] h-48 overflow-y-auto overflow-x-hidden p-8 bg-card rounded-xl shadow-2xl font-mono text-2xl leading-relaxed tracking-wide cursor-text selection:bg-transparent border-2 border-border"
        onClick={() => inputRef.current?.focus()}
      >
        {status === 'waiting' && !textToType ? (
          <div className="text-center text-muted-foreground animate-pulse mt-16">
            Loading test...
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {textToType.split('').map((char, index) => {
              let charClass = 'text-gray-500 dark:text-gray-400';
              if (index < userInput.length) {
                charClass =
                  char === userInput[index]
                    ? 'text-green-500 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400';
              }

              const isCurrentChar = index === userInput.length && status === 'in-progress';

              return (
                <span key={index} className={cn(charClass, 'relative inline-block char-span')}>
                  {char === ' ' ? '\u00A0' : char}
                  {isCurrentChar && (
                    <span className="absolute left-0 top-0 w-0.5 h-full bg-primary animate-blink"></span>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {/* Finished Overlay */}
        {status === 'finished' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="p-10 bg-card rounded-2xl shadow-2xl border-2 border-primary text-center">
              <h2 className="text-4xl font-bold mb-6 text-primary">Test Finished!</h2>
              <div className="space-y-3 mb-6">
                <p className="text-2xl">
                  WPM: <span className="text-green-500 font-bold">{wpm}</span>
                </p>
                <p className="text-2xl">
                  Accuracy: <span className="text-green-500 font-bold">{accuracy}%</span>
                </p>
                <p className="text-xl text-muted-foreground">
                  Errors: <span className="text-red-500 font-semibold">{errors}</span>
                </p>
              </div>
              <button
                onClick={handleRestart}
                className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Take Another Test
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="text"
        className="sr-only"
        value={userInput}
        onChange={handleUserInput}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Restart Button */}
      {status === 'in-progress' && (
        <button
          onClick={handleRestart}
          className="mt-8 px-8 py-3 bg-red-600 text-white rounded-lg text-lg font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Restart Test
        </button>
      )}
    </div>
  );
}
