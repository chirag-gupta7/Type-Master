'use client';

import { useState, useEffect } from 'react';
import { HandPositionGuide, getFingerForKey } from '@/components/HandPositionGuide';
import { Button } from '@/components/ui/button';

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
  ';', // Home row
  'Q',
  'W',
  'E',
  'R',
  'T',
  'Y',
  'U',
  'I',
  'O',
  'P', // Top row
  'Z',
  'X',
  'C',
  'V',
  'B',
  'N',
  'M',
  ',',
  '.',
  '/', // Bottom row
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0', // Numbers
  ' ', // Space
];

const HOME_ROW_KEYS = ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'];

export default function HandPositionDemo() {
  const [currentKey, setCurrentKey] = useState<string>('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [showArrow, setShowArrow] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [compact, setCompact] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>(HOME_ROW_KEYS);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hand Position Guide Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn proper finger placement with animated hand visualizations
          </p>
        </div>

        {/* Hand Position Guide */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8 mb-8">
          <HandPositionGuide
            targetKey={currentKey || undefined}
            showArrow={showArrow}
            showFingerLabels={showLabels}
            compact={compact}
          />
        </div>

        {/* Controls */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto-play */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => {
                    setAutoPlay(e.target.checked);
                    if (!e.target.checked) setCurrentKey('');
                  }}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="font-medium">Auto-play Demo</span>
              </label>

              {autoPlay && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Key Sequence:</label>
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
                </div>
              )}
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <div className="font-medium mb-3">Display Options</div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArrow}
                  onChange={(e) => setShowArrow(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Show Arrow</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Show Finger Labels</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
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

          {/* Manual Input Instructions */}
          {!autoPlay && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                💡 <span className="font-semibold">Try it out:</span> Press any key on your keyboard
                to see which finger should be used
              </p>
            </div>
          )}
        </div>

        {/* Current Key Info */}
        {currentKey && fingerInfo && (
          <div className="bg-card rounded-xl shadow-xl border border-border p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Current Key Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Key</div>
                <div className="text-3xl font-bold font-mono">
                  {currentKey === 'SPACE' ? '␣' : currentKey}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Hand</div>
                <div className="text-2xl font-semibold capitalize">{fingerInfo.hand}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Finger</div>
                <div className={`text-2xl font-semibold ${fingerInfo.color.color}`}>
                  {fingerInfo.color.name}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-card rounded-xl shadow-xl border border-border p-8">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Guide */}
            <div>
              <h3 className="font-semibold mb-3">Finger Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-sm">
                    <strong>Red:</strong> Pinky fingers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <span className="text-sm">
                    <strong>Orange:</strong> Ring fingers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <span className="text-sm">
                    <strong>Yellow:</strong> Middle fingers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-sm">
                    <strong>Green:</strong> Index fingers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span className="text-sm">
                    <strong>Blue:</strong> Thumbs (Space bar)
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div>
              <h3 className="font-semibold mb-3">Typing Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Keep your fingers on the home row (ASDF JKL;)</li>
                <li>• Use the correct finger for each key</li>
                <li>• Return to home position after each keystroke</li>
                <li>• Keep your wrists elevated and relaxed</li>
                <li>• Practice with the animated guide to build muscle memory</li>
              </ul>
            </div>
          </div>

          {/* Keyboard Layout Reference */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-3 text-center">Keyboard Layout Reference</h3>
            <div className="font-mono text-xs md:text-sm space-y-1 text-center">
              <div className="text-red-500">Q</div>
              <div>
                <span className="text-red-500">A</span> <span className="text-orange-500">S</span>{' '}
                <span className="text-yellow-500">D</span> <span className="text-green-500">F</span>{' '}
                <span className="text-muted-foreground">|</span>{' '}
                <span className="text-green-500">J</span> <span className="text-yellow-500">K</span>{' '}
                <span className="text-orange-500">L</span> <span className="text-red-500">;</span>
              </div>
              <div className="text-blue-500">[Space Bar]</div>
            </div>
          </div>
        </div>

        {/* Quick Test */}
        <div className="mt-8 bg-card rounded-xl shadow-xl border border-border p-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Test</h2>
          <p className="text-muted-foreground mb-4">
            Click on a key below to see which finger should press it:
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            {HOME_ROW_KEYS.map((key) => (
              <Button
                key={key}
                variant={currentKey === key ? 'default' : 'outline'}
                size="lg"
                onClick={() => {
                  setCurrentKey(key);
                  setTimeout(() => setCurrentKey(''), 2000);
                }}
                className="font-mono text-lg w-14 h-14"
              >
                {key}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
