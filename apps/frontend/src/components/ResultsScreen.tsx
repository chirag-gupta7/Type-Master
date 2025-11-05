'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

interface ResultsScreenProps {
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  footer?: ReactNode;
  aiFeedback?: string | null;
  isFeedbackLoading?: boolean;
}

export default function ResultsScreen({
  wpm,
  accuracy,
  errors,
  duration,
  correctChars,
  incorrectChars,
  missedChars,
  footer,
  aiFeedback,
  isFeedbackLoading,
}: ResultsScreenProps) {
  // Calculate additional stats
  const totalChars = correctChars + incorrectChars + missedChars;
  const safeTotalChars = Math.max(totalChars, 1);
  const safeDuration = Math.max(duration, 1);
  const rawWpm = Math.round(((correctChars + incorrectChars) / 5 / safeDuration) * 60);

  // Determine if it's a personal best (mock for now)
  const isPersonalBest = wpm > 100; // TODO: Compare with actual user history

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Personal Best Banner */}
      {isPersonalBest && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-xl text-center"
        >
          <p className="text-xl font-bold text-yellow-400">🎉 New Personal Best!</p>
        </motion.div>
      )}

      {/* Main Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* WPM - Large display */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
          className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 text-center"
        >
          <div className="text-sm text-muted-foreground mb-2">Words Per Minute</div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-7xl font-bold bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-transparent"
          >
            {wpm}
          </motion.div>
          <div className="text-sm text-muted-foreground mt-2">WPM</div>
        </motion.div>

        {/* Accuracy - Circular ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8, delay: 0.3 }}
          className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 flex flex-col items-center justify-center"
        >
          <div className="text-sm text-muted-foreground mb-4">Accuracy</div>
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 56}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - accuracy / 100) }}
                transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--theme-primary)" />
                  <stop offset="100%" stopColor="var(--theme-secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{accuracy}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 mb-8"
      >
        <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBox label="Raw WPM" value={rawWpm} />
          <StatBox label="Net WPM" value={wpm} />
          <StatBox label="Accuracy" value={`${accuracy}%`} />
          <StatBox label="Errors" value={errors} />
          <StatBox label="Correct Chars" value={correctChars} highlight="green" />
          <StatBox label="Duration" value={`${duration}s`} />
        </div>
      </motion.div>

      {/* Character Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 mb-8"
      >
        <h3 className="text-lg font-semibold mb-4">Character Breakdown</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 h-full transition-all duration-1000"
              style={{ width: `${(correctChars / safeTotalChars) * 100}%` }}
            />
            <div
              className="bg-red-500 h-full transition-all duration-1000"
              style={{ width: `${(incorrectChars / safeTotalChars) * 100}%` }}
            />
            <div
              className="bg-gray-600 h-full transition-all duration-1000"
              style={{ width: `${(missedChars / safeTotalChars) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Correct: {correctChars}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Incorrect: {incorrectChars}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded-full" />
            <span>Missed: {missedChars}</span>
          </div>
        </div>
      </motion.div>

      {/* AI Feedback Section */}
      {(isFeedbackLoading || aiFeedback) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--theme-primary)]" />
            <h3 className="text-lg font-semibold">AI Feedback</h3>
          </div>
          {isFeedbackLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing your performance...</span>
            </div>
          ) : aiFeedback ? (
            <p className="text-foreground leading-relaxed">{aiFeedback}</p>
          ) : null}
        </motion.div>
      )}

      {footer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: 'green' | 'red';
}) {
  return (
    <div className="bg-background/50 rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div
        className={cn(
          'text-2xl font-bold',
          highlight === 'green' && 'text-green-400',
          highlight === 'red' && 'text-red-400'
        )}
      >
        {value}
      </div>
    </div>
  );
}
