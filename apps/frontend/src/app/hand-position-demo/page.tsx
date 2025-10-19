'use client';

import { useState, useEffect } from 'react';
import { HandPositionGuide, getFingerForKey } from '@/components/HandPositionGuide';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Play, Pause } from 'lucide-react';

const DEMO_KEYS = [
  'A',
  'S',
  'D',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  ';',
  'Q',
  'W',
  'E',
  'R',
  'T',
  'Y',
  'U',
  'I',
  'O',
  'P',
  'Z',
  'X',
  'C',
  'V',
  'B',
  'N',
  'M',
  ',',
  '.',
  '/',
  ' ',
];

const HOME_ROW_KEYS = ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'];

export default function HandPositionDemo() {
  const [currentKey, setCurrentKey] = useState<string>('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [showArrow, setShowArrow] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [compact, setCompact] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>(HOME_ROW_KEYS);
  const [showTips, setShowTips] = useState(false);

  // Auto-play demonstration
  useEffect(() => {
    if (!autoPlay) return;

    let index = 0;
    const interval = setInterval(() => {
      setCurrentKey(keySequence[index]);
      index = (index + 1) % keySequence.length;
    }, 1500);

    return () => clearInterval(interval);
  }, [autoPlay, keySequence]);

  // Manual keyboard input
  useEffect(() => {
    if (autoPlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent spacebar from scrolling
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
      }

      // Ignore modifier keys
      if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return;

      const key = e.key === ' ' ? 'Space' : e.key.toUpperCase();
      setCurrentKey(key);

      // Clear after 1 second
      setTimeout(() => {
        setCurrentKey('');
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoPlay]);

  const fingerInfo = currentKey ? getFingerForKey(currentKey) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 1. Header */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hand Position Guide
          </h1>
          <p className="text-muted-foreground">
            Learn proper finger placement with visual hand animations
          </p>
        </div>

        {/* 2. Hand Display Section (LARGE) */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8 md:p-12">
          <div className="scale-110 md:scale-125 lg:scale-150 origin-center py-8 md:py-12">
            <HandPositionGuide
              targetKey={currentKey || undefined}
              showArrow={showArrow}
              showFingerLabels={showLabels}
              compact={compact}
            />
          </div>
        </div>

        {/* 3. Controls Panel */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6">
          <div className="space-y-6">
            {/* Auto-play Control */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  variant={autoPlay ? 'default' : 'outline'}
                  onClick={() => {
                    setAutoPlay(!autoPlay);
                    if (autoPlay) setCurrentKey('');
                  }}
                  className="gap-2"
                >
                  {autoPlay ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Auto-play Demo
                    </>
                  )}
                </Button>

                {autoPlay && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={keySequence === HOME_ROW_KEYS ? 'default' : 'outline'}
                      onClick={() => setKeySequence(HOME_ROW_KEYS)}
                    >
                      Home Row
                    </Button>
                    <Button
                      size="sm"
                      variant={keySequence === DEMO_KEYS ? 'default' : 'outline'}
                      onClick={() => setKeySequence(DEMO_KEYS)}
                    >
                      All Keys
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Display Options & Current Key Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Options */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  Display Options
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={showArrow}
                      onChange={(e) => setShowArrow(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm">Show Arrow</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm">Show Finger Labels</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={compact}
                      onChange={(e) => setCompact(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span className="text-sm">Compact Mode</span>
                  </label>
                </div>
              </div>

              {/* Current Key Info */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                  Current Key
                </h3>
                {currentKey && fingerInfo ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-12">Key:</span>
                      <span className="text-2xl font-bold font-mono">
                        {currentKey === 'SPACE' ? '␣' : currentKey}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-12">Hand:</span>
                      <span className="text-sm font-semibold capitalize">{fingerInfo.hand}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-12">Finger:</span>
                      <span className={`text-sm font-semibold ${fingerInfo.color.color}`}>
                        {fingerInfo.color.name}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {autoPlay ? 'Auto-play active...' : 'Press any key to see info'}
                  </p>
                )}
              </div>
            </div>

            {/* Manual Input Hint */}
            {!autoPlay && (
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  💡 Press any key on your keyboard to see which finger should be used
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Compact Legend */}
        <div className="bg-card/50 rounded-lg border border-border/50 p-4">
          <div className="flex flex-wrap gap-4 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Pinky</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Ring</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Middle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Index</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Thumb</span>
            </div>
          </div>
        </div>

        {/* 5. Quick Tips (Collapsible) */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold">Quick Typing Tips</h3>
            {showTips ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {showTips && (
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep your fingers on the home row (ASDF JKL;) when not typing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Use the correct finger for each key to build muscle memory</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Return to home position after each keystroke</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep your wrists elevated and relaxed to avoid strain</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Practice regularly with the animated guide for best results</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
