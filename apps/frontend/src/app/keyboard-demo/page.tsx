'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { VisualKeyboard } from '@/components/VisualKeyboard';
import { Button } from '@/components/ui/button';
import { HandPositionGuide } from '@/components/HandPositionGuide';

const DEMO_PHRASES = [
  'The quick brown fox jumps over the lazy dog',
  'Hello World',
  'Welcome to TypeMaster',
  'Practice makes perfect',
  'ASDF JKL;',
];

export default function KeyboardDemoPage() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastKey, setLastKey] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | undefined>(undefined);
  const [showHomeRow, setShowHomeRow] = useState(true);
  const [compact, setCompact] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentPhrase = useMemo(() => DEMO_PHRASES[phraseIndex], [phraseIndex]);
  const targetChar = currentPhrase[currentIndex] ?? '';

  const normalizeKey = useCallback((key: string) => {
    if (key === ' ') return ' ';
    if (key === 'Space') return ' ';
    if (key === 'Enter') return '\n';
    return key.length === 1 ? key : key.toLowerCase();
  }, []);

  const nextPhrase = useCallback(() => {
    setPhraseIndex((prev) => (prev + 1) % DEMO_PHRASES.length);
    setCurrentIndex(0);
    setLastKey('');
    setIsCorrect(undefined);
    setMistakes(0);
    setFeedback(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return;

      if (!currentPhrase) return;

      const pressed = e.key;
      setLastKey(pressed);

      const normalizedPressed = normalizeKey(pressed);
      const normalizedTarget = normalizeKey(targetChar);

      if (!normalizedTarget) {
        setIsCorrect(undefined);
        return;
      }

      // Check if correct (case-insensitive for letters)
      const correct =
        normalizedPressed === normalizedTarget ||
        (normalizedPressed.length === 1 &&
          normalizedTarget.length === 1 &&
          normalizedPressed.toLowerCase() === normalizedTarget.toLowerCase());
      setIsCorrect(correct);

      // Move to next character if correct
      if (correct) {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          if (nextIndex >= currentPhrase.length) {
            setTimeout(() => {
              nextPhrase();
            }, 800);
          }
          return nextIndex;
        });
        setFeedback(null);
      }
      // Track mistakes when incorrect
      if (!correct) {
        setMistakes((prev) => prev + 1);
        const expectedLabel = targetChar === ' ' ? 'Space' : targetChar || '—';
        const receivedLabel = pressed === ' ' ? 'Space' : pressed;
        setFeedback(`Expected "${expectedLabel}" but received "${receivedLabel}"`);
      }

      // Reset feedback after animation
      setTimeout(() => {
        setLastKey('');
        setIsCorrect(undefined);
      }, 300);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPhrase, targetChar, nextPhrase, normalizeKey]);

  const resetDemo = useCallback(() => {
    setCurrentIndex(0);
    setLastKey('');
    setIsCorrect(undefined);
    setMistakes(0);
    setFeedback(null);
  }, []);

  const progressPercentage = useMemo(() => {
    if (!currentPhrase.length) return 0;
    const completed = Math.min(currentIndex, currentPhrase.length);
    return Math.round((completed / currentPhrase.length) * 100);
  }, [currentIndex, currentPhrase.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Visual Keyboard Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Type the characters shown below to see the keyboard in action
          </p>
        </div>

        {/* Typing Area */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-2xl font-mono tracking-wider">
              {currentPhrase.split('').map((char, index) => (
                <span
                  key={index}
                  className={`
                    ${index === currentIndex ? 'text-yellow-500 underline underline-offset-4' : ''}
                    ${index < currentIndex ? 'text-green-500' : 'text-muted-foreground'}
                  `}
                >
                  {char === ' ' ? '␣' : char}
                </span>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-8">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center mb-8">
            <Button onClick={resetDemo} variant="outline">
              Reset
            </Button>
            <Button onClick={nextPhrase}>Next Phrase</Button>
            <Button onClick={() => setShowHomeRow(!showHomeRow)} variant="outline">
              Home Row: {showHomeRow ? 'ON' : 'OFF'}
            </Button>
            <Button onClick={() => setCompact(!compact)} variant="outline">
              {compact ? 'Normal Size' : 'Compact'}
            </Button>
          </div>

          {/* Visual Keyboard */}
          <VisualKeyboard
            targetKey={targetChar}
            pressedKey={lastKey}
            isCorrect={isCorrect}
            showHomeRowMarkers={showHomeRow}
            compact={compact}
          />

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-sm">
              <p className="font-semibold text-foreground">Session Stats</p>
              <div className="mt-2 flex items-center justify-between text-muted-foreground">
                <span>Characters completed</span>
                <span>
                  {Math.min(currentIndex, currentPhrase.length)} / {currentPhrase.length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-muted-foreground">
                <span>Mistakes made</span>
                <span className={mistakes ? 'text-red-500' : ''}>{mistakes}</span>
              </div>
              {feedback && (
                <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                  {feedback}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Finger Guidance</p>
              <HandPositionGuide
                targetKey={targetChar}
                compact
                showArrow
                showFingerLabels={false}
                className="mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8">
          <h2 className="text-2xl font-semibold mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                Yellow Key
              </h3>
              <p className="text-sm text-muted-foreground">
                The key you need to press next. It pulses to draw your attention.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                Green Key
              </h3>
              <p className="text-sm text-muted-foreground">
                You pressed the correct key! Good job!
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                Red Key
              </h3>
              <p className="text-sm text-muted-foreground">
                Oops! You pressed the wrong key. Try again.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-muted" />
                Home Row Markers
              </h3>
              <p className="text-sm text-muted-foreground">
                Small bumps on F and J keys help you maintain proper hand position.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Keep your fingers on the home row (ASDF JKL;)</li>
              <li>• Watch the yellow key to see which finger to use</li>
              <li>• The keyboard provides instant visual feedback</li>
              <li>• Toggle compact mode for smaller screens</li>
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Phrase {phraseIndex + 1} of {DEMO_PHRASES.length}
          </p>
          <p>
            Progress: {currentIndex} / {currentPhrase.length} characters
          </p>
        </div>
      </div>
    </div>
  );
}
