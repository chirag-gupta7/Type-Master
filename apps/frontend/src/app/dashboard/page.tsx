'use client';

import { useEffect, useState } from 'react';
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
import { testAPI } from '@/lib/api';
import TypingTest from '@/components/TypingTest';

interface UserStats {
  averageWpm: number;
  bestWpm: number;
  totalTests: number;
  averageAccuracy: number;
}

interface TestHistory {
  id: string;
  wpm: number;
  accuracy: number;
  duration: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status and fetch data only if authenticated
  useEffect(() => {
    // Check if user has a token
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch user stats and test history
        const [statsResponse, historyData] = await Promise.all([
          testAPI.getUserStats(),
          testAPI.getTestHistory(1, 10), // Get last 10 tests for chart
        ]);

        setStats(statsResponse.stats);
        setHistory(historyData.tests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Prepare chart data - reverse to show chronological order
  const chartData = history
    .slice()
    .reverse()
    .map((test, index) => ({
      test: `Test ${index + 1}`,
      WPM: test.wpm,
      Accuracy: test.accuracy,
      date: new Date(test.createdAt).toLocaleDateString(),
    }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Typing Test Section - Always visible */}
      <div className="mb-12">
        <TypingTest />
      </div>

      {/* Stats Section - Only for authenticated users */}
      {!isAuthenticated ? (
        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Track Your Progress</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Log in or sign up to track your stats and progress over time.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
              Sign Up
            </button>
            <button className="px-6 py-3 bg-background/50 border border-border rounded-xl hover:bg-muted transition-colors">
              Log In
            </button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-lg text-muted-foreground">Loading your stats...</p>
        </div>
      ) : error ? (
        <div className="bg-card border rounded-lg p-6 text-center">
          <p className="text-lg text-destructive mb-2">Error loading stats</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Average WPM</p>
              <p className="text-3xl font-bold">{stats?.averageWpm.toFixed(1) || 0}</p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Best WPM</p>
              <p className="text-3xl font-bold">{stats?.bestWpm.toFixed(1) || 0}</p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Tests</p>
              <p className="text-3xl font-bold">{stats?.totalTests || 0}</p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Average Accuracy</p>
              <p className="text-3xl font-bold">{stats?.averageAccuracy.toFixed(1) || 0}%</p>
            </div>
          </div>

          {/* Progress Chart */}
          {chartData.length > 0 ? (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Progress Over Time</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="test" />
                  <YAxis
                    yAxisId="left"
                    label={{ value: 'WPM', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="WPM"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Accuracy"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-6">
              <p className="text-center text-muted-foreground">
                No test history available. Take your first typing test!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
