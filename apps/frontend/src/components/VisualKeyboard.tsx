'use client';

import { useEffect, useState, memo } from 'react';
import { cn } from '@/lib/utils';

const KEYBOARD_LAYOUT = [
  [
    { key: '`', code: 'Backquote', width: 'w-11' },
    { key: '1', code: 'Digit1', width: 'w-11' },
    { key: '2', code: 'Digit2', width: 'w-11' },
    { key: '3', code: 'Digit3', width: 'w-11' },
    { key: '4', code: 'Digit4', width: 'w-11' },
    { key: '5', code: 'Digit5', width: 'w-11' },
    { key: '6', code: 'Digit6', width: 'w-11' },
    { key: '7', code: 'Digit7', width: 'w-11' },
    { key: '8', code: 'Digit8', width: 'w-11' },
    { key: '9', code: 'Digit9', width: 'w-11' },
    { key: '0', code: 'Digit0', width: 'w-11' },
    { key: '-', code: 'Minus', width: 'w-11' },
    { key: '=', code: 'Equal', width: 'w-11' },
    { key: '⌫', code: 'Backspace', width: 'w-[72px]' },
  ],
  [
    { key: 'Tab', code: 'Tab', width: 'w-[64px]' },
    { key: 'Q', code: 'KeyQ', width: 'w-11' },
    { key: 'W', code: 'KeyW', width: 'w-11' },
    { key: 'E', code: 'KeyE', width: 'w-11' },
    { key: 'R', code: 'KeyR', width: 'w-11' },
    { key: 'T', code: 'KeyT', width: 'w-11' },
    { key: 'Y', code: 'KeyY', width: 'w-11' },
    { key: 'U', code: 'KeyU', width: 'w-11' },
    { key: 'I', code: 'KeyI', width: 'w-11' },
    { key: 'O', code: 'KeyO', width: 'w-11' },
    { key: 'P', code: 'KeyP', width: 'w-11' },
    { key: '[', code: 'BracketLeft', width: 'w-11' },
    { key: ']', code: 'BracketRight', width: 'w-11' },
    { key: '\\', code: 'Backslash', width: 'w-[60px]' },
  ],
  [
    { key: 'Caps', code: 'CapsLock', width: 'w-[76px]' },
    { key: 'A', code: 'KeyA', width: 'w-11' },
    { key: 'S', code: 'KeyS', width: 'w-11' },
    { key: 'D', code: 'KeyD', width: 'w-11' },
    { key: 'F', code: 'KeyF', width: 'w-11', homeRow: true },
    { key: 'G', code: 'KeyG', width: 'w-11' },
    { key: 'H', code: 'KeyH', width: 'w-11' },
    { key: 'J', code: 'KeyJ', width: 'w-11', homeRow: true },
    { key: 'K', code: 'KeyK', width: 'w-11' },
    { key: 'L', code: 'KeyL', width: 'w-11' },
    { key: ';', code: 'Semicolon', width: 'w-11' },
    { key: "'", code: 'Quote', width: 'w-11' },
    { key: 'Enter', code: 'Enter', width: 'w-[92px]' },
  ],
  [
    { key: 'Shift', code: 'ShiftLeft', width: 'w-[92px]' },
    { key: 'Z', code: 'KeyZ', width: 'w-11' },
    { key: 'X', code: 'KeyX', width: 'w-11' },
    { key: 'C', code: 'KeyC', width: 'w-11' },
    { key: 'V', code: 'KeyV', width: 'w-11' },
    { key: 'B', code: 'KeyB', width: 'w-11' },
    { key: 'N', code: 'KeyN', width: 'w-11' },
    { key: 'M', code: 'KeyM', width: 'w-11' },
    { key: ',', code: 'Comma', width: 'w-11' },
    { key: '.', code: 'Period', width: 'w-11' },
    { key: '/', code: 'Slash', width: 'w-11' },
    { key: 'Shift', code: 'ShiftRight', width: 'w-[108px]' },
  ],
  [
    { key: 'Ctrl', code: 'ControlLeft', width: 'w-[60px]' },
    { key: 'Win', code: 'MetaLeft', width: 'w-11' },
    { key: 'Alt', code: 'AltLeft', width: 'w-11' },
    { key: 'Space', code: 'Space', width: 'flex-1 min-w-[180px]' },
    { key: 'Alt', code: 'AltRight', width: 'w-11' },
    { key: 'Win', code: 'MetaRight', width: 'w-11' },
    { key: 'Ctrl', code: 'ControlRight', width: 'w-[60px]' },
  ],
];

interface KeyboardKeyProps {
  keyCode: string;
  keyLabel: string;
  width: string;
  homeRow?: boolean;
  state: 'target' | 'correct' | 'incorrect' | 'neutral';
  isAnimating: boolean;
  compact: boolean;
  showHomeRowMarkers: boolean;
}

