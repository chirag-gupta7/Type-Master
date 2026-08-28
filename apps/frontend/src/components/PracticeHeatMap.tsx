'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PracticeDay } from '@/types';

interface PracticeHeatMapProps {
  data: PracticeDay[];
}

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

function getColorIntensity(count: number): string {
  if (count === 0) return 'bg-muted border border-border/50';
  if (count === 1) return 'bg-emerald-200 border border-emerald-300 dark:bg-emerald-900/70 dark:border-emerald-800';
  if (count === 2) return 'bg-emerald-300 border border-emerald-400 dark:bg-emerald-700 dark:border-emerald-600';
  if (count === 3) return 'bg-emerald-400 border border-emerald-500 dark:bg-emerald-600';
  if (count >= 4) return 'bg-emerald-500 border border-emerald-600 dark:bg-emerald-500 text-white';
  return 'bg-muted';
}

function getTooltipText(count: number, date: Date): string {
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (count === 0) return `No activity on ${dateStr}`;
  if (count === 1) return `1 practice on ${dateStr}`;
  return `${count} practices on ${dateStr}`;
}

export function PracticeHeatMap({ data }: PracticeHeatMapProps) {
  const days = useMemo(() => getLast365Days(), []);
  const activityMap = useMemo(() => new Map(data.map((d) => [d.date, d.count])), [data]);

  const weeks = useMemo(() => {
    const groupedWeeks: Date[][] = [];
    let currentWeek: Date[] = [];
    days.forEach((day, index) => {
      currentWeek.push(day);
      if (day.getDay() === 6 || index === days.length - 1) {
        groupedWeeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    return groupedWeeks;
  }, [days]);

  const { totalActivities, activeDays, currentStreak, longestStreak } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const active = data.filter((d) => d.count > 0).length;
    const current = calculateCurrentStreak(data);
    const longest = calculateLongestStreak(data);
    return { totalActivities: total, activeDays: active, currentStreak: current, longestStreak: longest };
  }, [data]);

  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Calendar className="h-4 w-4" />
            </span>
            Practice Frequency
          </CardTitle>
          <CardDescription>365-day activity · UTC YYYY-MM-DD</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total Practices</p>
              <p className="text-xl font-bold tracking-tight mt-1">{totalActivities}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Active Days</p>
              <p className="text-xl font-bold tracking-tight mt-1">{activeDays}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Flame className="h-3.5 w-3.5 text-orange-500" /> Current Streak</div>
              <p className="text-xl font-bold tracking-tight mt-1">{currentStreak} <span className="text-sm font-normal text-muted-foreground">days</span></p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Longest Streak</p>
              <p className="text-xl font-bold tracking-tight mt-1">{longestStreak} <span className="text-sm font-normal text-muted-foreground">days</span></p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex gap-1 mb-2">
                <div className="w-8" />
                <div className="flex-1 flex">
                  {monthLabels.map((month, index) => (
                    <div key={index} className="text-xs text-muted-foreground" style={{ width: `${month.width}%` }}>
                      {month.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-1">
                <div className="w-8 flex flex-col justify-between text-xs text-muted-foreground pr-2">
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>
                <div className="flex-1 flex gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                        const day = week.find((d) => d.getDay() === dayOfWeek);
                        if (!day) return <div key={dayOfWeek} className="w-3 h-3" />;
                        const dateStr = day.toISOString().split('T')[0];
                        const count = activityMap.get(dateStr) || 0;
                        return (
                          <motion.div
                            key={dayOfWeek}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.12 + weekIndex * 0.004 + dayOfWeek * 0.001, duration: 0.18 }}
                            whileHover={{ scale: 1.35, zIndex: 10 }}
                            className={`w-3 h-3 rounded-sm ${getColorIntensity(count)} cursor-pointer group relative`}
                            title={getTooltipText(count, day)}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md border bg-popover text-popover-foreground text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
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

          <div className="flex items-center gap-2 mt-5 justify-end text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted border" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-300 dark:bg-emerald-900/70" />
              <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getMonthLabels(weeks: Date[][]): Array<{ name: string; width: number }> {
  const months: Array<{ name: string; width: number }> = [];
  let currentMonth = -1;
  let weekCount = 0;
  weeks.forEach((week) => {
    const firstDay = week[0];
    if (firstDay && firstDay.getMonth() !== currentMonth) {
      if (weekCount > 0) months[months.length - 1].width = (weekCount / weeks.length) * 100;
      currentMonth = firstDay.getMonth();
      months.push({ name: firstDay.toLocaleDateString('en-US', { month: 'short' }), width: 0 });
      weekCount = 1;
    } else weekCount++;
  });
  if (months.length > 0) months[months.length - 1].width = (weekCount / weeks.length) * 100;
  return months;
}

const DAY_MS = 24 * 60 * 60 * 1000;
function toUtcDayMs(dayKey: string): number { return Date.parse(`${dayKey}T00:00:00Z`); }
function getSortedActiveDayKeys(data: PracticeDay[]): string[] { return data.filter((d) => d.count > 0).map((d) => d.date).sort(); }

export function calculateCurrentStreak(data: PracticeDay[], today: Date = new Date()): number {
  const activeKeys = Array.from(new Set(getSortedActiveDayKeys(data)));
  if (activeKeys.length === 0) return 0;
  const todayKey = today.toISOString().split('T')[0];
  const mostRecentKey = activeKeys[activeKeys.length - 1];
  const daysDiff = Math.round((toUtcDayMs(todayKey) - toUtcDayMs(mostRecentKey)) / DAY_MS);
  if (daysDiff > 1) return 0;
  const activeSet = new Set(activeKeys);
  let streak = 0;
  let expectedMs = toUtcDayMs(mostRecentKey);
  while (activeSet.has(new Date(expectedMs).toISOString().split('T')[0])) { streak++; expectedMs -= DAY_MS; }
  return streak;
}
export function calculateLongestStreak(data: PracticeDay[]): number {
  const activeKeys = Array.from(new Set(getSortedActiveDayKeys(data)));
  if (activeKeys.length === 0) return 0;
  let maxStreak = 1;
  let currentRun = 1;
  for (let i = 1; i < activeKeys.length; i++) {
    const dayDiff = (toUtcDayMs(activeKeys[i]) - toUtcDayMs(activeKeys[i - 1])) / DAY_MS;
    if (dayDiff === 1) { currentRun++; maxStreak = Math.max(maxStreak, currentRun); } else currentRun = 1;
  }
  return maxStreak;
}
