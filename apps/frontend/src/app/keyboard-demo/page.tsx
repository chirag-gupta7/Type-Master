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
      // Prevent spacebar from scrolling the page
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
      }

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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Visual Keyboard Demo
          </h1>
          <p className="text-muted-foreground">
            Type the characters below to see live keyboard feedback
          </p>
        </div>

        {/* Typing Area */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8 mb-6">
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
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>

          {/* Compact Controls */}
          <div className="flex gap-3 justify-center mb-6 flex-wrap">
            <Button onClick={resetDemo} variant="outline" size="sm">
              Reset
            </Button>
            <Button onClick={nextPhrase} size="sm">
              Next Phrase
            </Button>
            <Button onClick={() => setShowHomeRow(!showHomeRow)} variant="outline" size="sm">
              Home Row: {showHomeRow ? 'ON' : 'OFF'}
            </Button>
            <Button onClick={() => setCompact(!compact)} variant="outline" size="sm">
              {compact ? 'Normal' : 'Compact'}
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

          {/* Stats and Guidance */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-sm">
              <p className="font-semibold text-foreground mb-2">Stats</p>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Progress</span>
                <span>
                  {Math.min(currentIndex, currentPhrase.length)} / {currentPhrase.length}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-muted-foreground">
                <span>Mistakes</span>
                <span className={mistakes ? 'text-red-500' : ''}>{mistakes}</span>
              </div>
              {feedback && (
                <div className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                  {feedback}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Finger Guide</p>
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

        {/* Minimal Legend */}
        <div className="bg-card/50 rounded-lg border border-border/50 p-4">
          <div className="flex gap-6 justify-center flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Next key</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Wrong</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
