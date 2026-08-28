'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Award, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LessonWPMData } from '@/types';

interface WPMProgressChartProps {
  data: LessonWPMData[];
}

const LESSON_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number; payload: Record<string, unknown> }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-popover text-popover-foreground shadow-lg p-3 min-w-[160px]">
        <p className="font-medium text-sm mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              <span className="text-muted-foreground truncate">{entry.name}:</span>
              <span className="font-semibold ml-auto">{entry.value} WPM</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function WPMProgressChart({ data }: WPMProgressChartProps) {
  const [selectedLessons, setSelectedLessons] = useState<string[]>(() => data.slice(0, 5).map((l) => l.lessonId));
  const [showFilter, setShowFilter] = useState(false);

  // Keep selectedLessons in sync if data changes externally
  // cheapest: derive available ids
  const availableIds = useMemo(() => new Set(data.map((d) => d.lessonId)), [data]);

  const filteredSelected = useMemo(() => selectedLessons.filter((id) => availableIds.has(id)), [selectedLessons, availableIds]);

  // Data for bar chart: one bar per lesson (single point per lesson from lastAttempt 90d)
  // Use best value from data[0] as single-point display
  const barData = useMemo(() => {
    const selected = data.filter((l) => filteredSelected.includes(l.lessonId));
    return selected.map((l) => {
      const point = l.data[0];
      return {
        lesson: l.lessonTitle.length > 14 ? l.lessonTitle.slice(0, 14) + '…' : l.lessonTitle,
        fullTitle: l.lessonTitle,
        wpm: point?.wpm ?? 0,
        accuracy: point?.accuracy ?? 0,
        level: l.level,
      };
    });
  }, [data, filteredSelected]);

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons((prev) => (prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : prev.length >= 8 ? prev : [...prev, lessonId]));
  };

  const selectedLessonData = useMemo(() => data.filter((l) => filteredSelected.includes(l.lessonId)), [data, filteredSelected]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                  <Award className="h-4 w-4" />
                </span>
                Best WPM by Lesson
              </CardTitle>
              <CardDescription className="mt-1">Single best point per lesson (last 90 days)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilter(!showFilter)} aria-label="Filter lessons" className="shrink-0 rounded-full">
              <Filter className="h-4 w-4 mr-1.5" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showFilter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">Select lessons (max 8) — currently {filteredSelected.length}</p>
              <div className="flex flex-wrap gap-1.5">
                {data.map((lesson, index) => {
                  const active = filteredSelected.includes(lesson.lessonId);
                  return (
                    <button
                      key={lesson.lessonId}
                      onClick={() => toggleLesson(lesson.lessonId)}
                      disabled={!active && filteredSelected.length >= 8}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition ${active ? 'bg-foreground text-background border-foreground' : 'bg-card hover:bg-accent border' } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: LESSON_COLORS[index % LESSON_COLORS.length] }} />
                      {lesson.lessonTitle}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {barData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="lesson" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-18} textAnchor="end" height={64} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} label={{ value: 'WPM', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
                  <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                  <Bar dataKey="wpm" name="WPM" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" animationDuration={650} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] grid place-items-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
              <div>
                <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium">No best-per-lesson data yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[28ch]">Complete a lesson — we keep the best WPM from the last 90 days per lesson.</p>
              </div>
            </div>
          )}

          {selectedLessonData.length > 0 && (
            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {selectedLessonData.slice(0, 4).map((lesson) => {
                const point = lesson.data[0];
                const wpm = point?.wpm ?? 0;
                const acc = point?.accuracy ?? 0;
                return (
                  <div key={lesson.lessonId} className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LESSON_COLORS[data.findIndex((d) => d.lessonId === lesson.lessonId) % LESSON_COLORS.length] }} />
                      <p className="text-xs text-muted-foreground truncate">{lesson.lessonTitle}</p>
                    </div>
                    <p className="text-lg font-bold tracking-tight">{wpm} <span className="text-xs font-normal text-muted-foreground">WPM</span></p>
                    <p className="text-xs text-muted-foreground">{acc ? `${acc}% acc` : '—'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
