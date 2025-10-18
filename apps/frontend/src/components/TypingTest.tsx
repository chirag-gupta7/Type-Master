'use client';

import { useEffect, useRef, useState } from 'react';
import { useTypingTestStore } from '@/store';
import { testAPI, authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DURATIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 180, label: '3m' },
] as const;

export function TypingTest() {
  const {
    status,
    textToType,
    userInput,
    startTime,
    errors,
    wpm,
    accuracy,
    duration,
    startTest,
    setUserInput,
    endTest,
    resetTest,
  } = useTypingTestStore();

  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 180>(60);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when test starts
  useEffect(() => {
    if (status === 'in-progress' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // Handle timer countdown
  useEffect(() => {
    if (status === 'in-progress' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = duration - elapsed;

        if (remaining <= 0) {
          setTimeRemaining(0);
          endTest();
        } else {
          setTimeRemaining(remaining);
        }
      }, 100);

      return () => clearInterval(interval);
    }

    return undefined;
  }, [status, startTime, duration, endTest]);

  // Save test result when finished
  useEffect(() => {
    const saveResult = async () => {
      if (status === 'finished' && authAPI.isAuthenticated()) {
        try {
          // Calculate raw WPM (without error penalty)
          const timeInMinutes = duration / 60;
          const rawWpm = Math.round(userInput.length / 5 / timeInMinutes);

          await testAPI.saveTestResult({
            wpm,
            accuracy,
            rawWpm,
            errors,
            duration,
            mode: 'TIME',
          });

          setSaveMessage('✓ Result saved successfully!');
          setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
          console.error('Failed to save test result:', error);
          setSaveMessage('✗ Failed to save result');
          setTimeout(() => setSaveMessage(''), 3000);
        }
      }
    };

    saveResult();
  }, [status, wpm, accuracy, errors, duration, userInput.length]);

  const handleStartTest = async () => {
    setIsLoading(true);
    setSaveMessage('');

    try {
      const { text } = await testAPI.getTest(selectedDuration);
      startTest(text, selectedDuration);
      setTimeRemaining(selectedDuration);
    } catch (error) {
      console.error('Failed to fetch test:', error);
      // Fallback to local text if API fails
      const fallbackText = 'The quick brown fox jumps over the lazy dog.';
      startTest(fallbackText, selectedDuration);
      setTimeRemaining(selectedDuration);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'in-progress') {
      setUserInput(e.target.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent certain keys during test
    if (status === 'in-progress') {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    }
  };

  const handleRestart = () => {
    resetTest();
    setSaveMessage('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderText = () => {
    return textToType.split('').map((char, index) => {
      let className = 'text-muted-foreground';

      if (index < userInput.length) {
        // Character has been typed
        if (userInput[index] === char) {
          className = 'text-green-500';
        } else {
          className = 'text-red-500 bg-red-100 dark:bg-red-900/30';
        }
      } else if (index === userInput.length) {
        // Current character - add cursor
        className = 'text-foreground border-b-2 border-primary animate-pulse';
      }

      return (
        <span key={index} className={cn('text-xl font-mono', className)}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">TypeMaster</h1>
          <p className="mt-2 text-muted-foreground">Test your typing speed and accuracy</p>
        </div>

        {/* Duration Selection */}
        {status === 'waiting' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              {DURATIONS.map((dur) => (
                <Button
                  key={dur.value}
                  variant={selectedDuration === dur.value ? 'default' : 'outline'}
                  onClick={() => setSelectedDuration(dur.value)}
                  size="lg"
                >
                  {dur.label}
                </Button>
              ))}
            </div>

            <Button
              size="lg"
              onClick={handleStartTest}
              disabled={isLoading}
              className="min-w-[200px]"
            >
              {isLoading ? 'Loading...' : 'Start Test'}
            </Button>

            {!authAPI.isAuthenticated() && (
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                ⚠️ Sign in to save your results
              </p>
            )}
          </div>
        )}

        {/* Active Test */}
        {status === 'in-progress' && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="flex justify-between rounded-lg bg-muted p-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Time</div>
                <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">WPM</div>
                <div className="text-2xl font-bold text-primary">{wpm}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Errors</div>
                <div className="text-2xl font-bold text-red-600">{errors}</div>
              </div>
            </div>

            {/* Text Display */}
            <div className="min-h-[200px] rounded-lg border bg-card p-8 leading-relaxed">
              {renderText()}
            </div>

            {/* Hidden Input */}
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="sr-only"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />

            {/* Restart Button */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleRestart}>
                Restart Test
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {status === 'finished' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Test Complete! 🎉</h2>
              {saveMessage && (
                <p
                  className={cn(
                    'mt-2 text-sm',
                    saveMessage.includes('✓')
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-red-600 dark:text-red-500'
                  )}
                >
                  {saveMessage}
                </p>
              )}
            </div>

            {/* Results Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="text-sm text-muted-foreground">Words Per Minute</div>
                <div className="mt-2 text-4xl font-bold text-primary">{wpm}</div>
              </div>
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="mt-2 text-4xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
              </div>
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="text-sm text-muted-foreground">Errors</div>
                <div className="mt-2 text-4xl font-bold text-red-600">{errors}</div>
              </div>
              <div className="rounded-lg border bg-card p-6 text-center">
                <div className="text-sm text-muted-foreground">Characters Typed</div>
                <div className="mt-2 text-4xl font-bold">{userInput.length}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button size="lg" onClick={handleRestart}>
                Try Again
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => (window.location.href = '/dashboard')}
              >
                View Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
