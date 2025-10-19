/**
 * AchievementCard Component
 *
 * Displays an achievement badge with locked/unlocked states
 * Features:
 * - Visual distinction between locked and unlocked achievements
 * - Icon display with color coding
 * - Progress indicators for partial completion
 * - Hover effects for interactivity
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Trophy, Zap, Target, Award, Star, Flame, Heart, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Achievement icon mapping
const ACHIEVEMENT_ICONS = {
  trophy: Trophy,
  zap: Zap,
  target: Target,
  award: Award,
  star: Star,
  flame: Flame,
  heart: Heart,
  check: CheckCircle2,
} as const;

export type AchievementIcon = keyof typeof ACHIEVEMENT_ICONS;

export interface AchievementCardProps {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100, for showing partial completion
  requirement?: string;
  className?: string;
  onClick?: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  description,
  icon,
  points,
  unlocked,
  unlockedAt,
  progress = 0,
  requirement,
  className,
  onClick,
}) => {
  const IconComponent = ACHIEVEMENT_ICONS[icon] || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 p-6 cursor-pointer transition-all duration-300',
        unlocked
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-75',
        className
      )}
    >
      {/* Shimmer effect for unlocked achievements */}
      {unlocked && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex gap-4">
        {/* Icon Section */}
        <div
          className={cn(
            'flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
            unlocked
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-400/50'
              : 'bg-gray-300 dark:bg-gray-700'
          )}
        >
          {unlocked ? (
            <IconComponent className="w-8 h-8 text-white" />
          ) : (
            <Lock className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          )}
        </div>

        {/* Text Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={cn(
                'text-lg font-bold truncate',
                unlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {title}
            </h3>
            <span
              className={cn(
                'flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full',
                unlocked
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              )}
            >
              {points} pts
            </span>
          </div>

          <p
            className={cn(
              'text-sm mb-3 line-clamp-2',
              unlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
            )}
          >
            {description}
          </p>

          {/* Requirement or Unlocked Date */}
          {unlocked && unlockedAt ? (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Unlocked {new Date(unlockedAt).toLocaleDateString()}</span>
            </div>
          ) : requirement ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Requirement:</span> {requirement}
            </div>
          ) : null}

          {/* Progress Bar for locked achievements */}
          {!unlocked && progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Corner decoration for unlocked achievements */}
      {unlocked && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-yellow-300/50 to-transparent rotate-45 transform origin-center" />
          <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-500 fill-yellow-500" />
        </div>
      )}
    </motion.div>
  );
};

/**
 * AchievementCardSkeleton
 * Loading state for achievement cards
 */
export const AchievementCardSkeleton: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-6">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-5/6" />
        </div>
      </div>
    </div>
  );
};

/**
 * AchievementGrid
 * Container for displaying multiple achievement cards in a responsive grid
 */
export const AchievementGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {children}
    </div>
  );
};

export default AchievementCard;
