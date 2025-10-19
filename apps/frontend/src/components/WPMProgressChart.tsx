'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';
import type { LessonWPMData } from '@/types';

interface WPMProgressChartProps {
  data: LessonWPMData[];
}

const LESSON_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

// Custom tooltip
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300 text-sm">
                {entry.name}: <span className="text-white font-medium">{entry.value} WPM</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function WPMProgressChart({ data }: WPMProgressChartProps) {
  const [selectedLessons, setSelectedLessons] = useState<string[]>(
    data.slice(0, 5).map((l) => l.lessonId)
  );
  const [showFilter, setShowFilter] = useState(false);

  // Combine all data points by date
  const allDates = Array.from(
    new Set(data.flatMap((lesson) => lesson.data.map((d) => d.date)))
  ).sort();

  // Create chart data with all lessons
  const chartData = allDates.map((date) => {
    const dataPoint: Record<string, string | number> = {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    data.forEach((lesson) => {
      if (selectedLessons.includes(lesson.lessonId)) {
        const lessonData = lesson.data.find((d) => d.date === date);
        if (lessonData) {
          dataPoint[lesson.lessonTitle] = lessonData.wpm;
        }
      }
    });
    return dataPoint;
  });

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const selectedLessonData = data.filter((l) => selectedLessons.includes(l.lessonId));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">WPM Progress Over Time</h3>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4 text-gray-300" />
          <span className="text-sm text-gray-300">Filter Lessons</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
        >
          <p className="text-sm text-gray-400 mb-3">Select lessons to display (max 8):</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {data.map((lesson, index) => (
              <button
                key={lesson.lessonId}
                onClick={() => toggleLesson(lesson.lessonId)}
                disabled={!selectedLessons.includes(lesson.lessonId) && selectedLessons.length >= 8}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  selectedLessons.includes(lesson.lessonId)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: LESSON_COLORS[index % LESSON_COLORS.length],
                    }}
                  />
                  <span className="truncate">{lesson.lessonTitle}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{
                  value: 'Words Per Minute',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
                formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
              />
              {selectedLessonData.map((lesson, index) => (
                <Line
                  key={lesson.lessonId}
                  type="monotone"
                  dataKey={lesson.lessonTitle}
                  stroke={LESSON_COLORS[data.indexOf(lesson) % LESSON_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1000}
                  animationBegin={index * 100}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No progress data available yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Complete some lessons to see your improvement over time
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      {selectedLessonData.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {selectedLessonData.slice(0, 4).map((lesson, index) => {
            const latestWpm = lesson.data[lesson.data.length - 1]?.wpm || 0;
            const firstWpm = lesson.data[0]?.wpm || 0;
            const improvement = latestWpm - firstWpm;
            const improvementPercent =
              firstWpm > 0 ? Math.round((improvement / firstWpm) * 100) : 0;

            return (
              <motion.div
                key={lesson.lessonId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: LESSON_COLORS[data.indexOf(lesson) % LESSON_COLORS.length],
                    }}
                  />
                  <p className="text-xs text-gray-400 truncate">{lesson.lessonTitle}</p>
                </div>
                <p className="text-2xl font-bold text-white">{latestWpm} WPM</p>
                {improvement !== 0 && (
                  <p
                    className={`text-xs mt-1 ${
                      improvement > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {improvement > 0 ? '+' : ''}
                    {improvement} ({improvementPercent > 0 ? '+' : ''}
                    {improvementPercent}%)
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
