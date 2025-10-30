'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AchievementUnlockModal } from '@/components/AchievementUnlockModal';
import { AchievementToast } from '@/components/AchievementToast';
import { MilestoneCelebration } from '@/components/MilestoneCelebration';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category: string;
  points: number;
}

interface Milestone {
  type: 'lessons_completed' | 'speed_milestone' | 'accuracy_streak' | 'section_complete';
  count: number;
  title: string;
  message: string;
}

interface AchievementContextType {
  showAchievement: (achievement: Achievement, withModal?: boolean) => void;
  showMilestone: (milestone: Milestone) => void;
  clearNotifications: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toastAchievement, setToastAchievement] = useState<Achievement | null>(null);
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const showAchievement = useCallback((achievement: Achievement, withModal = true) => {
    if (withModal) {
      setCurrentAchievement(achievement);
      setShowModal(true);
    } else {
      setToastAchievement(achievement);
    }
  }, []);

  const showMilestone = useCallback((milestone: Milestone) => {
    setCurrentMilestone(milestone);
    setShowMilestoneModal(true);
  }, []);

  const clearNotifications = useCallback(() => {
    setCurrentAchievement(null);
    setShowModal(false);
    setToastAchievement(null);
    setCurrentMilestone(null);
    setShowMilestoneModal(false);
  }, []);

  return (
    <AchievementContext.Provider
      value={{
        showAchievement,
        showMilestone,
        clearNotifications,
      }}
    >
      {children}

      {/* Achievement Modal */}
      <AchievementUnlockModal
        achievement={currentAchievement}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCurrentAchievement(null);
        }}
      />

      {/* Achievement Toast */}
      <AchievementToast
        achievement={toastAchievement}
        onClose={() => setToastAchievement(null)}
      />

      {/* Milestone Celebration */}
      <MilestoneCelebration
        isOpen={showMilestoneModal}
        milestone={currentMilestone}
        onClose={() => {
          setShowMilestoneModal(false);
          setCurrentMilestone(null);
        }}
      />
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
}
