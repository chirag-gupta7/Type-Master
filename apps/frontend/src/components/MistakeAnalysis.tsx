'use client';

import { motion } from 'framer-motion';
import { BarChart3, Target, AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeakKey {
  key: string;
  errorCount: number;
}

interface MistakeAnalysisProps {
  weakKeys: WeakKey[];
  practiceText: string;
  onRetry?: () => void;
  onContinue?: () => void;
}

export function MistakeAnalysis({
  weakKeys,
  practiceText,
  onRetry,
  onContinue,
}: MistakeAnalysisProps) {
  // Group mistakes by severity
  const criticalKeys = weakKeys.filter((k) => k.errorCount >= 5);
  const moderateKeys = weakKeys.filter((k) => k.errorCount >= 3 && k.errorCount < 5);
  const minorKeys = weakKeys.filter((k) => k.errorCount < 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold mb-2">📊 Mistake Analysis</h2>
        <p className="text-muted-foreground text-lg">
          Let's identify areas for improvement
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-semibold text-red-900 dark:text-red-100">Critical</span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {criticalKeys.length}
          </p>
          <p className="text-xs text-muted-foreground">5+ errors</p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-semibold text-yellow-900 dark:text-yellow-100">Moderate</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {moderateKeys.length}
          </p>
          <p className="text-xs text-muted-foreground">3-4 errors</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-900 dark:text-blue-100">Minor</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {minorKeys.length}
          </p>
          <p className="text-xs text-muted-foreground">1-2 errors</p>
        </div>
      </motion.div>

      {/* Weak Keys Display */}
      {weakKeys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-lg p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            Keys That Need Practice
          </h3>

          {/* Critical Keys */}
          {criticalKeys.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                🔴 Critical (Practice these first!)
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {criticalKeys.map((item, idx) => (
                  <motion.div
                    key={item.key}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-3 text-center relative"
                  >
                    <p className="text-2xl font-mono font-bold text-red-700 dark:text-red-300">
                      {item.key === ' ' ? '␣' : item.key}
                    </p>
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-1">
                      {item.errorCount}x
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Moderate Keys */}
          {moderateKeys.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                🟡 Moderate (Room for improvement)
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {moderateKeys.map((item, idx) => (
                  <motion.div
                    key={item.key}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-center"
                  >
                    <p className="text-2xl font-mono font-bold text-yellow-700 dark:text-yellow-300">
                      {item.key === ' ' ? '␣' : item.key}
                    </p>
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium mt-1">
                      {item.errorCount}x
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Minor Keys */}
          {minorKeys.length > 0 && (
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                🔵 Minor (Almost there!)
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {minorKeys.map((item, idx) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className="bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3 text-center"
                  >
                    <p className="text-2xl font-mono font-bold text-blue-700 dark:text-blue-300">
                      {item.key === ' ' ? '␣' : item.key}
                    </p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                      {item.errorCount}x
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Practice Recommendation */}
      {practiceText && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-6"
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Personalized Practice Text
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            This custom text focuses on your weak keys. Practice it to build muscle memory:
          </p>
          <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <p className="font-mono text-lg leading-relaxed">{practiceText}</p>
          </div>
          <div className="mt-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-sm text-purple-900 dark:text-purple-100">
            <p className="font-medium">💡 Pro Tip:</p>
            <p className="text-purple-800 dark:text-purple-200">
              Type this slowly at first, focusing on accuracy over speed. Your speed will naturally improve as your accuracy increases.
            </p>
          </div>
        </motion.div>
      )}

      {/* Finger Position Reminder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">✋ Remember the Basics:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Keep your fingers on the home row (ASDF JKL;)</li>
          <li>• Use the correct finger for each key</li>
          <li>• Look at the screen, not the keyboard</li>
          <li>• Take breaks to avoid fatigue</li>
        </ul>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-4 justify-center pt-4"
      >
        {onRetry && (
          <Button variant="outline" size="lg" onClick={onRetry}>
            Practice This Lesson Again
          </Button>
        )}
        {onContinue && (
          <Button size="lg" onClick={onContinue}>
            Continue to Next Lesson
          </Button>
        )}
      </motion.div>
    </div>
  );
}
