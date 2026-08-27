'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { testAPI } from '@/lib/api';
import TypingTest from '@/components/TypingTest';
import { Button } from '@/components/ui/button';
import { Zap, Trophy, Target, Clock, TrendingUp, Sparkles } from 'lucide-react';

interface UserStats { averageWpm: number; bestWpm: number; totalTests: number; averageAccuracy: number; }
interface TestHistory { id: string; wpm: number; accuracy: number; duration: number; createdAt: string; }

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) { setIsAuthenticated(false); setLoading(false); return; }
    setIsAuthenticated(true);
    (async () => {
      try {
        setLoading(true); setError(null);
        const [statsRes, historyData] = await Promise.all([testAPI.getUserStats(), testAPI.getTestHistory(1, 10)]);
        setStats(statsRes.stats); setHistory(historyData.tests);
      } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load dashboard data'); }
      finally { setLoading(false); }
    })();
  }, []);

  const chartData = history.slice().reverse().map((t, i) => ({ test: `Test ${i + 1}`, WPM: t.wpm, Accuracy: t.accuracy }));

  return (
    <div className="pb-10 pt-6 md:pt-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Typing Test</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Fast, focused, and beautifully instrumented — every keystroke measured, every improvement visible.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5"><Sparkles className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> AI feedback</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5"><TrendingUp className="h-3.5 w-3.5" /> Live WPM</span>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border bg-card/70 p-4 md:p-6 backdrop-blur-xl shadow-sm">
          <TypingTest />
        </div>

        {!isAuthenticated ? (
          <div className="mt-6 rounded-[24px] border bg-card/60 p-6 text-center backdrop-blur">
            <h2 className="text-xl font-semibold tracking-tight">Track your progress over time</h2>
            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">Sign in to save every test, see trends, and get personalized insights.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/register"><Button variant="primary" className="rounded-full">Create account</Button></Link>
              <Link href="/login"><Button variant="outline" className="rounded-full">Sign in</Button></Link>
            </div>
          </div>
        ) : loading ? (
          <div className="mt-6 rounded-[24px] border bg-card p-8 text-center text-sm text-muted-foreground">Loading your stats…</div>
        ) : error ? (
          <div className="mt-6 rounded-[24px] border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="font-medium text-destructive">Couldn&apos;t load stats</p><p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2 text-xs tracking-widest text-muted-foreground"><Clock className="h-3.5 w-3.5" /> AVG WPM</div>
                <div className="mt-2 text-2xl font-bold">{stats?.averageWpm.toFixed(1) ?? '0'}</div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2 text-xs tracking-widest text-muted-foreground"><Trophy className="h-3.5 w-3.5 text-amber-500" /> BEST WPM</div>
                <div className="mt-2 text-2xl font-bold">{stats?.bestWpm.toFixed(1) ?? '0'}</div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2 text-xs tracking-widest text-muted-foreground"><Zap className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> TESTS</div>
                <div className="mt-2 text-2xl font-bold">{stats?.totalTests ?? 0}</div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-2 text-xs tracking-widest text-muted-foreground"><Target className="h-3.5 w-3.5 text-emerald-500" /> ACCURACY</div>
                <div className="mt-2 text-2xl font-bold">{stats?.averageAccuracy.toFixed(1) ?? '0'}%</div>
              </div>
            </div>

            <div className="mt-6 rounded-[20px] border bg-card p-4 md:p-6">
              <h2 className="text-sm font-semibold tracking-tight">Progress over time</h2>
              {chartData.length > 0 ? (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="test" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="WPM" stroke="hsl(var(--primary))" strokeWidth={2.2} dot={{ r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="Accuracy" stroke="hsl(var(--chart-2))" strokeWidth={2.2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-6 text-center text-sm text-muted-foreground">No history yet — take your first test above.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
