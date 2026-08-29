'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Trophy, Star, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LevelCompletion } from '@/types';

interface CircularProgressChartProps {
  data: LevelCompletion[];
}

const COLORS: Record<string, string> = {
  Beginner: 'hsl(var(--chart-4))',
  Intermediate: 'hsl(var(--chart-1))',
  Advanced: 'hsl(var(--chart-5))',
  Expert: 'hsl(var(--destructive))',
};

const TIER_NAMES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

// ponytail: 100 → 4 tiers — bucket any level 1-100 into 4 slices to avoid 100-slice pie
const getTier = (levelStr: string) => Math.min(4, Math.ceil((parseInt(levelStr, 10) || 1) / 25));
const getTierName = (tier: number) => TIER_NAMES[tier - 1] ?? `Tier ${tier}`;
const getLevelColor = (level: LevelCompletion) => COLORS[getTierName(getTier(level.level))] ?? 'hsl(var(--muted-foreground))';

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = (props: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  [key: string]: number;
}) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-bold"
      style={{ filter: 'drop-shadow(0 1px 2px hsl(var(--foreground) / 0.3))' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; percentage: number; completed: number; total: number; stars: number; maxStars: number } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border bg-popover text-popover-foreground shadow-lg p-3 min-w-[160px]">
        <p className="font-semibold text-sm mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <p className="text-muted-foreground">
            Completion: <span className="text-foreground font-medium">{data.percentage}%</span>
          </p>
          <p className="text-muted-foreground">
            Lessons: <span className="text-foreground font-medium">{data.completed}/{data.total}</span>
          </p>
          <p className="text-muted-foreground">
            Stars: <span className="text-amber-500 font-medium">{data.stars}/{data.maxStars}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

function LevelRow({ level, index }: { level: LevelCompletion; index: number }) {
  const color = getLevelColor(level);
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.04 }}
      className="rounded-xl border bg-muted/30 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {level.name}
          <span className="text-xs text-muted-foreground font-normal">Lv.{level.level}</span>
        </span>
        <span className="text-xs text-muted-foreground">{level.completed}/{level.total}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${level.percentage}%` }}
          transition={{ delay: 0.4 + index * 0.04, duration: 0.6 }}
          className="absolute h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </motion.div>
  );
}

export function CircularProgressChart({ data }: CircularProgressChartProps) {
  const [open, setOpen] = useState(false);

  const { chartData, totalCompleted, totalLessons, totalStars, maxStars, overallPercentage, latestLevel } = useMemo(() => {
    let completed = 0;
    let total = 0;
    let stars = 0;
    let max = 0;
    // ponytail: 100 → 4 tiers — aggregate per-level into 4 buckets for pie (keeps dialog full detail)
    const tierMap = new Map<number, { name: string; value: number; total: number; stars: number; maxStars: number }>();
    for (const level of data) {
      completed += level.completed;
      total += level.total;
      stars += level.stars;
      max += level.maxStars;
      const tier = getTier(level.level);
      const name = getTierName(tier);
      const cur = tierMap.get(tier) ?? { name, value: 0, total: 0, stars: 0, maxStars: 0 };
      cur.value += level.completed;
      cur.total += level.total;
      cur.stars += level.stars;
      cur.maxStars += level.maxStars;
      tierMap.set(tier, cur);
    }
    const formatted = Array.from(tierMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, s]) => ({
        name: s.name,
        value: s.value,
        total: s.total,
        percentage: s.total > 0 ? Math.round((s.value / s.total) * 100) : 0,
        stars: s.stars,
        maxStars: s.maxStars,
      }))
      .filter((d) => d.total > 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const latest = data.find((l) => l.completed < l.total) ?? data[data.length - 1] ?? null;
    return { chartData: formatted, totalCompleted: completed, totalLessons: total, totalStars: stars, maxStars: max, overallPercentage: percentage, latestLevel: latest };
  }, [data]);

  if (data.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <Trophy className="h-4 w-4" />
            </span>
            Completion by Level
            <span className="ml-auto text-xs font-normal text-muted-foreground">{totalCompleted}/{totalLessons} lessons</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[280px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel as never}
                    outerRadius={98}
                    innerRadius={52}
                    dataKey="value"
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                    animationBegin={0}
                    animationDuration={700}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] ?? 'hsl(var(--muted-foreground))'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-primary text-primary-foreground p-4">
                  <p className="text-xs opacity-80">Overall Progress</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{overallPercentage}%</p>
                  <p className="text-xs opacity-70 mt-1">{totalCompleted} / {totalLessons} lessons</p>
                </div>
                <div className="rounded-xl border bg-amber-500 text-white p-4">
                  <div className="flex items-center gap-1.5 text-xs opacity-90">
                    <Star className="h-3.5 w-3.5 fill-white" /> Stars
                  </div>
                  <p className="mt-1 text-2xl font-bold">{totalStars}</p>
                  <p className="text-xs opacity-80 mt-1">{maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0}% of {maxStars}</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {latestLevel ? (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current level</p>
                    <LevelRow level={latestLevel} index={0} />
                    <Dialog.Root open={open} onOpenChange={setOpen}>
                      <Dialog.Trigger asChild>
                        <Button variant="outline" size="sm" className="w-full rounded-full">
                          View all ({data.length}) →
                        </Button>
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                          <div className="flex items-center justify-between">
                            <Dialog.Title className="text-base font-semibold">All levels</Dialog.Title>
                            <Dialog.Close asChild>
                              <button aria-label="Close" className="rounded-full p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <X className="h-4 w-4" />
                              </button>
                            </Dialog.Close>
                          </div>
                          <Dialog.Description className="text-xs text-muted-foreground mt-1">
                            {totalCompleted}/{totalLessons} lessons · {overallPercentage}% complete
                          </Dialog.Description>
                          <div className="mt-4 space-y-2.5 overflow-y-auto pr-1 h-[60vh]">
                            {data.map((level, i) => (
                              <LevelRow key={level.level} level={level} index={i} />
                            ))}
                          </div>
                          <Dialog.Close asChild>
                            <Button variant="outline" size="sm" className="mt-4 w-full rounded-full">Close</Button>
                          </Dialog.Close>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No level data</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
