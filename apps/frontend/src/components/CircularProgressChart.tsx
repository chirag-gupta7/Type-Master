'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Trophy, Star } from 'lucide-react';
import type { LevelCompletion } from '@/types';

interface CircularProgressChartProps {
  data: LevelCompletion[];
}

const COLORS = {
  Beginner: '#10b981', // green-500
  Intermediate: '#3b82f6', // blue-500
  Advanced: '#f59e0b', // amber-500
  Expert: '#ef4444', // red-500
};

const RADIAN = Math.PI / 180;

// Custom label for the pie chart
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
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      percentage: number;
      completed: number;
      total: number;
      stars: number;
      maxStars: number;
    };
  }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-300">
            Completion: <span className="text-white font-medium">{data.percentage}%</span>
          </p>
          <p className="text-gray-300">
            Lessons:{' '}
            <span className="text-white font-medium">
              {data.completed}/{data.total}
            </span>
          </p>
          <p className="text-gray-300">
            Stars:{' '}
            <span className="text-yellow-400 font-medium">
              {data.stars}/{data.maxStars}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function CircularProgressChart({ data }: CircularProgressChartProps) {
  // Format data for Recharts
  const chartData = data.map((level) => ({
    name: level.name,
    value: level.completed,
    total: level.total,
    percentage: level.percentage,
    stars: level.stars,
    maxStars: level.maxStars,
  }));

  // Calculate overall stats
  const totalCompleted = data.reduce((sum, level) => sum + level.completed, 0);
  const totalLessons = data.reduce((sum, level) => sum + level.total, 0);
  const totalStars = data.reduce((sum, level) => sum + level.stars, 0);
  const maxStars = data.reduce((sum, level) => sum + level.maxStars, 0);
  const overallPercentage =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Completion by Level</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel as never}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics Cards */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Overall Progress</p>
                <p className="text-3xl font-bold text-white">{overallPercentage}%</p>
              </div>
              <div className="text-right text-white">
                <p className="text-sm opacity-90">
                  {totalCompleted} / {totalLessons}
                </p>
                <p className="text-xs opacity-75">Lessons Completed</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-200" fill="currentColor" />
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Total Stars</p>
                  <p className="text-3xl font-bold text-white">{totalStars}</p>
                </div>
              </div>
              <div className="text-right text-white">
                <p className="text-sm opacity-90">{maxStars} Maximum</p>
                <p className="text-xs opacity-75">
                  {maxStars > 0 ? Math.round((totalStars / maxStars) * 100) : 0}% Achieved
                </p>
              </div>
            </div>
          </motion.div>

          {/* Level Breakdown */}
          <div className="space-y-2">
            {data.map((level, index) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">{level.name}</span>
                  <span className="text-xs text-gray-400">
                    {level.completed}/{level.total} lessons
                  </span>
                </div>
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${level.percentage}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                    className="absolute h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${COLORS[level.name as keyof typeof COLORS]}, ${COLORS[level.name as keyof typeof COLORS]}dd)`,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