const KeyboardKey = memo(function KeyboardKey({
  keyCode,
  keyLabel,
  width,
  homeRow,
  state,
  isAnimating,
  compact,
  showHomeRowMarkers,
}: KeyboardKeyProps) {
  return (
    <div
      className={cn(
        'relative flex h-11 select-none items-center justify-center rounded-xl border text-[12px] font-semibold tracking-wide transition-all duration-150',
        compact ? 'h-9 text-[11px]' : 'h-11',
        width,
        state === 'target' &&
          'bg-[var(--theme-primary)] text-white border-transparent shadow-[0_6px_16px_color-mix(in_srgb,var(--theme-primary)_45%,transparent)] scale-[1.02]',
        state === 'correct' &&
          'bg-emerald-500 text-white border-emerald-600 shadow-[0_6px_16px_rgba(16,185,129,0.35)]',
        state === 'incorrect' &&
          'bg-red-500 text-white border-red-600 shadow-[0_6px_16px_rgba(239,68,68,0.35)]',
        state === 'neutral' &&
          'bg-card border-border text-foreground/80 hover:border-foreground/20 hover:bg-accent',
        isAnimating && 'scale-[0.97]'
      )}
      role="img"
      aria-label={keyLabel === 'Space' ? 'Space' : keyLabel}
      data-keycode={keyCode}
    >
      <span className="relative z-10">{keyLabel === 'Space' ? '—' : keyLabel}</span>
      {showHomeRowMarkers && homeRow && (
        <span className="absolute bottom-1 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-current opacity-20" />
      )}
      {state === 'target' && (
        <span className="pointer-events-none absolute -right-1 -top-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
      )}
    </div>
  );
});

interface VisualKeyboardProps {
  targetKey?: string;
  pressedKey?: string;
  isCorrect?: boolean;
  showHomeRowMarkers?: boolean;
  compact?: boolean;
  className?: string;
}

const normalizeKey = (key: string): string => {
  const map: Record<string, string> = {
    ' ': 'Space',
    Enter: 'Enter',
    Backspace: 'Backspace',
    Tab: 'Tab',
    Shift: 'ShiftLeft',
    Control: 'ControlLeft',
    Alt: 'AltLeft',
    Meta: 'MetaLeft',
  };
  return map[key] ?? key.toUpperCase();
};

export function VisualKeyboard({
  targetKey,
  pressedKey,
  isCorrect,
  showHomeRowMarkers = true,
  compact = false,
  className,
}: VisualKeyboardProps) {
  const [animatingKey, setAnimatingKey] = useState<string | null>(null);
  const normalizedTarget = targetKey ? normalizeKey(targetKey) : null;
  const normalizedPressed = pressedKey ? normalizeKey(pressedKey) : null;

  useEffect(() => {
    if (!pressedKey) return;
    const n = normalizeKey(pressedKey);
    setAnimatingKey(n);
    const t = setTimeout(() => setAnimatingKey(null), 160);
    return () => clearTimeout(t);
  }, [pressedKey]);

  return (
    <div className={cn('w-full max-w-5xl mx-auto', className)} role="region" aria-label="Visual keyboard">
      <div className="rounded-[20px] border bg-card/60 p-3 backdrop-blur-xl md:p-4">
        <div className="space-y-1.5">
          {KEYBOARD_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1.5 justify-center">
              {row.map((k) => {
                const upper = k.key.toUpperCase();
                let state: 'target' | 'correct' | 'incorrect' | 'neutral' = 'neutral';
                const isTarget =
                  normalizedTarget === k.code ||
                  normalizedTarget === upper ||
                  (normalizedTarget === 'SPACE' && k.code === 'Space');
                const wasPressed =
                  normalizedPressed === k.code ||
                  normalizedPressed === upper ||
                  (normalizedPressed === 'SPACE' && k.code === 'Space');
                if (isTarget) state = 'target';
                else if (wasPressed) state = isCorrect ? 'correct' : 'incorrect';
                const isAnimating = animatingKey === k.code || animatingKey === upper;
                return (
                  <KeyboardKey
                    key={k.code}
                    keyCode={k.code}
                    keyLabel={k.key}
                    width={k.width}
                    homeRow={k.homeRow}
                    state={state}
                    isAnimating={isAnimating}
                    compact={compact}
                    showHomeRowMarkers={showHomeRowMarkers}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-[var(--theme-primary)] border" /> Target</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-emerald-500 border border-emerald-600" /> Correct</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-red-500 border border-red-600" /> Miss</span>
          <span className="hidden sm:inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-md bg-card border" /> Idle</span>
        </div>
      </div>
    </div>
  );
}
