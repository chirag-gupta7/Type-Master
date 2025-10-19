'use client';

import { useState, useEffect } from 'react';
import { VisualKeyboard } from '@/components/VisualKeyboard';
import { Button } from '@/components/ui/button';

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

  const currentPhrase = DEMO_PHRASES[phraseIndex];
  const targetChar = currentPhrase[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return;

      const pressed = e.key;
      setLastKey(pressed);

      // Check if correct
      const correct = pressed === targetChar;
      setIsCorrect(correct);

      // Move to next character if correct
      if (correct) {
        if (currentIndex < currentPhrase.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Phrase completed
          setTimeout(() => {
            nextPhrase();
          }, 1000);
        }
      }

      // Reset feedback after animation
      setTimeout(() => {
        setLastKey('');
        setIsCorrect(undefined);
      }, 300);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetChar, currentIndex, currentPhrase.length]);

  const nextPhrase = () => {
    setPhraseIndex((prev) => (prev + 1) % DEMO_PHRASES.length);
    setCurrentIndex(0);
    setLastKey('');
    setIsCorrect(undefined);
  };

  const resetDemo = () => {
    setCurrentIndex(0);
    setLastKey('');
    setIsCorrect(undefined);
  };

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
                width: `${((currentIndex / currentPhrase.length) * 100).toFixed(0)}%`,
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
