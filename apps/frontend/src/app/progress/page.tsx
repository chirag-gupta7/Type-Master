'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, Star, Zap, Target } from 'lucide-react';
import { LearningProgressDashboard } from '@/components/LearningProgressDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { lessonAPI, authAPI } from '@/lib/api';

type LearningStats = {
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  totalStars: number;
  maxStars: number;
  averageWpm: number;
  averageAccuracy: number;
};

export default function ProgressPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const ok = authAPI.isAuthenticated();
    setIsAuthenticated(ok);
    setAuthLoading(false);
    if (!ok) router.push('/');
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    (async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const res = await lessonAPI.getLearningStats();
        if (!alive) return;
        setStats(res.stats);
      } catch (e) {
        if (!alive) return;
        setStatsError(e instanceof Error ? e.message : 'Failed to load stats');
      } finally {
        if (alive) setStatsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" aria-label="Loading" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="pb-10 pt-6 md:pt-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Progress</h1>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-[60ch]">All your learning signals — completion, stars, best-per-lesson peaks, and daily history — in one light, glanceable view.</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-violet-600" /> UTC YYYY-MM-DD
            </span>
          </div>
        </motion.div>

        {/* Stats strip — from getLearningStats */}
        <div className="mb-6">
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-3 w-20 mb-3" />
                  <Skeleton className="h-7 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </Card>
              ))}
            </div>
          ) : statsError ? (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-4 text-sm text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <span className="text-xs">Couldn’t load summary: {statsError}</span>
                <button onClick={() => window.location.reload()} className="ml-auto text-xs underline">Retry</button>
              </CardContent>
            </Card>
          ) : stats ? (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" /> TOTAL LESSONS
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight">{stats.totalLessons}</div>
                <div className="text-xs text-muted-foreground">{stats.completedLessons} completed</div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" /> COMPLETION
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight">{stats.completionPercentage}</span>
                  <span className="text-sm font-medium text-muted-foreground">%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${stats.completionPercentage}%` }} />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> STARS
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight">{stats.totalStars}</div>
                <div className="text-xs text-muted-foreground">of {stats.maxStars} max · {stats.maxStars ? Math.round((stats.totalStars / stats.maxStars) * 100) : 0}%</div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-xs tracking-wide text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-blue-600" /> AVG WPM
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight">{stats.averageWpm}</div>
                <div className="text-xs text-muted-foreground">{stats.averageAccuracy}% avg accuracy</div>
              </Card>
            </motion.div>
          ) : null}
        </div>

        <LearningProgressDashboard />
      </div>
    </div>
  );
}
