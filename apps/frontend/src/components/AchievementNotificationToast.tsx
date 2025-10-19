/**
 * AchievementNotificationToast Component
 *
 * Displays a toast notification when an achievement is unlocked
 * Features:
 * - Compact achievement display
 * - Icon and points display
 * - Click to view full details
 * - Auto-dismiss with manual control
 * - Multiple notification queuing
 *
 * This version avoids passing functions as props (non-serializable) by
 * dispatching CustomEvent events for click/close actions; the container
 * listens to those and manages state locally.
 */

'use client';

import React from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AchievementIcon } from './AchievementCard';
import {
  Trophy as TrophyIcon,
  Zap,
  Target,
  Award,
  Star,
  Flame,
  Heart,
  CheckCircle2,
} from 'lucide-react';

const ACHIEVEMENT_ICONS = {
  trophy: TrophyIcon,
  zap: Zap,
  target: Target,
  award: Award,
  star: Star,
  flame: Flame,
  heart: Heart,
  check: CheckCircle2,
} as const;

export interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
}

/**
 * AchievementNotificationToast no longer accepts function props.
 * It dispatches CustomEvent('achievement-toast-action', { detail: { id, type } })
 * where type is 'close' or 'click'.
 */
interface AchievementNotificationToastProps {
  achievement: AchievementNotification;
  duration?: number; // Auto-close duration in ms (0 to disable)
}

export const AchievementNotificationToast: React.FC<AchievementNotificationToastProps> = ({
  achievement,
  duration = 5000,
}) => {
  const IconComponent = ACHIEVEMENT_ICONS[achievement.icon as AchievementIcon] || Trophy;

  const dispatchAction = React.useCallback(
    (type: 'close' | 'click') => {
      if (typeof window === 'undefined') return;
      window.dispatchEvent(
        new CustomEvent('achievement-toast-action', {
          detail: { id: achievement.id, type },
        })
      );
    },
    [achievement.id]
  );

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        dispatchAction('close');
      }, duration);

      return () => clearTimeout(timer);
    }

    // Ensure the effect always returns a value (void/undefined) on all code paths
    return undefined;
  }, [duration, dispatchAction]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => dispatchAction('click')}
      className={cn(
        'relative overflow-hidden rounded-lg shadow-lg cursor-pointer',
        'bg-gradient-to-r from-yellow-400 to-amber-500',
        'border-2 border-yellow-300',
        'max-w-sm w-full p-4',
        'hover:shadow-xl transition-shadow'
      )}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
          <IconComponent className="w-6 h-6 text-yellow-500" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-100" />
              <p className="text-xs font-semibold text-yellow-100 uppercase tracking-wide">
                Achievement Unlocked!
              </p>
            </div>
          </div>
          <h3 className="text-base font-bold text-white mb-1 truncate">{achievement.title}</h3>
          <p className="text-sm text-yellow-50 line-clamp-2 mb-2">{achievement.description}</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold text-white">
              <Sparkles className="w-3 h-3" />+{achievement.points} Points
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatchAction('close');
          }}
          className="flex-shrink-0 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/40"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

/**
 * AchievementNotificationContainer
 * This container accepts only serializable props (notifications array).
 * It manages the visible list client-side and listens for toast events
 * to remove items or react to clicks.
 */
interface AchievementNotificationContainerProps {
  notifications: AchievementNotification[];
  duration?: number;
}

export const AchievementNotificationContainer: React.FC<AchievementNotificationContainerProps> = ({
  notifications,
  duration = 5000,
}) => {
  const [items, setItems] = React.useState<AchievementNotification[]>(() => notifications);

  // Keep local state in sync if parent provides new notifications array
  React.useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { id: string; type: 'close' | 'click' }
        | undefined;
      if (!detail) return;
      const { id, type } = detail;
      if (type === 'close') {
        setItems((prev) => prev.filter((n) => n.id !== id));
      } else if (type === 'click') {
        // Remove the item on click; re-dispatch an optional event for external listeners
        setItems((prev) => prev.filter((n) => n.id !== id));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('achievement-toast-clicked', { detail: { id } }));
        }
      }
    };

    window.addEventListener('achievement-toast-action', handler as EventListener);
    return () => {
      window.removeEventListener('achievement-toast-action', handler as EventListener);
    };
  }, []);

  // Render nothing if no notifications
  if (!items || items.length === 0) return null;

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {items.map((achievement) => (
        <AchievementNotificationToast
          key={achievement.id}
          achievement={achievement}
          duration={duration}
        />
      ))}
    </div>
  );
};
