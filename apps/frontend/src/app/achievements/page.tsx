/**
 * Achievements Page
 *
 * Displays all achievements with unlock status, statistics, and recent unlocks
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Lock, Sparkles, TrendingUp, Target } from 'lucide-react';
import { achievementAPI } from '@/lib/api';
import { authAPI } from '@/lib/api';
import AchievementCard, {
  AchievementGrid,
  AchievementCardSkeleton,
  AchievementIcon,
} from '@/components/AchievementCard';
import AchievementUnlockAnimation from '@/components/AchievementUnlockAnimation';
import { Button } from '@/components/ui/button';
import { Achievement, AchievementStats, UnlockedAchievement } from '@/types';
import { useAchievementProgress } from '@/lib/useAchievements';

const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [recentUnlocks, setRecentUnlocks] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [currentUnlock, setCurrentUnlock] = useState<UnlockedAchievement | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Get progress tracking for locked achievements
  const { progress: achievementProgress } = useAchievementProgress();

  // Check authentication status
  useEffect(() => {
    setIsAuthenticated(authAPI.isAuthenticated());
  }, []);

  // Fetch achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const data = await achievementAPI.getAllAchievements();
        setAchievements(data.achievements);

        // Fetch stats if authenticated
        if (isAuthenticated) {
          const statsData = await achievementAPI.getAchievementStats();
          setStats(statsData.stats);
          setRecentUnlocks(statsData.recentUnlocks);
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [isAuthenticated]);

  // Check for new achievements
  const handleCheckAchievements = async () => {
    if (!isAuthenticated) return;

    try {
      setChecking(true);
      const result = await achievementAPI.checkAchievements();

      if (result.newlyUnlocked.length > 0) {
        // Show animation for each newly unlocked achievement
        for (const achievement of result.newlyUnlocked) {
          setCurrentUnlock(achievement);
          setShowUnlockAnimation(true);

          // Wait for animation to finish before showing next
          await new Promise((resolve) => setTimeout(resolve, 5000));
          setShowUnlockAnimation(false);
        }

        // Refresh achievements list
        const data = await achievementAPI.getAllAchievements();
        setAchievements(data.achievements);

        // Refresh stats
        const statsData = await achievementAPI.getAchievementStats();
        setStats(statsData.stats);
        setRecentUnlocks(statsData.recentUnlocks);
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    } finally {
      setChecking(false);
    }
  };

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });

  // Calculate progress for locked achievements
  const getProgress = (achievement: Achievement): number => {
    if (achievement.unlocked || !achievementProgress) return 0;

    // Parse requirement to get achievement type
    try {
      const requirement = JSON.parse(achievement.requirement);
      const achievementType = requirement.type;

      // Return progress percentage for this achievement type
      return achievementProgress[achievementType] || 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Achievements</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock achievements by completing typing tests, lessons, and reaching new milestones.
            Track your progress and celebrate your accomplishments!
          </p>
        </motion.div>

        {/* Stats Cards */}
        {isAuthenticated && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Total</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalAchievements}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Achievements</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-white" />
                <h3 className="font-semibold text-white">Unlocked</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.unlockedCount}</p>
              <p className="text-sm text-green-100">
                {stats.completionPercentage.toFixed(1)}% Complete
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-6 h-6 text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Locked</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stats.lockedCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Still to unlock</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-white" />
                <h3 className="font-semibold text-white">Points</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.earnedPoints}</p>
              <p className="text-sm text-yellow-100">
                of {stats.totalPoints} ({stats.pointsPercentage.toFixed(1)}%)
              </p>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="gap-2"
            >
              <Trophy className="w-4 h-4" />
              All ({achievements.length})
            </Button>
            <Button
              variant={filter === 'unlocked' ? 'default' : 'outline'}
              onClick={() => setFilter('unlocked')}
              className="gap-2"
            >
              <Award className="w-4 h-4" />
              Unlocked ({achievements.filter((a) => a.unlocked).length})
            </Button>
            <Button
              variant={filter === 'locked' ? 'default' : 'outline'}
              onClick={() => setFilter('locked')}
              className="gap-2"
            >
              <Lock className="w-4 h-4" />
              Locked ({achievements.filter((a) => !a.unlocked).length})
            </Button>
          </div>

          {/* Check achievements button */}
          {isAuthenticated && (
            <Button
              onClick={handleCheckAchievements}
              disabled={checking}
              className="gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
            >
              <Target className="w-4 h-4" />
              {checking ? 'Checking...' : 'Check for New Achievements'}
            </Button>
          )}
        </motion.div>

        {/* Recent Unlocks */}
        {isAuthenticated && recentUnlocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Recently Unlocked
              </h2>
            </div>
            <AchievementGrid>
              {recentUnlocks.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  id={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon as AchievementIcon}
                  points={achievement.points}
                  unlocked={true}
                  unlockedAt={achievement.unlockedAt}
                />
              ))}
            </AchievementGrid>
          </motion.div>
        )}

        {/* All Achievements */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {filter === 'all'
              ? 'All Achievements'
              : filter === 'unlocked'
                ? 'Unlocked Achievements'
                : 'Locked Achievements'}
          </h2>

          {loading ? (
            <AchievementGrid>
              {[...Array(6)].map((_, i) => (
                <AchievementCardSkeleton key={i} />
              ))}
            </AchievementGrid>
          ) : filteredAchievements.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No achievements found in this category.
              </p>
            </div>
          ) : (
            <AchievementGrid>
              {filteredAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  id={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon as AchievementIcon}
                  points={achievement.points}
                  unlocked={achievement.unlocked}
                  unlockedAt={achievement.unlockedAt || undefined}
                  progress={getProgress(achievement)}
                  requirement={!achievement.unlocked ? achievement.requirement : undefined}
                />
              ))}
            </AchievementGrid>
          )}
        </motion.div>

        {/* Authentication notice */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center"
          >
            <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Sign in to Track Your Achievements
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create an account or sign in to unlock achievements, earn points, and track your
              typing progress!
            </p>
            <Button className="gap-2">Get Started</Button>
          </motion.div>
        )}
      </div>

      {/* Unlock Animation */}
      {currentUnlock && (
        <AchievementUnlockAnimation
          isOpen={showUnlockAnimation}
          achievement={{
            title: currentUnlock.title,
            description: currentUnlock.description,
            icon: currentUnlock.icon as AchievementIcon,
            points: currentUnlock.points,
          }}
        />
      )}
    </div>
  );
};

export default AchievementsPage;
