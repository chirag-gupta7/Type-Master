'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Star, Target, Zap, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { SkillTreeNode } from '@/types';

interface SkillTreeVisualizationProps {
  data: SkillTreeNode[];
}

function getDifficultyStyles(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30';
    case 'medium': return 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30';
    case 'hard': return 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30';
    case 'expert': return 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30';
    default: return 'border-border bg-muted/20';
  }
}
function getDifficultyDot(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'bg-emerald-500';
    case 'medium': return 'bg-blue-500';
    case 'hard': return 'bg-amber-500';
    case 'expert': return 'bg-red-500';
    default: return 'bg-muted-foreground';
  }
}
function getLevelName(level: number): string {
  const names = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  return names[level - 1] || `Level ${level}`;
}

export function SkillTreeVisualization({ data }: SkillTreeVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { lessonsByLevel, levels } = useMemo(() => {
    const grouped = data.reduce((acc, lesson) => {
      if (!acc[lesson.level]) acc[lesson.level] = [];
      acc[lesson.level].push(lesson);
      return acc;
    }, {} as Record<number, SkillTreeNode[]>);
    const sortedLevels = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    return { lessonsByLevel: grouped, levels: sortedLevels };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600"><Target className="h-4 w-4" /></span>
            Skill Tree
          </CardTitle>
          <CardDescription>No lessons available yet — start your first lesson to populate the tree.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
              <Target className="h-4 w-4" />
            </span>
            Skill Tree
          </CardTitle>
          <CardDescription>Tap a node to inspect progress · {data.filter((d) => d.completed).length}/{data.length} completed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto pb-2 -mx-1 px-1">
            <div className="inline-flex flex-col gap-6 min-w-full">
              {levels.map((level, levelIndex) => {
                const lessons = [...(lessonsByLevel[level] || [])].sort((a, b) => a.order - b.order);
                const completedInLevel = lessons.filter((l) => l.completed).length;
                return (
                  <motion.div key={level} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + levelIndex * 0.06 }} className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5">
                        <span className={`h-2 w-2 rounded-full ${getDifficultyDot(lessons[0]?.difficulty || '')}`} />
                        <span className="text-xs font-semibold tracking-tight">{getLevelName(level)}</span>
                        <span className="text-xs text-muted-foreground">· {completedInLevel}/{lessons.length}</span>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="flex gap-3 items-center flex-wrap">
                      {lessons.map((lesson, lessonIndex) => {
                        const isHovered = hoveredNode === lesson.id;
                        const isSelected = selectedNode?.id === lesson.id;
                        const hasPrereq = lesson.prerequisites.length > 0;
                        return (
                          <div key={lesson.id} className="relative">
                            {lessonIndex > 0 && <div className="hidden sm:block absolute right-full top-1/2 -translate-y-1/2 w-3 h-px bg-border" />}
                            {hasPrereq && levelIndex > 0 && (
                              <svg className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none hidden sm:block" width="2" height="18">
                                <line x1="1" y1="0" x2="1" y2="18" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 3" />
                              </svg>
                            )}
                            <motion.button
                              whileHover={{ scale: lesson.locked ? 1 : 1.04, y: lesson.locked ? 0 : -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedNode(lesson)}
                              onHoverStart={() => setHoveredNode(lesson.id)}
                              onHoverEnd={() => setHoveredNode(null)}
                              aria-label={`${lesson.title} - ${lesson.locked ? 'Locked' : lesson.completed ? 'Completed' : 'Available'}, Target ${lesson.targetWpm} WPM`}
                              aria-expanded={isSelected}
                              className={`relative group w-[120px] h-[120px] sm:w-32 sm:h-32 rounded-2xl border-2 p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${getDifficultyStyles(lesson.difficulty)} ${isSelected ? 'ring-2 ring-violet-500 ring-offset-2' : ''} ${lesson.locked ? 'opacity-60' : ''}`}
                            >
                              <div className={`w-full h-full rounded-xl p-2.5 flex flex-col items-center justify-center relative overflow-hidden text-center ${lesson.completed ? 'bg-emerald-500/10' : 'bg-card'}`}>
                                {lesson.completed && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 4 }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10 pointer-events-none" />}
                                <div className="mb-1.5">
                                  {lesson.locked ? <Lock className="w-7 h-7 text-muted-foreground" /> : lesson.completed ? <Check className="w-7 h-7 text-emerald-600" /> : <Zap className="w-7 h-7 text-blue-600" />}
                                </div>
                                <p className="text-xs font-medium leading-tight line-clamp-2 text-foreground">{lesson.title}</p>
                                {!lesson.locked && (
                                  <div className="flex gap-0.5 mt-1">
                                    {[1, 2, 3].map((star) => (
                                      <Star key={star} className={`w-3 h-3 ${star <= lesson.stars ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                                    ))}
                                  </div>
                                )}
                                {lesson.bestWpm > 0 && (
                                  <div className="absolute top-1 right-1 rounded-full bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5">{lesson.bestWpm}</div>
                                )}
                                {isHovered && (
                                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-44 rounded-xl border bg-popover text-popover-foreground shadow-lg p-2.5 z-10 pointer-events-none hidden sm:block">
                                    <p className="font-semibold text-xs truncate">{lesson.title}</p>
                                    <div className="text-[11px] text-muted-foreground space-y-0.5 mt-1">
                                      <p>Target: {lesson.targetWpm} WPM</p>
                                      <p className="capitalize">{lesson.difficulty}</p>
                                      {lesson.attempts > 0 && <p>Attempts: {lesson.attempts}</p>}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-emerald-600" /> Completed</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Zap className="h-3.5 w-3.5 text-blue-600" /> Available</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Locked</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Stars</span>
          </div>

          <AnimatePresence>
            {selectedNode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-5 overflow-hidden">
                <div className={`rounded-2xl border p-4 sm:p-5 ${getDifficultyStyles(selectedNode.difficulty)}`}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-base font-bold tracking-tight">{selectedNode.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{getLevelName(selectedNode.level)} · Lesson {selectedNode.order}</p>
                    </div>
                    <button onClick={() => setSelectedNode(null)} aria-label="Close lesson details" className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-card hover:bg-accent transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="rounded-xl bg-card border p-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-semibold mt-1">{selectedNode.locked ? 'Locked' : selectedNode.completed ? 'Completed' : 'In Progress'}</p>
                    </div>
                    <div className="rounded-xl bg-card border p-3">
                      <p className="text-xs text-muted-foreground">Target WPM</p>
                      <p className="text-sm font-semibold mt-1">{selectedNode.targetWpm}</p>
                    </div>
                    <div className="rounded-xl bg-card border p-3">
                      <p className="text-xs text-muted-foreground">Best WPM</p>
                      <p className="text-sm font-semibold mt-1">{selectedNode.bestWpm || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-card border p-3">
                      <p className="text-xs text-muted-foreground">Attempts</p>
                      <p className="text-sm font-semibold mt-1">{selectedNode.attempts}</p>
                    </div>
                  </div>
                  {selectedNode.prerequisites.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-1.5">Prerequisites</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.prerequisites.map((prereqId) => {
                          const prereq = data.find((l) => l.id === prereqId);
                          return <span key={prereqId} className="inline-flex rounded-full border bg-card px-2.5 py-1 text-xs">{prereq?.title || 'Unknown'}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
