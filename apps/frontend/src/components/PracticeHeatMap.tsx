'use client';

import { motion } from 'framer-motion';
import { Calendar, Flame } from 'lucide-react';
import type { PracticeDay } from '@/types';

interface PracticeHeatMapProps {
  data: PracticeDay[];
}

// Get last 365 days
function getLast365Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
}

// Get color intensity based on count
function getColorIntensity(count: number): string {
  if (count === 0) return 'bg-gray-800';
  if (count === 1) return 'bg-green-900';
  if (count === 2) return 'bg-green-700';
  if (count === 3) return 'bg-green-600';
  if (count >= 4) return 'bg-green-500';
  return 'bg-gray-800';
}

// Get tooltip text
function getTooltipText(count: number, date: Date): string {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  if (count === 0) return `No activity on ${dateStr}`;
  if (count === 1) return `1 activity on ${dateStr}`;
  return `${count} activities on ${dateStr}`;
}

export function PracticeHeatMap({ data }: PracticeHeatMapProps) {
  const days = getLast365Days();

  // Create a map for quick lookup
  const activityMap = new Map(data.map((d) => [d.date, d.count]));

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day, index) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || index === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Calculate statistics
  const totalActivities = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;
  const currentStreak = calculateCurrentStreak(data);
  const longestStreak = calculateLongestStreak(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">Practice Frequency</h3>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <p className="text-gray-400 text-sm mb-1">Total Activities</p>
          <p className="text-2xl font-bold text-white">{totalActivities}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <p className="text-gray-400 text-sm mb-1">Active Days</p>
          <p className="text-2xl font-bold text-white">{activeDays}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <p className="text-gray-400 text-sm">Current Streak</p>
          </div>
          <p className="text-2xl font-bold text-white">{currentStreak} days</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <p className="text-gray-400 text-sm mb-1">Longest Streak</p>
          <p className="text-2xl font-bold text-white">{longestStreak} days</p>
        </motion.div>
      </div>

      {/* Heat Map */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 mb-2">
            {/* Month labels */}
            <div className="w-8" /> {/* Spacer for day labels */}
            <div className="flex-1 flex">
              {getMonthLabels(weeks).map((month, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-400"
                  style={{ width: `${month.width}%` }}
                >
                  {month.name}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="w-8 flex flex-col justify-between text-xs text-gray-400 pr-2">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Heat map grid */}
            <div className="flex-1 flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                    const day = week.find((d) => d.getDay() === dayOfWeek);
                    if (!day) {
                      return <div key={dayOfWeek} className="w-3 h-3" />;
                    }

                    const dateStr = day.toISOString().split('T')[0];
                    const count = activityMap.get(dateStr) || 0;

                    return (
                      <motion.div
                        key={dayOfWeek}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.9 + weekIndex * 0.01 + dayOfWeek * 0.002,
                          duration: 0.2,
                        }}
                        whileHover={{ scale: 1.5, zIndex: 10 }}
                        className={`w-3 h-3 rounded-sm ${getColorIntensity(count)} cursor-pointer group relative`}
                        title={getTooltipText(count, day)}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          {getTooltipText(count, day)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-6 justify-end">
        <span className="text-xs text-gray-400">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-600" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
        </div>
        <span className="text-xs text-gray-400">More</span>
      </div>
    </motion.div>
  );
}

// Helper function to get month labels
function getMonthLabels(weeks: Date[][]): Array<{ name: string; width: number }> {
  const months: Array<{ name: string; width: number }> = [];
  let currentMonth = -1;
  let weekCount = 0;

  weeks.forEach((week) => {
    const firstDay = week[0];
    if (firstDay && firstDay.getMonth() !== currentMonth) {
      if (weekCount > 0) {
        months[months.length - 1].width = (weekCount / weeks.length) * 100;
      }
      currentMonth = firstDay.getMonth();
      months.push({
        name: firstDay.toLocaleDateString('en-US', { month: 'short' }),
        width: 0,
      });
      weekCount = 1;
    } else {
      weekCount++;
    }
  });

  if (months.length > 0) {
    months[months.length - 1].width = (weekCount / weeks.length) * 100;
  }

  return months;
}

// Calculate current streak
function calculateCurrentStreak(data: PracticeDay[]): number {
  const sortedDates = data
    .filter((d) => d.count > 0)
    .map((d) => new Date(d.date))
    .sort((a, b) => b.getTime() - a.getTime());

  if (sortedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = new Date(sortedDates[0]);
  mostRecent.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

  // If most recent activity is not today or yesterday, streak is broken
  if (daysDiff > 1) return 0;

  let streak = 0;
  const expectedDate = new Date(mostRecent);

  for (const date of sortedDates) {
    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Calculate longest streak
function calculateLongestStreak(data: PracticeDay[]): number {
  const sortedDates = data
    .filter((d) => d.count > 0)
    .map((d) => new Date(d.date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (sortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
