'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { VisualKeyboard } from '@/components/VisualKeyboard';
import { Button } from '@/components/ui/button';
import { HandPositionGuide } from '@/components/HandPositionGuide';
import { AnimatedHandOverlay } from '@/components/AnimatedHandOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Zap, Target, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Neon Effect */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            Interactive Keyboard Trainer
          </h1>
          <p className="text-gray-400 text-lg">Watch animated hand guidance as you type</p>
        </motion.div>

        {/* Typing Area with Glassmorphism */}
        <motion.div
          className="relative bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 md:p-8 mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            boxShadow:
              '0 0 40px rgba(59, 130, 246, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.02)',
          }}
        >
          {/* Stats Bar with Neon Glow */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div
              className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-lg p-4 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: 'rgba(59, 130, 246, 0.5)' }}
              style={{
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">Speed</span>
              </div>
              <div className="text-2xl font-bold text-white">{progressPercentage}%</div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: 'rgba(34, 197, 94, 0.5)' }}
              style={{
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">Accuracy</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {currentIndex > 0
                  ? Math.round(((currentIndex - mistakes) / currentIndex) * 100)
                  : 100}
                %
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
              style={{
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">Progress</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {currentIndex}/{currentPhrase.length}
              </div>
            </motion.div>
          </div>

          {/* Text Display with Neon Highlight */}
          <div className="text-center mb-6 p-6 bg-black/40 rounded-xl border border-white/5">
            <div className="text-2xl md:text-3xl font-mono tracking-wider leading-relaxed">
              {currentPhrase.split('').map((char, index) => (
                <motion.span
                  key={index}
                  className={`
                    ${
                      index === currentIndex
                        ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-125 inline-block'
                        : ''
                    }
                    ${index < currentIndex ? 'text-green-400' : 'text-gray-600'}
                  `}
                  animate={
                    index === currentIndex
                      ? {
                          textShadow: [
                            '0 0 10px rgba(34,211,238,0.8)',
                            '0 0 20px rgba(34,211,238,1)',
                            '0 0 10px rgba(34,211,238,0.8)',
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {char === ' ' ? '␣' : char}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Progress Bar with Glow */}
          <div className="relative w-full h-3 bg-black/40 rounded-full mb-6 overflow-hidden border border-white/10">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 rounded-full"
              style={{
                width: `${progressPercentage}%`,
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Controls with Neon Buttons */}
          <div className="flex gap-3 justify-center mb-8 flex-wrap">
            <Button
              onClick={resetDemo}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all duration-300"
              style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={nextPhrase}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 transition-all duration-300"
              style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
            >
              <Play className="h-4 w-4 mr-2" />
              Next Phrase
            </Button>
            <Button
              onClick={() => setShowHomeRow(!showHomeRow)}
              variant="outline"
              size="sm"
              className={`border-purple-500/50 transition-all duration-300 ${
                showHomeRow
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                  : 'text-purple-400 hover:bg-purple-500/10'
              }`}
              style={{ boxShadow: showHomeRow ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none' }}
            >
              Home Row
            </Button>
            <Button
              onClick={() => setCompact(!compact)}
              variant="outline"
              size="sm"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500 transition-all duration-300"
            >
              {compact ? 'Normal' : 'Compact'}
            </Button>
          </div>

          {/* Animated Hand Overlay */}
          <div className="relative min-h-[400px] mb-6">
            <AnimatedHandOverlay
              targetKey={targetChar}
              pressedKey={lastKey}
              isCorrect={isCorrect}
            />
          </div>

          {/* Visual Keyboard with Glow Effects */}
          <div className="relative">
            <div
              className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent blur-3xl -z-10"
              style={{ height: '120%' }}
            />
            <VisualKeyboard
              targetKey={targetChar}
              pressedKey={lastKey}
              isCorrect={isCorrect}
              showHomeRowMarkers={showHomeRow}
              compact={compact}
            />
          </div>

          {/* Performance Metrics */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm"
                style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)' }}
              >
                <p className="text-sm text-red-300">{feedback}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Finger Guide Card */}
          <div className="mt-6 bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <p className="mb-3 text-sm font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              Active Finger Guide
            </p>
            <HandPositionGuide
              targetKey={targetChar}
              compact
              showArrow
              showFingerLabels={false}
              className="mx-auto"
            />
          </div>
        </motion.div>

        {/* Legend with Neon Glow */}
        <motion.div
          className="bg-gradient-to-br from-[#1a1a1a]/70 to-[#0f0f0f]/70 backdrop-blur-lg rounded-xl border border-white/10 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Color Guide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center gap-2 p-3 bg-black/30 rounded-lg border border-red-500/30 hover:border-red-500/60 transition-all">
              <div
                className="w-8 h-8 rounded-full bg-red-500"
                style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)' }}
              />
              <span className="text-xs text-gray-400">Pinky</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-black/30 rounded-lg border border-orange-500/30 hover:border-orange-500/60 transition-all">
              <div
                className="w-8 h-8 rounded-full bg-orange-500"
                style={{ boxShadow: '0 0 20px rgba(249, 115, 22, 0.6)' }}
              />
              <span className="text-xs text-gray-400">Ring</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-black/30 rounded-lg border border-yellow-500/30 hover:border-yellow-500/60 transition-all">
              <div
                className="w-8 h-8 rounded-full bg-yellow-500"
                style={{ boxShadow: '0 0 20px rgba(234, 179, 8, 0.6)' }}
              />
              <span className="text-xs text-gray-400">Middle</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-black/30 rounded-lg border border-green-500/30 hover:border-green-500/60 transition-all">
              <div
                className="w-8 h-8 rounded-full bg-green-500"
                style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)' }}
              />
              <span className="text-xs text-gray-400">Index</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-black/30 rounded-lg border border-blue-500/30 hover:border-blue-500/60 transition-all">
              <div
                className="w-8 h-8 rounded-full bg-blue-500"
                style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' }}
              />
              <span className="text-xs text-gray-400">Thumb</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex gap-6 justify-center flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-cyan-400"
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(34, 211, 238, 0.6)',
                      '0 0 20px rgba(34, 211, 238, 1)',
                      '0 0 10px rgba(34, 211, 238, 0.6)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-gray-400">Next key</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full bg-green-500"
                  style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)' }}
                />
                <span className="text-gray-400">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full bg-red-500"
                  style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)' }}
                />
                <span className="text-gray-400">Wrong</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
