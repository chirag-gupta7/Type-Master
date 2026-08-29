'use client';

import { useState, useMemo, useLayoutEffect, useRef } from 'react';
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

type ViewMode = 'linear' | 'tree';

export function SkillTreeVisualization({ data }: SkillTreeVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<Array<{ d: string; locked: boolean; key: string }>>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const { lessonsByLevel, levels } = useMemo(() => {
    const grouped = data.reduce((acc, lesson) => {
      if (!acc[lesson.level]) acc[lesson.level] = [];
      acc[lesson.level].push(lesson);
      return acc;
    }, {} as Record<number, SkillTreeNode[]>);
    const sortedLevels = Object.keys(grouped).map(Number).sort((a, b) => a - b);
    return { lessonsByLevel: grouped, levels: sortedLevels };
  }, [data]);

  // ponytail: tier cap 8 per row, paginate if >8 needed for 100 lesson bucket — DAG scales O(E) svg
  const paginatedInfo = useMemo(() => {
    const map: Record<number, { visible: SkillTreeNode[]; total: number; hasMore: boolean }> = {};
    levels.forEach((lvl) => {
      const lessons = [...(lessonsByLevel[lvl] || [])].sort((a, b) => a.order - b.order);
      map[lvl] = { visible: lessons.slice(0, 8), total: lessons.length, hasMore: lessons.length > 8 };
    });
    return map;
  }, [levels, lessonsByLevel]);

  // SVG overlay per prereq in tree mode — measure node rects by id
  useLayoutEffect(() => {
    if (viewMode !== 'tree' || !containerRef.current) {
      setPaths([]);
      return;
    }
    const container = containerRef.current;
    const update = () => {
      if (!container) return;
      const crect = container.getBoundingClientRect();
      const newPaths: Array<{ d: string; locked: boolean; key: string }> = [];
      data.forEach((node) => {
        node.prerequisites.forEach((prereqId) => {
          const childEl = container.querySelector(`[data-node-id="${CSS.escape(node.id)}"]`) as HTMLElement | null;
          const parentEl = container.querySelector(`[data-node-id="${CSS.escape(prereqId)}"]`) as HTMLElement | null;
          if (!childEl || !parentEl) return;
          const prect = parentEl.getBoundingClientRect();
          const crectChild = childEl.getBoundingClientRect();
          const startX = prect.left + prect.width / 2 - crect.left + container.scrollLeft;
          const startY = prect.bottom - crect.top + container.scrollTop;
          const endX = crectChild.left + crectChild.width / 2 - crect.left + container.scrollLeft;
          const endY = crectChild.top - crect.top + container.scrollTop;
          const midY = (startY + endY) / 2;
          // dashed if locked else solid primary
          const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
          newPaths.push({ d, locked: node.locked, key: `${prereqId}->${node.id}` });
        });
      });
      setPaths(newPaths);
      setSvgSize({ w: container.scrollWidth, h: container.scrollHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    window.addEventListener('resize', update);
    container.addEventListener('scroll', update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      container.removeEventListener('scroll', update);
    };
  }, [data, viewMode, levels, lessonsByLevel]);

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
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                <Target className="h-4 w-4" />
              </span>
              Skill Tree
            </CardTitle>
            <div className="ml-auto flex items-center gap-1 rounded-full border bg-muted p-1">
              <button
                type="button"
                aria-pressed={viewMode === 'linear'}
                onClick={() => setViewMode('linear')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${viewMode === 'linear' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Linear
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'tree'}
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${viewMode === 'tree' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Tree
              </button>
            </div>
          </div>
          <CardDescription>Tap a node to inspect progress · {data.filter((d) => d.completed).length}/{data.length} completed · {viewMode === 'tree' ? 'DAG edges dashed=locked solid=unlocked' : 'Linear order'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="relative overflow-x-auto pb-2 -mx-1 px-1" style={viewMode === 'tree' ? { overflowX: 'auto' } : undefined}>
            {/* SVG overlay per prereq in tree mode */}
            {viewMode === 'tree' && paths.length > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={svgSize.w}
                height={svgSize.h}
                viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                {paths.map((p) => (
                  <path
                    key={p.key}
                    d={p.d}
                    fill="none"
                    stroke={p.locked ? 'hsl(var(--border))' : 'hsl(var(--primary))'}
                    strokeWidth={p.locked ? 1.5 : 2}
                    strokeDasharray={p.locked ? '6 4' : undefined}
                    opacity={p.locked ? 0.7 : 0.9}
                  />
                ))}
              </svg>
            )}
            <div className="inline-flex flex-col gap-6 min-w-full relative">
              {levels.map((level, levelIndex) => {
                const lessons = [...(lessonsByLevel[level] || [])].sort((a, b) => a.order - b.order);
                const pg = paginatedInfo[level];
                const visibleLessons = viewMode === 'tree' && pg.hasMore ? pg.visible : lessons;
                const completedInLevel = lessons.filter((l) => l.completed).length;
                return (
                  <motion.div key={level} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + levelIndex * 0.06 }} className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5">
                        <span className={`h-2 w-2 rounded-full ${getDifficultyDot(lessons[0]?.difficulty || '')}`} />
                        <span className="text-xs font-semibold tracking-tight">{getLevelName(level)}</span>
                        <span className="text-xs text-muted-foreground">· {completedInLevel}/{lessons.length}</span>
                        {pg.hasMore && <span className="text-[10px] text-muted-foreground">+{pg.total - pg.visible.length} more</span>}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className={viewMode === 'tree' ? 'flex gap-3 items-center flex-nowrap overflow-x-auto justify-center py-1' : 'flex gap-3 items-center flex-wrap'}>
                      {visibleLessons.map((lesson, lessonIndex) => {
                        const isHovered = hoveredNode === lesson.id;
                        const isSelected = selectedNode?.id === lesson.id;
                        return (
                          <div key={lesson.id} className="relative shrink-0" data-node-id={lesson.id}>
                            {viewMode === 'linear' && lessonIndex > 0 && <div className="absolute right-full top-1/2 -translate-y-1/2 w-3 h-px bg-border" aria-hidden />}
                            {viewMode === 'linear' && lesson.prerequisites.length > 0 && levelIndex > 0 && (
                              <svg className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none" width="2" height="18" aria-hidden>
                                <line x1="1" y1="0" x2="1" y2="18" stroke="hsl(var(--border))" strokeWidth="1.5" strokeDasharray="3 3" />
                              </svg>
                            )}
                            <motion.button
                              whileHover={{ scale: lesson.locked ? 1 : 1.04, y: lesson.locked ? 0 : -1 }}
                              whileTap={{ scale: lesson.locked ? 1 : 0.97 }}
                              onClick={() => { if (!lesson.locked) setSelectedNode(lesson); }}
                              onHoverStart={() => setHoveredNode(lesson.id)}
                              onHoverEnd={() => setHoveredNode(null)}
                              disabled={lesson.locked}
                              aria-disabled={lesson.locked}
                              aria-label={`${lesson.title} - ${lesson.locked ? 'Locked' : lesson.completed ? 'Completed' : 'Available'}, Target ${lesson.targetWpm} WPM`}
                              aria-expanded={isSelected}
                              className={`relative group w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${getDifficultyStyles(lesson.difficulty)} ${isSelected ? 'ring-2 ring-ring ring-offset-2' : ''} ${lesson.locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
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
                      {viewMode === 'tree' && pg.hasMore && (
                        <div className="shrink-0 rounded-xl border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          +{pg.total - pg.visible.length} more
                        </div>
                      )}
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
            {viewMode === 'tree' && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-px w-4 bg-foreground" /> Solid=unlocked <span className="h-px w-4 border-t border-dashed border-muted-foreground ml-2" /> Dashed=locked</span>}
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
