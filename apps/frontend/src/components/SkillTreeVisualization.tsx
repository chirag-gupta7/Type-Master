'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Star, Target, Zap } from 'lucide-react';
import type { SkillTreeNode } from '@/types';

interface SkillTreeVisualizationProps {
  data: SkillTreeNode[];
}

// Get color by difficulty
function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'from-green-600 to-green-700';
    case 'medium':
      return 'from-blue-600 to-blue-700';
    case 'hard':
      return 'from-orange-600 to-orange-700';
    case 'expert':
      return 'from-red-600 to-red-700';
    default:
      return 'from-gray-600 to-gray-700';
  }
}

// Get level name
function getLevelName(level: number): string {
  const names = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  return names[level - 1] || `Level ${level}`;
}

export function SkillTreeVisualization({ data }: SkillTreeVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Group lessons by level
  const lessonsByLevel = data.reduce(
    (acc, lesson) => {
      if (!acc[lesson.level]) {
        acc[lesson.level] = [];
      }
      acc[lesson.level].push(lesson);
      return acc;
    },
    {} as Record<number, SkillTreeNode[]>
  );

  const levels = Object.keys(lessonsByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white">Skill Tree</h3>
      </div>

      {/* Skill Tree */}
      <div className="relative overflow-x-auto pb-4">
        <div className="inline-flex flex-col gap-8 min-w-full">
          {levels.map((level, levelIndex) => {
            const lessons = lessonsByLevel[level].sort((a, b) => a.order - b.order);

            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + levelIndex * 0.1 }}
                className="relative"
              >
                {/* Level Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg px-4 py-2">
                    <p className="text-white font-bold">{getLevelName(level)}</p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent" />
                </div>

                {/* Lessons */}
                <div className="flex gap-4 items-center relative">
                  {lessons.map((lesson, lessonIndex) => {
                    const isHovered = hoveredNode === lesson.id;
                    const isSelected = selectedNode?.id === lesson.id;
                    const hasPrerequisites = lesson.prerequisites.length > 0;

                    return (
                      <div key={lesson.id} className="relative">
                        {/* Connection line to previous lesson */}
                        {lessonIndex > 0 && (
                          <div className="absolute right-full top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gray-600" />
                        )}

                        {/* Connection lines to prerequisites */}
                        {hasPrerequisites && levelIndex > 0 && (
                          <svg
                            className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none"
                            width="2"
                            height="32"
                          >
                            <line
                              x1="1"
                              y1="0"
                              x2="1"
                              y2="32"
                              stroke="#4b5563"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                            />
                          </svg>
                        )}

                        {/* Lesson Node */}
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedNode(lesson)}
                          onHoverStart={() => setHoveredNode(lesson.id)}
                          onHoverEnd={() => setHoveredNode(null)}
                          className={`relative group w-32 h-32 rounded-xl bg-gradient-to-br ${getDifficultyColor(
                            lesson.difficulty
                          )} p-0.5 transition-all ${
                            isSelected ? 'ring-4 ring-purple-500' : ''
                          } ${lesson.locked ? 'opacity-50' : ''}`}
                        >
                          <div className="w-full h-full bg-gray-900 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Background shimmer effect for completed */}
                            {lesson.completed && (
                              <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatDelay: 3,
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                              />
                            )}

                            {/* Icon */}
                            <div className="mb-2">
                              {lesson.locked ? (
                                <Lock className="w-8 h-8 text-gray-500" />
                              ) : lesson.completed ? (
                                <Check className="w-8 h-8 text-green-400" />
                              ) : (
                                <Zap className="w-8 h-8 text-blue-400" />
                              )}
                            </div>

                            {/* Title */}
                            <p className="text-xs text-white text-center font-medium line-clamp-2 mb-1">
                              {lesson.title}
                            </p>

                            {/* Stars */}
                            {!lesson.locked && (
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= lesson.stars
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* WPM badge */}
                            {lesson.bestWpm > 0 && (
                              <div className="absolute top-1 right-1 bg-blue-600 rounded px-1.5 py-0.5">
                                <p className="text-xs text-white font-bold">{lesson.bestWpm}</p>
                              </div>
                            )}

                            {/* Hover tooltip */}
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-10 pointer-events-none"
                              >
                                <p className="text-white font-semibold text-sm mb-1">
                                  {lesson.title}
                                </p>
                                <div className="text-xs text-gray-400 space-y-1">
                                  <p>Target: {lesson.targetWpm} WPM</p>
                                  <p>Difficulty: {lesson.difficulty}</p>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm text-gray-400">Stars (max 3)</span>
        </div>
      </div>

      {/* Selected Lesson Details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div
              className={`bg-gradient-to-br ${getDifficultyColor(selectedNode.difficulty)} rounded-xl p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">{selectedNode.title}</h4>
                  <p className="text-sm text-white/80">
                    {getLevelName(selectedNode.level)} - Lesson {selectedNode.order}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Status</p>
                  <p className="text-white font-semibold">
                    {selectedNode.locked
                      ? 'Locked'
                      : selectedNode.completed
                        ? 'Completed'
                        : 'In Progress'}
                  </p>
                </div>

                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Target WPM</p>
                  <p className="text-white font-semibold">{selectedNode.targetWpm}</p>
                </div>

                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Best WPM</p>
                  <p className="text-white font-semibold">{selectedNode.bestWpm || '-'}</p>
                </div>

                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Attempts</p>
                  <p className="text-white font-semibold">{selectedNode.attempts}</p>
                </div>
              </div>

              {selectedNode.prerequisites.length > 0 && (
                <div className="mt-4">
                  <p className="text-white/70 text-sm mb-2">Prerequisites:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.prerequisites.map((prereqId) => {
                      const prereq = data.find((l) => l.id === prereqId);
                      return (
                        <div
                          key={prereqId}
                          className="bg-black/20 rounded-lg px-3 py-1 text-sm text-white"
                        >
                          {prereq?.title || 'Unknown'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
