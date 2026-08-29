'use client';

import { useMemo } from 'react';
import { Calendar, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PracticeDay } from '@/types';

interface PracticeHeatMapProps {
  data: PracticeDay[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
function getLast365Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  const todayUtcMidnightMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 364; i >= 0; i--) {
    days.push(new Date(todayUtcMidnightMs - i * DAY_MS));
  }
  return days;
}

// ponytail: LeetCode 5-bucket palette — 0→#ebedf0, 1→#9be9a8, 2→#40c463, 3-5→#30a14e, 6-9→#216e39, 10+→darker; loop WYSIWYG below
function getColorIntensity(count: number): string {
  if (count === 0) return 'bg-[#ebedf0] border border-[#d0d7de] dark:bg-[#161b22] dark:border-[#30363d]';
  if (count === 1) return 'bg-[#9be9a8] border border-[#7bc47f] dark:bg-[#0e4429]/90 dark:border-[#006d32]';
  if (count === 2) return 'bg-[#40c463] border border-[#30a14e] dark:bg-[#006d32] dark:border-[#26a641]';
  if (count >= 3 && count <= 5) return 'bg-[#30a14e] border border-[#216e39] dark:bg-[#26a641] dark:border-[#39d353]';
  if (count >= 6 && count <= 9) return 'bg-[#216e39] border border-[#1a4d2e] dark:bg-[#216e39] dark:border-[#1a5a2e] text-white';
  return 'bg-[#0e4429] border border-[#0a2e1c] dark:bg-[#0e4429] dark:border-[#033a16] text-white';
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

  // Exactly 53 cols starting Sunday (UTC), dense 11px / gap 3px / min-w 720
  const weeks = useMemo(() => {
    if (days.length === 0) return [] as Date[][];
    const first = days[0];
    const firstUTCDay = first.getUTCDay(); // 0=Sun ; UTC fixed
    const startSundayMs = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate()) - firstUTCDay * DAY_MS;
    const weeksArr: Date[][] = [];
    for (let w = 0; w < 53; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(startSundayMs + (w * 7 + d) * DAY_MS));
      }
      weeksArr.push(week);
    }
    return weeksArr;
  }, [days]);

  const { totalActivities, activeDays, currentStreak, longestStreak } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const active = data.filter((d) => d.count > 0).length;
    const current = calculateCurrentStreak(data);
    const longest = calculateLongestStreak(data);
    return { totalActivities: total, activeDays: active, currentStreak: current, longestStreak: longest };
  }, [data]);

  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const todayUtcStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  // for future shading: compare ms

  return (
    <div>
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

          <div className="overflow-x-auto scrollbar-thin relative" aria-label="365-day practice heatmap, scrollable horizontally">
            <div className="inline-block min-w-[720px] w-full">
              <div className="flex gap-[3px] mb-2">
                <div className="w-8 shrink-0" />
                <div className="flex-1 flex">
                  {monthLabels.map((month, index) => (
                    <div key={index} className="text-xs text-muted-foreground truncate" style={{ width: `${month.width}%` }}>
                      {month.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-[3px]">
                <div className="w-8 shrink-0 flex flex-col justify-between text-xs text-muted-foreground pr-2" aria-hidden>
                  <span>Mon</span>
                  <span>Wed</span>
                  <span>Fri</span>
                </div>
                <div className="flex-1 flex gap-[3px]" role="grid" aria-label="Practice heatmap grid: 53 weeks starting Sunday, 7 days per week">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[3px]" role="row" aria-label={`Week ${weekIndex + 1}`}>
                      {week.map((day) => {
                        const dateStr = day.toISOString().split('T')[0];
                        const isFuture = dateStr > todayUtcStr;
                        const count = isFuture ? 0 : (activityMap.get(dateStr) || 0);
                        const isOutOfRange = day.getTime() < days[0].getTime() || isFuture;
                        // Out-of-range leading/trailing padding still renders muted #ebedf0 for WYSIWYG grid shape, but dim future
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            aria-label={getTooltipText(count, day)}
                            title={getTooltipText(count, day)}
                            role="gridcell"
                            aria-selected="false"
                            className="group relative flex h-[11px] w-[11px] items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          >
                            <span className={`h-[11px] w-[11px] rounded-sm block ${getColorIntensity(isOutOfRange && isFuture ? 0 : count)} ${isOutOfRange ? 'opacity-60' : ''}`} aria-hidden />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md border bg-popover text-popover-foreground text-xs shadow-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              {getTooltipText(count, day)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent opacity-60 sm:hidden" aria-hidden />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground sm:hidden">← Scroll to see full year →</p>

          <div className="flex items-center gap-2 mt-5 justify-end text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[3px]" aria-hidden>
              {/* WYSIWYG legend loop — same buckets as getColorIntensity */}
              {[0, 1, 2, 4, 7, 12].map((c) => (
                <div key={c} className={`h-[11px] w-[11px] rounded-sm ${getColorIntensity(c)}`} title={c === 0 ? '0 practices' : c >= 10 ? '10+ practices' : c >= 6 ? '6-9 practices' : c >= 3 ? '3-5 practices' : `${c} practice${c>1?'s':''}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getMonthLabels(weeks: Date[][]): Array<{ name: string; width: number }> {
  const months: Array<{ name: string; width: number }> = [];
  let currentMonth = -1;
  let weekCount = 0;
  weeks.forEach((week) => {
    const firstDay = week[0];
    if (!firstDay) return;
    if (firstDay.getUTCMonth() !== currentMonth) {
      if (weekCount > 0 && months.length > 0) months[months.length - 1].width = (weekCount / weeks.length) * 100;
      currentMonth = firstDay.getUTCMonth();
      months.push({ name: firstDay.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), width: 0 });
      weekCount = 1;
    } else weekCount++;
  });
  if (months.length > 0) months[months.length - 1].width = (weekCount / weeks.length) * 100;
  return months;
}

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
