'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Keyboard layout definition
const KEYBOARD_LAYOUT = [
  // Row 1 (Numbers)
  [
    { key: '`', code: 'Backquote', width: 'w-12' },
    { key: '1', code: 'Digit1', width: 'w-12' },
    { key: '2', code: 'Digit2', width: 'w-12' },
    { key: '3', code: 'Digit3', width: 'w-12' },
    { key: '4', code: 'Digit4', width: 'w-12' },
    { key: '5', code: 'Digit5', width: 'w-12' },
    { key: '6', code: 'Digit6', width: 'w-12' },
    { key: '7', code: 'Digit7', width: 'w-12' },
    { key: '8', code: 'Digit8', width: 'w-12' },
    { key: '9', code: 'Digit9', width: 'w-12' },
    { key: '0', code: 'Digit0', width: 'w-12' },
    { key: '-', code: 'Minus', width: 'w-12' },
    { key: '=', code: 'Equal', width: 'w-12' },
    { key: 'Backspace', code: 'Backspace', width: 'w-20' },
  ],
  // Row 2 (Top letter row)
  [
    { key: 'Tab', code: 'Tab', width: 'w-16' },
    { key: 'Q', code: 'KeyQ', width: 'w-12' },
    { key: 'W', code: 'KeyW', width: 'w-12' },
    { key: 'E', code: 'KeyE', width: 'w-12' },
    { key: 'R', code: 'KeyR', width: 'w-12' },
    { key: 'T', code: 'KeyT', width: 'w-12' },
    { key: 'Y', code: 'KeyY', width: 'w-12' },
    { key: 'U', code: 'KeyU', width: 'w-12' },
    { key: 'I', code: 'KeyI', width: 'w-12' },
    { key: 'O', code: 'KeyO', width: 'w-12' },
    { key: 'P', code: 'KeyP', width: 'w-12' },
    { key: '[', code: 'BracketLeft', width: 'w-12' },
    { key: ']', code: 'BracketRight', width: 'w-12' },
    { key: '\\', code: 'Backslash', width: 'w-16' },
  ],
  // Row 3 (Home row)
  [
    { key: 'Caps', code: 'CapsLock', width: 'w-20' },
    { key: 'A', code: 'KeyA', width: 'w-12' },
    { key: 'S', code: 'KeyS', width: 'w-12' },
    { key: 'D', code: 'KeyD', width: 'w-12' },
    { key: 'F', code: 'KeyF', width: 'w-12', homeRow: true },
    { key: 'G', code: 'KeyG', width: 'w-12' },
    { key: 'H', code: 'KeyH', width: 'w-12' },
    { key: 'J', code: 'KeyJ', width: 'w-12', homeRow: true },
    { key: 'K', code: 'KeyK', width: 'w-12' },
    { key: 'L', code: 'KeyL', width: 'w-12' },
    { key: ';', code: 'Semicolon', width: 'w-12' },
    { key: "'", code: 'Quote', width: 'w-12' },
    { key: 'Enter', code: 'Enter', width: 'w-24' },
  ],
  // Row 4 (Bottom letter row)
  [
    { key: 'Shift', code: 'ShiftLeft', width: 'w-24' },
    { key: 'Z', code: 'KeyZ', width: 'w-12' },
    { key: 'X', code: 'KeyX', width: 'w-12' },
    { key: 'C', code: 'KeyC', width: 'w-12' },
    { key: 'V', code: 'KeyV', width: 'w-12' },
    { key: 'B', code: 'KeyB', width: 'w-12' },
    { key: 'N', code: 'KeyN', width: 'w-12' },
    { key: 'M', code: 'KeyM', width: 'w-12' },
    { key: ',', code: 'Comma', width: 'w-12' },
    { key: '.', code: 'Period', width: 'w-12' },
    { key: '/', code: 'Slash', width: 'w-12' },
    { key: 'Shift', code: 'ShiftRight', width: 'w-28' },
  ],
  // Row 5 (Space bar row)
  [
    { key: 'Ctrl', code: 'ControlLeft', width: 'w-16' },
    { key: 'Win', code: 'MetaLeft', width: 'w-12' },
    { key: 'Alt', code: 'AltLeft', width: 'w-12' },
    { key: 'Space', code: 'Space', width: 'flex-1' },
    { key: 'Alt', code: 'AltRight', width: 'w-12' },
    { key: 'Win', code: 'MetaRight', width: 'w-12' },
    { key: 'Ctrl', code: 'ControlRight', width: 'w-16' },
  ],
];

interface VisualKeyboardProps {
  /** The target key that should be pressed (will be highlighted in yellow) */
  targetKey?: string;
  /** The last key that was pressed */
  pressedKey?: string;
  /** Whether the last key press was correct */
  isCorrect?: boolean;
  /** Show home row markers on F and J keys */
  showHomeRowMarkers?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Custom className for the container */
  className?: string;
}

