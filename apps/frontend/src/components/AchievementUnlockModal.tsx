'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category: string;
  points: number;
}

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  closeEvent?: string;
}

export function AchievementUnlockModal({
  achievement,
  isOpen,
  closeEvent = 'achievement-modal-close',
}: AchievementUnlockModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const emitCloseEvent = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(new CustomEvent(closeEvent));
  };

  useEffect(() => {
    if (!isOpen || !achievement) return;

    setShowConfetti(true);
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isOpen, achievement]);

  if (!achievement) return null;

  const getIconComponent = () => {
    switch (achievement.category) {
      case 'speed':
        return <Zap className="w-16 h-16" />;
      case 'accuracy':
        return <Target className="w-16 h-16" />;
      case 'milestone':
        return <Star className="w-16 h-16" />;
      default:
        return <Trophy className="w-16 h-16" />;
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
      {isOpen && (
        <>
          {/* Confetti */}
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.3}
            />
          )}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={emitCloseEvent}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', duration: 0.7, bounce: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={emitCloseEvent}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Animated Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor()} opacity-10`}
              />

              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Icon with Glow */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', duration: 0.8 }}
                  className="mb-6"
                >
                  <div
                    className={`inline-flex p-6 rounded-full bg-gradient-to-br ${getCategoryColor()} text-white shadow-lg`}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      {getIconComponent()}
                    </motion.div>
                  </div>

                  {/* Glow Effect */}
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor()} rounded-full blur-2xl -z-10`}
                  />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mb-2"
                >
                  🎉 Achievement Unlocked!
                </motion.h2>

                {/* Achievement Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                >
                  {achievement.title}
                </motion.h3>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-6"
                >
                  {achievement.description}
                </motion.p>

                {/* Points Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full mb-6"
                >
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-bold">+{achievement.points} XP</span>
                </motion.div>

                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button onClick={emitCloseEvent} size="lg" className="w-full">
                    Awesome! 🚀
                  </Button>
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
