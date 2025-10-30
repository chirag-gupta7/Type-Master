'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, Target, Zap, Award } from 'lucide-react';
import { useEffect } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
}

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
  duration?: number;
}

export function AchievementToast({ achievement, onClose, duration = 5000 }: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [achievement, duration, onClose]);

  if (!achievement) return null;

  const getIconComponent = () => {
    switch (achievement.category) {
      case 'speed':
        return <Zap className="w-5 h-5" />;
      case 'accuracy':
        return <Target className="w-5 h-5" />;
      case 'milestone':
        return <Star className="w-5 h-5" />;
      case 'mastery':
        return <Award className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getCategoryColor = () => {
    switch (achievement.category) {
      case 'speed':
        return 'from-blue-500 to-cyan-500';
      case 'accuracy':
        return 'from-green-500 to-emerald-500';
      case 'milestone':
        return 'from-yellow-500 to-orange-500';
      case 'mastery':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Gradient Top Bar */}
            <div className={`h-1 bg-gradient-to-r ${getCategoryColor()}`} />

            {/* Content */}
            <div className="p-4 flex items-start gap-3">
              {/* Icon */}
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 2,
                  repeatDelay: 0.5,
                }}
                className={`flex-shrink-0 p-2 rounded-full bg-gradient-to-br ${getCategoryColor()} text-white`}
              >
                {getIconComponent()}
              </motion.div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm">🎉 Achievement Unlocked!</h4>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="font-bold text-base mb-1">{achievement.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>

                {/* Points */}
                <div className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span>+{achievement.points} XP</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`h-1 bg-gradient-to-r ${getCategoryColor()}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
