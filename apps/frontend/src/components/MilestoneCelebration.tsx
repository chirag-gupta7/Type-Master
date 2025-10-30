'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: {
    type: 'lessons_completed' | 'speed_milestone' | 'accuracy_streak' | 'section_complete';
    count: number;
    title: string;
    message: string;
  } | null;
}

export function MilestoneCelebration({ isOpen, onClose, milestone }: MilestoneCelebrationProps) {
  if (!milestone) return null;

  const getIcon = () => {
    switch (milestone.type) {
      case 'lessons_completed':
        return <Trophy className="w-20 h-20" />;
      case 'speed_milestone':
        return <Zap className="w-20 h-20" />;
      case 'accuracy_streak':
        return <Target className="w-20 h-20" />;
      case 'section_complete':
        return <Award className="w-20 h-20" />;
      default:
        return <Star className="w-20 h-20" />;
    }
  };

  const getGradient = () => {
    switch (milestone.type) {
      case 'lessons_completed':
        return 'from-purple-500 via-pink-500 to-red-500';
      case 'speed_milestone':
        return 'from-blue-500 via-cyan-500 to-teal-500';
      case 'accuracy_streak':
        return 'from-green-500 via-emerald-500 to-lime-500';
      case 'section_complete':
        return 'from-yellow-500 via-orange-500 to-red-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  const getEmoji = () => {
    switch (milestone.type) {
      case 'lessons_completed':
        return '🎓';
      case 'speed_milestone':
        return '⚡';
      case 'accuracy_streak':
        return '🎯';
      case 'section_complete':
        return '🏆';
      default:
        return '🎉';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0, rotateY: -180 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0, rotateY: 180 }}
            transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative"
          >
            {/* Animated Background Gradient */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
              className={`absolute inset-0 bg-gradient-to-r ${getGradient()} opacity-10 bg-[length:200%_200%]`}
            />

            {/* Content */}
            <div className="relative p-8 sm:p-12 text-center">
              {/* Floating Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [-20, -40, -20],
                    x: [0, (i % 2 === 0 ? 20 : -20), 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="absolute"
                  style={{
                    top: `${20 + i * 10}%`,
                    left: `${10 + i * 15}%`,
                  }}
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}

              {/* Large Count Number */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', duration: 0.8 }}
                className="mb-6"
              >
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getGradient()} text-white shadow-2xl`}
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="text-5xl font-bold"
                    >
                      {milestone.count}
                    </motion.div>
                    {getIcon()}
                  </div>
                </motion.div>

                {/* Glow Effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br ${getGradient()} rounded-full blur-3xl -z-10`}
                />
              </motion.div>

              {/* Milestone Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4"
              >
                <h2 className="text-5xl font-bold mb-2">{getEmoji()}</h2>
                <h3 className="text-3xl font-bold mb-2">{milestone.title}</h3>
                <p className="text-lg text-muted-foreground">{milestone.message}</p>
              </motion.div>

              {/* Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-3 mb-6"
              >
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {milestone.count}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg p-3">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">↑</p>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-3">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">↑</p>
                </div>
              </motion.div>

              {/* Motivational Quote */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-6"
              >
                <p className="text-sm italic text-muted-foreground">
                  "Every keystroke is a step towards mastery. Keep up the amazing work!"
                </p>
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={onClose}
                  size="lg"
                  className={`w-full bg-gradient-to-r ${getGradient()} hover:opacity-90 transition-opacity`}
                >
                  Continue Learning 🚀
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
