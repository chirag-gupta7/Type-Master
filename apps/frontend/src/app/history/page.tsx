'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { testAPI } from '@/lib/api';

interface TestResult {
  id: string;
  wpm: number;
  accuracy: number;
  duration: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 10;

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setError(null);

        const data = await testAPI.getTestHistory(currentPage, pageSize);
        setTests(data.tests);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load test history');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [currentPage]);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Optimization: Pre-format test result fields (date string, duration string, fixed-point metrics, and accuracy class)
  // in a single O(N) pass memoized with `useMemo`.
  // Performance impact: Prevents creating new `Date` objects, running `toLocaleString`, and computing string transformations
  // on every component re-render when `tests` remains unchanged.
  const formattedTests = useMemo(() => {
    return tests.map((test) => {
      const date = new Date(test.createdAt);
      const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      let formattedDuration: string;
      if (test.duration < 60) {
        formattedDuration = `${test.duration}s`;
      } else {
        const minutes = Math.floor(test.duration / 60);
        const remainingSeconds = test.duration % 60;
        formattedDuration = remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
      }

      const accuracyClass =
        test.accuracy >= 95
          ? 'text-green-600 dark:text-green-400'
          : test.accuracy >= 90
            ? 'text-yellow-600 dark:text-yellow-400'
            : '';

      return {
        ...test,
        formattedDate,
        formattedDuration,
        formattedWpm: test.wpm.toFixed(1),
        formattedAccuracy: test.accuracy.toFixed(1),
        accuracyClass,
      };
    });
  }, [tests]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-muted-foreground">Loading test history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg text-destructive mb-2">Error loading test history</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test History</h1>

      {tests.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            No test history available. Take your first typing test!
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">WPM</th>
                    <th className="text-left p-4 font-semibold">Accuracy</th>
                    <th className="text-left p-4 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedTests.map((test) => (
                    <tr
                      key={test.id}
                      className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">{test.formattedDate}</td>
                      <td className="p-4">
                        <span className="font-semibold text-primary">{test.formattedWpm}</span>
                      </td>
                      <td className="p-4">
                        <span className={test.accuracyClass}>
                          {test.formattedAccuracy}%
                        </span>
                      </td>
                      <td className="p-4">{test.formattedDuration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrevious} disabled={currentPage === 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
