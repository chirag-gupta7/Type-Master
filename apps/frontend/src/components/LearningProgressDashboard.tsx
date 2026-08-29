'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BookOpen, Calendar, Award, TrendingUp, Sparkles } from 'lucide-react';
import { CircularProgressChart } from './CircularProgressChart';
import { WPMProgressChart } from './WPMProgressChart';
import { WpmHistoryChart } from './WpmHistoryChart';
import { PracticeHeatMap } from './PracticeHeatMap';
import { SkillTreeVisualization } from './SkillTreeVisualization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { lessonAPI } from '@/lib/api';
import type { ProgressVisualizationData } from '@/types';
import Link from 'next/link';

function SectionSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* real charts are h-[300px]; keep skeleton matched to avoid layout shift */}
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function TipsSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChartCard({ icon: Icon, title, description, ctaHref, ctaLabel }: { icon: typeof BookOpen; title: string; description: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <Card className="border-dashed bg-muted/20">
      <CardContent className="py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-[36ch] text-xs text-muted-foreground">{description}</p>
        {ctaHref && ctaLabel && (
          <Link href={ctaHref} className="inline-block mt-4">
            <Button size="sm" variant="outline" className="rounded-full">{ctaLabel}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyInline({ icon: Icon, title, description, ctaHref, ctaLabel }: { icon: typeof BookOpen; title: string; description: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-[36ch] text-xs text-muted-foreground">{description}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="inline-block mt-4">
          <Button size="sm" variant="outline" className="rounded-full">{ctaLabel}</Button>
        </Link>
      )}
    </div>
  );
}

export function LearningProgressDashboard() {
  const [data, setData] = useState<ProgressVisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const response = await lessonAPI.getProgressVisualization(signal ? { signal } : undefined);
      if (signal?.aborted) return;
      // additive-safe: immutable copy, no mutation of cached response
      const normalized: ProgressVisualizationData = {
        ...response,
        wpmHistory: response.wpmHistory ?? [],
      };
      setData(normalized);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => { ctrl.abort(); };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-5"><SectionSkeleton /></div>
        <div className="col-span-12 lg:col-span-7"><SectionSkeleton /></div>
        <div className="col-span-12"><SectionSkeleton /></div>
        <div className="col-span-12"><SectionSkeleton /></div>
        <div className="col-span-12"><SectionSkeleton /></div>
        <div className="col-span-12"><TipsSkeleton /></div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold">Couldn&apos;t load progress</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-[48ch] mx-auto">{error}</p>
            <Button onClick={() => fetchData()} size="sm" variant="outline" className="mt-4 rounded-full">Retry</Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!data) return null;

  const hasCompletion = data.completionByLevel.length > 0;
  const hasBestWpm = data.wpmByLesson.length > 0;
  const hasPractice = data.practiceFrequency.length > 0;
  const hasHistory = (data.wpmHistory?.length ?? 0) > 0;

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Row 1: Completion by Level — ONE card only, bucket 100→4 tiers, detail in Dialog */}
      <div className="col-span-12">
        {hasCompletion ? (
          <CircularProgressChart data={data.completionByLevel} />
        ) : (
          <EmptyChartCard icon={Award} title="No level progress yet" description="Complete lessons to see your completion breakdown by level." ctaHref="/learn" ctaLabel="Browse lessons" />
        )}
      </div>

      {/* Row 2: WPM History (trend) — full width */}
      <div className="col-span-12">
        {hasHistory ? (
          <WpmHistoryChart data={data.wpmHistory ?? []} />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600"><TrendingUp className="h-4 w-4" /></span>
                WPM History
              </CardTitle>
              <CardDescription>Daily average WPM & accuracy from TestResult (90 days) — take a test to seed the timeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyInline icon={TrendingUp} title="No history yet" description="Your daily WPM trend will appear here once you complete typing tests." ctaHref="/dashboard" ctaLabel="Take a test" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 3: Practice Frequency — LeetCode-like, full width */}
      <div className="col-span-12">
        {hasPractice ? (
          <PracticeHeatMap data={data.practiceFrequency} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><Calendar className="h-4 w-4" /></span>
                Practice Frequency
              </CardTitle>
              <CardDescription>Shows daily activity (UTC YYYY-MM-DD). Start practicing to fill your heatmap.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyInline icon={Calendar} title="No practice activity yet" description="Your 365-day heatmap will light up as you practice." ctaHref="/learn" ctaLabel="Start practicing" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 4: Best WPM by Lesson — AFTER frequency as requested */}
      <div className="col-span-12">
        {hasBestWpm ? (
          <WPMProgressChart data={data.wpmByLesson} />
        ) : (
          <EmptyChartCard icon={TrendingUp} title="No best-per-lesson data" description="Your best WPM per lesson (single point from last 90 days) will appear here." ctaHref="/learn" ctaLabel="Start learning" />
        )}
      </div>

      {/* Row 5: Skill tree — real tree layout, capped at 100 for readability */}
      <div className="col-span-12">
        {data.skillTree.length > 100 ? (
          <>
            <SkillTreeVisualization data={data.skillTree.slice(0, 100)} />
            <p className="mt-2 text-center text-xs text-muted-foreground">Showing first 100 levels of {data.skillTree.length} — complete to unlock more tiers.</p>
          </>
        ) : (
          <SkillTreeVisualization data={data.skillTree} />
        )}
      </div>

      {/* Tips — light Card tokens, not dark gradients */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="col-span-12">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600"><Sparkles className="h-4 w-4" /></span>
              Tips for Improvement
            </CardTitle>
            <CardDescription>Small habits, big gains — keep it light and consistent.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-semibold flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-blue-600" /> Practice Regularly</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Short daily sessions beat marathon cramming — 10–15 min builds muscle memory.</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-semibold flex items-center gap-1.5"><Award className="h-4 w-4 text-emerald-600" /> Accuracy First</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Lock in 95%+ accuracy before chasing speed — clean strokes scale faster.</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-violet-600" /> Track Trends</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Compare “Best per Lesson” (peaks) vs “History” (consistency) weekly.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
