'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { WpmHistoryPoint } from '@/types';

interface WpmHistoryChartProps {
  data: WpmHistoryPoint[];
}

const HistoryTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; dataKey: string; value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-popover text-popover-foreground shadow-lg p-3">
        <p className="text-xs font-medium mb-1.5">{label}</p>
        <div className="space-y-1 text-xs">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              <span className="text-muted-foreground capitalize">{p.dataKey}:</span>
              <span className="font-semibold">{p.value}{p.dataKey === 'accuracy' ? '%' : ' WPM'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function WpmHistoryChart({ data }: WpmHistoryChartProps) {
  const chartData = useMemo(() => {
    return data.map((p) => ({
      rawDate: p.date,
      date: new Date(p.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wpm: p.wpm,
      accuracy: p.accuracy,
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const wpms = data.map((d) => d.wpm);
    const accs = data.map((d) => d.accuracy);
    const latest = data[data.length - 1];
    const first = data[0];
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
    const avgAcc = Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10;
    const trend = latest.wpm - first.wpm;
    return { avgWpm, avgAcc, latestWpm: latest.wpm, latestAcc: latest.accuracy, trend, count: data.length };
  }, [data]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.04 }}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                WPM History
              </CardTitle>
              <CardDescription className="mt-1">Daily average from TestResult (last 90 days) · UTC YYYY-MM-DD</CardDescription>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className={`inline-flex rounded-full px-2.5 py-1 font-medium border ${stats.trend > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' : stats.trend < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-muted text-muted-foreground'}`}>
                  {stats.trend > 0 ? `+${stats.trend}` : stats.trend} WPM trend
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 4, right: 12, top: 6, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradWpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" minTickGap={24} />
                    <YAxis yAxisId="wpm" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" label={{ value: 'WPM', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }} />
                    <YAxis yAxisId="acc" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" hide />
                    <Tooltip content={<HistoryTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} iconType="circle" />
                    <Area yAxisId="wpm" type="monotone" dataKey="wpm" name="WPM" stroke="hsl(var(--primary))" strokeWidth={2.2} fill="url(#gradWpm)" dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                    <Area yAxisId="acc" type="monotone" dataKey="accuracy" name="Accuracy" stroke="#10b981" strokeWidth={1.8} fill="transparent" dot={false} activeDot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {stats && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Avg WPM</p>
                    <p className="text-lg font-bold tracking-tight mt-1">{stats.avgWpm}</p>
                    <p className="text-xs text-muted-foreground">{stats.count} days</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Latest</p>
                    <p className="text-lg font-bold tracking-tight mt-1">{stats.latestWpm} <span className="text-xs font-normal text-muted-foreground">WPM</span></p>
                    <p className="text-xs text-muted-foreground">{stats.latestAcc}% acc</p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Avg Accuracy</p>
                    <p className="text-lg font-bold tracking-tight mt-1">{stats.avgAcc}%</p>
                    <p className="text-xs text-muted-foreground">90-day avg</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-[300px] grid place-items-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
              <div>
                <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium">No history yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[32ch]">Take typing tests — daily WPM & accuracy will appear here (grouped by UTC date).</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
