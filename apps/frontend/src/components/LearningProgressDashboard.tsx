'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { CircularProgressChart } from './CircularProgressChart';
import { WPMProgressChart } from './WPMProgressChart';
import { PracticeHeatMap } from './PracticeHeatMap';
import { SkillTreeVisualization } from './SkillTreeVisualization';
import { lessonAPI } from '@/lib/api';
import type { ProgressVisualizationData } from '@/types';

export function LearningProgressDashboard() {
  const [data, setData] = useState<ProgressVisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await lessonAPI.getProgressVisualization();
        setData(response);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[600px]"
      >
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h3 className="text-xl font-bold text-white">Error Loading Data</h3>
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return null;
  }

  const hasNoData =
    data.completionByLevel.length === 0 &&
    data.wpmByLesson.length === 0 &&
    data.practiceFrequency.length === 0;

  if (hasNoData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[600px]"
      >
        <div className="text-center max-w-md">
          <TrendingUp className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">No Progress Data Yet</h3>
          <p className="text-gray-400 mb-6">
            Start practicing lessons to see your progress visualized here. Your journey to becoming
            a typing master begins now!
          </p>
          <a
            href="/learn"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Start Learning
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-white mb-3">Your Learning Progress</h1>
        <p className="text-gray-400 text-lg">
          Track your improvement and master your typing skills
        </p>
      </motion.div>

      {/* Circular Progress Chart */}
      {data.completionByLevel.length > 0 && <CircularProgressChart data={data.completionByLevel} />}

      {/* WPM Progress Chart */}
      {data.wpmByLesson.length > 0 && <WPMProgressChart data={data.wpmByLesson} />}

      {/* Practice Heat Map */}
      <PracticeHeatMap data={data.practiceFrequency} />

      {/* Skill Tree */}
      {data.skillTree.length > 0 && <SkillTreeVisualization data={data.skillTree} />}

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4">💡 Tips for Improvement</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-blue-400 font-semibold mb-2">Practice Regularly</p>
            <p className="text-gray-400 text-sm">
              Consistent daily practice is key to building muscle memory and improving speed.
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-green-400 font-semibold mb-2">Focus on Accuracy</p>
            <p className="text-gray-400 text-sm">
              Maintain high accuracy before increasing speed. Quality over quantity!
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-purple-400 font-semibold mb-2">Track Progress</p>
            <p className="text-gray-400 text-sm">
              Review your progress regularly to identify areas for improvement.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
