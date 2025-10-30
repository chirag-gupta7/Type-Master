import { useAchievements } from '@/context/AchievementContext';
import { useCallback } from 'react';

interface LessonResult {
  wpm: number;
  accuracy: number;
  lessonId: string;
  completed: boolean;
  stars: number;
}

interface UserStats {
  lessonsCompleted?: number;
  sectionsCompleted?: number[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
}

export function useAchievementChecker() {
  const { showAchievement, showMilestone } = useAchievements();

  const checkAchievements = useCallback(
    async (result: LessonResult, userStats?: UserStats) => {
      const achievements: Achievement[] = [];

      // Speed Achievements
      if (result.wpm >= 100 && result.wpm < 120) {
        achievements.push({
          id: 'speed_100',
          title: 'Century Club',
          description: 'Reached 100 WPM!',
          category: 'speed',
          points: 50,
        });
      } else if (result.wpm >= 120 && result.wpm < 150) {
        achievements.push({
          id: 'speed_120',
          title: 'Speed Demon',
          description: 'Blazed through at 120+ WPM!',
          category: 'speed',
          points: 100,
        });
      } else if (result.wpm >= 150) {
        achievements.push({
          id: 'speed_150',
          title: 'Lightning Fingers',
          description: 'Incredible 150+ WPM achieved!',
          category: 'speed',
          points: 200,
        });
      }

      // Accuracy Achievements
      if (result.accuracy >= 98 && result.accuracy < 99) {
        achievements.push({
          id: 'accuracy_98',
          title: 'Near Perfect',
          description: '98%+ accuracy achieved!',
          category: 'accuracy',
          points: 50,
        });
      } else if (result.accuracy >= 99 && result.accuracy < 100) {
        achievements.push({
          id: 'accuracy_99',
          title: 'Precision Master',
          description: '99%+ accuracy! Almost flawless!',
          category: 'accuracy',
          points: 100,
        });
      } else if (result.accuracy === 100) {
        achievements.push({
          id: 'accuracy_100',
          title: 'Perfectionist',
          description: 'Perfect 100% accuracy!',
          category: 'accuracy',
          points: 250,
        });
      }

      // Star Achievements
      if (result.stars === 3) {
        achievements.push({
          id: 'three_stars',
          title: 'Triple Star',
          description: 'Earned 3 stars on a lesson!',
          category: 'milestone',
          points: 30,
        });
      }

      // Completion Achievements
      if (result.completed) {
        achievements.push({
          id: 'lesson_complete',
          title: 'Lesson Completed',
          description: 'Successfully completed a lesson!',
          category: 'milestone',
          points: 10,
        });
      }

      // Show achievements (first as modal, rest as toasts)
      achievements.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievement(achievement, index === 0);
        }, index * 300);
      });

      // Check for milestones
      if (userStats) {
        const lessonsCompleted = userStats.lessonsCompleted || 0;

        if (lessonsCompleted === 10) {
          showMilestone({
            type: 'lessons_completed',
            count: 10,
            title: 'First 10 Lessons!',
            message: 'You completed your first 10 lessons. Keep up the great work!',
          });
        } else if (lessonsCompleted === 25) {
          showMilestone({
            type: 'lessons_completed',
            count: 25,
            title: 'Quarter Century!',
            message: '25 lessons completed! You are making excellent progress!',
          });
        } else if (lessonsCompleted === 50) {
          showMilestone({
            type: 'lessons_completed',
            count: 50,
            title: 'Half Century!',
            message: '50 lessons down! You are well on your way to mastery!',
          });
        } else if (lessonsCompleted === 100) {
          showMilestone({
            type: 'lessons_completed',
            count: 100,
            title: 'Century Complete!',
            message: 'All 100 lessons completed! You are a typing master!',
          });
        }

        // Section completion
        const sectionsCompleted = userStats.sectionsCompleted || [];
        if (sectionsCompleted.length > 0) {
          const lastSection = sectionsCompleted[sectionsCompleted.length - 1];
          showMilestone({
            type: 'section_complete',
            count: lastSection,
            title: `Section ${lastSection} Complete!`,
            message: `Congratulations on completing Section ${lastSection}!`,
          });
        }
      }
    },
    [showAchievement, showMilestone]
  );

  return { checkAchievements };
}