/**
 * VisualKeyboard Component
 *
 * Displays an interactive QWERTY keyboard layout with visual feedback.
 * - Green: Correct key press
 * - Red: Incorrect key press
 * - Yellow: Target key to press
 * - Home row markers on F and J keys
 * - Responsive animations
 *
 * @example
 * ```tsx
 * <VisualKeyboard
 *   targetKey="a"
 *   pressedKey="a"
 *   isCorrect={true}
 *   showHomeRowMarkers={true}
 * />
 * ```
 */
export function VisualKeyboard({
  targetKey,
  pressedKey,
  isCorrect,
  showHomeRowMarkers = true,
  compact = false,
  className,
}: VisualKeyboardProps) {
  const [animatingKey, setAnimatingKey] = useState<string | null>(null);

  // Normalize keys for comparison (handle special cases)
  const normalizeKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      Enter: 'Enter',
      Backspace: 'Backspace',
      Tab: 'Tab',
      Shift: 'ShiftLeft',
      Control: 'ControlLeft',
      Alt: 'AltLeft',
      Meta: 'MetaLeft',
    };
    return keyMap[key] || key.toUpperCase();
  };

  // Handle key press animation
  useEffect(() => {
    if (pressedKey) {
      const normalized = normalizeKey(pressedKey);
      setAnimatingKey(normalized);
      const timer = setTimeout(() => setAnimatingKey(null), 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pressedKey]);

  // Get key state (target, correct, incorrect, neutral)
  const getKeyState = (keyCode: string, keyChar: string) => {
    const normalizedTarget = targetKey ? normalizeKey(targetKey) : null;
    const normalizedPressed = pressedKey ? normalizeKey(pressedKey) : null;
    const normalizedKeyCode = keyCode;
    const normalizedKeyChar = keyChar.toUpperCase();

    // Check if this is the target key
    const isTarget =
      normalizedTarget === normalizedKeyCode ||
      normalizedTarget === normalizedKeyChar ||
      (normalizedTarget === 'SPACE' && keyCode === 'Space');

    // Check if this key was just pressed
    const wasPressed =
      normalizedPressed === normalizedKeyCode ||
      normalizedPressed === normalizedKeyChar ||
      (normalizedPressed === 'SPACE' && keyCode === 'Space');

    if (isTarget) return 'target';
    if (wasPressed && isCorrect) return 'correct';
    if (wasPressed && !isCorrect) return 'incorrect';
    return 'neutral';
  };

  // Get key styling based on state
  const getKeyClassName = (keyCode: string, keyChar: string, width: string) => {
    const state = getKeyState(keyCode, keyChar);
    const isAnimating = animatingKey === keyCode || animatingKey === keyChar.toUpperCase();

    return cn(
      // Base styles
      'h-12 rounded-md font-medium transition-all duration-150 flex items-center justify-center relative',
      'border-2 select-none',
      compact ? 'text-xs' : 'text-sm',
      width,

      // State-based colors
      {
        // Target key (yellow)
        'bg-yellow-400/20 border-yellow-500 text-yellow-700 dark:text-yellow-300':
          state === 'target',

        // Correct key (green)
        'bg-green-500/20 border-green-600 text-green-700 dark:text-green-300 shadow-lg shadow-green-500/20':
          state === 'correct',

        // Incorrect key (red)
        'bg-red-500/20 border-red-600 text-red-700 dark:text-red-300 shadow-lg shadow-red-500/20':
          state === 'incorrect',

        // Neutral key
        'bg-card border-border hover:bg-muted hover:border-primary/50': state === 'neutral',
      },

      // Animation
      {
        'scale-95': isAnimating,
        'scale-100': !isAnimating,
      },

      // Pulse animation for target key
      {
        'animate-pulse': state === 'target',
      }
    );
  };

  return (
    <div className={cn('w-full max-w-5xl mx-auto', className)}>
      <div className="space-y-2">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {row.map((keyData) => (
              <div
                key={keyData.code}
                className={getKeyClassName(keyData.code, keyData.key, keyData.width)}
                role="button"
                aria-label={keyData.key}
              >
                {/* Key label */}
                <span className="relative z-10">{keyData.key === 'Space' ? '' : keyData.key}</span>

                {/* Home row markers (bumps on F and J) */}
                {showHomeRowMarkers && keyData.homeRow && (
                  <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-1 bg-current opacity-30 rounded-full" />
                  </div>
                )}

                {/* Target key indicator (pulsing dot) */}
                {getKeyState(keyData.code, keyData.key) === 'target' && (
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-400/20 border-2 border-yellow-500" />
          <span>Target Key</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-600" />
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border-2 border-red-600" />
          <span>Incorrect</span>
        </div>
      </div>
    </div>
  );
}
