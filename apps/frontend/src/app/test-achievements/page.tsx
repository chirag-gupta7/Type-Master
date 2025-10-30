'use client';

import { useState } from 'react';
import { useAchievements } from '@/context/AchievementContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Target, Star, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Achievement Testing Page
 * 
 * This page allows manual testing of the achievement system
 * without needing to complete actual lessons.
 */
export default function TestAchievementsPage() {
  const { showAchievement, showMilestone } = useAchievements();
  const router = useRouter();
  const [achievementCount, setAchievementCount] = useState(0);

  const testAchievements = {
    speed100: {
      id: 'speed-100',
      title: 'Century Club',
      description: 'Reached 100 WPM',
      category: 'speed' as const,
      points: 50,
    },
    speed120: {
      id: 'speed-120',
      title: 'Speed Demon',
      description: 'Reached 120 WPM',
      category: 'speed' as const,
      points: 100,
    },
    speed150: {
      id: 'speed-150',
      title: 'Lightning Fingers',
      description: 'Reached 150 WPM',
      category: 'speed' as const,
      points: 200,
    },
    accuracy98: {
      id: 'accuracy-98',
      title: 'Near Perfect',
      description: 'Achieved 98% accuracy',
      category: 'accuracy' as const,
      points: 50,
    },
    accuracy99: {
      id: 'accuracy-99',
      title: 'Precision Master',
      description: 'Achieved 99% accuracy',
      category: 'accuracy' as const,
      points: 100,
    },
    accuracy100: {
      id: 'accuracy-100',
      title: 'Perfectionist',
      description: 'Achieved 100% accuracy',
      category: 'accuracy' as const,
      points: 250,
    },
    stars3: {
      id: 'stars-3',
      title: 'Triple Star',
      description: 'Earned 3 stars on a lesson',
      category: 'milestone' as const,
      points: 30,
    },
    complete: {
      id: 'lesson-complete',
      title: 'Lesson Completed',
      description: 'Finished a lesson successfully',
      category: 'milestone' as const,
      points: 10,
    },
  };

  const testMilestones = {
    lessons10: {
      type: 'lessons_completed' as const,
      count: 10,
      title: 'First 10 Lessons!',
      message: 'You\'re making great progress!',
    },
    lessons25: {
      type: 'lessons_completed' as const,
      count: 25,
      title: 'Quarter Century!',
      message: '25 lessons completed - you\'re on fire!',
    },
    lessons50: {
      type: 'lessons_completed' as const,
      count: 50,
      title: 'Half Century!',
      message: 'Halfway to mastery - keep going!',
    },
    lessons100: {
      type: 'lessons_completed' as const,
      count: 100,
      title: 'Century Complete!',
      message: 'All 100 lessons completed - you\'re a typing master!',
    },
    section: {
      type: 'section_complete' as const,
      count: 1,
      title: 'Section Mastered!',
      message: 'You\'ve completed an entire section!',
    },
  };

  const handleShowAchievement = (achievement: typeof testAchievements.speed100, withModal: boolean = true) => {
    showAchievement(achievement, withModal);
    setAchievementCount((prev) => prev + 1);
  };

  const handleShowMilestone = (milestone: typeof testMilestones.lessons10) => {
    showMilestone(milestone);
  };

  const handleMultipleAchievements = () => {
    // Simulate completing a lesson with multiple achievements
    setTimeout(() => handleShowAchievement(testAchievements.complete, true), 0);
    setTimeout(() => handleShowAchievement(testAchievements.speed100, false), 300);
    setTimeout(() => handleShowAchievement(testAchievements.accuracy98, false), 600);
    setTimeout(() => handleShowAchievement(testAchievements.stars3, false), 900);
  };

  const handleAchievementThenMilestone = () => {
    // First show achievement as modal
    handleShowAchievement(testAchievements.complete, true);
    // After 2 seconds, show milestone
    setTimeout(() => handleShowMilestone(testMilestones.lessons10), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2" size={16} />
        Back to Home
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Achievement System Testing</h1>
          <p className="text-muted-foreground">
            Test all achievement notifications and milestone celebrations
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Achievements triggered: <span className="font-bold text-primary">{achievementCount}</span>
          </p>
        </div>

        {/* Speed Achievements */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-blue-500" />
            Speed Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleShowAchievement(testAchievements.speed100)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Century Club</span>
              <span className="text-xs text-muted-foreground">100 WPM - 50 XP</span>
            </Button>
            <Button
              onClick={() => handleShowAchievement(testAchievements.speed120)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Speed Demon</span>
              <span className="text-xs text-muted-foreground">120 WPM - 100 XP</span>
            </Button>
            <Button
              onClick={() => handleShowAchievement(testAchievements.speed150)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Lightning Fingers</span>
              <span className="text-xs text-muted-foreground">150 WPM - 200 XP</span>
            </Button>
          </div>
        </div>

        {/* Accuracy Achievements */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="text-green-500" />
            Accuracy Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleShowAchievement(testAchievements.accuracy98)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Near Perfect</span>
              <span className="text-xs text-muted-foreground">98% Accuracy - 50 XP</span>
            </Button>
            <Button
              onClick={() => handleShowAchievement(testAchievements.accuracy99)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Precision Master</span>
              <span className="text-xs text-muted-foreground">99% Accuracy - 100 XP</span>
            </Button>
            <Button
              onClick={() => handleShowAchievement(testAchievements.accuracy100)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Perfectionist</span>
              <span className="text-xs text-muted-foreground">100% Accuracy - 250 XP</span>
            </Button>
          </div>
        </div>

        {/* Other Achievements */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="text-yellow-500" />
            Other Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => handleShowAchievement(testAchievements.stars3)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Triple Star</span>
              <span className="text-xs text-muted-foreground">3 Stars - 30 XP</span>
            </Button>
            <Button
              onClick={() => handleShowAchievement(testAchievements.complete)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Lesson Completed</span>
              <span className="text-xs text-muted-foreground">Finish Lesson - 10 XP</span>
            </Button>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-purple-500" />
            Milestone Celebrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => handleShowMilestone(testMilestones.lessons10)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">10 Lessons</span>
              <span className="text-xs text-muted-foreground">First 10 completed</span>
            </Button>
            <Button
              onClick={() => handleShowMilestone(testMilestones.lessons25)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">25 Lessons</span>
              <span className="text-xs text-muted-foreground">Quarter century</span>
            </Button>
            <Button
              onClick={() => handleShowMilestone(testMilestones.lessons50)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">50 Lessons</span>
              <span className="text-xs text-muted-foreground">Half century</span>
            </Button>
            <Button
              onClick={() => handleShowMilestone(testMilestones.lessons100)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">100 Lessons</span>
              <span className="text-xs text-muted-foreground">Century complete!</span>
            </Button>
            <Button
              onClick={() => handleShowMilestone(testMilestones.section)}
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
            >
              <span className="font-bold">Section Complete</span>
              <span className="text-xs text-muted-foreground">Mastered a section</span>
            </Button>
          </div>
        </div>

        {/* Complex Scenarios */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Complex Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleMultipleAchievements}
              className="h-auto py-6 flex flex-col items-start"
            >
              <span className="font-bold mb-1">Multiple Achievements</span>
              <span className="text-xs opacity-80">
                1st as modal, rest as toasts (staggered)
              </span>
            </Button>
            <Button
              onClick={handleAchievementThenMilestone}
              className="h-auto py-6 flex flex-col items-start"
            >
              <span className="font-bold mb-1">Achievement + Milestone</span>
              <span className="text-xs opacity-80">
                Achievement modal → then milestone celebration
              </span>
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Testing Instructions:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Click any achievement button to trigger a notification</li>
            <li>• First achievement in a sequence shows as modal with confetti</li>
            <li>• Additional achievements show as toasts (top-right corner)</li>
            <li>• Milestones show as full-page celebrations</li>
            <li>• Toasts auto-dismiss after 5 seconds</li>
            <li>• Test in both light and dark mode</li>
            <li>• Check responsive behavior on different screen sizes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
