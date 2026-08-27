'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LearningProgressDashboard } from '@/components/LearningProgressDashboard';
import { authAPI } from '@/lib/api';

export default function ProgressPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ok = authAPI.isAuthenticated();
    setIsAuthenticated(ok);
    setLoading(false);
    if (!ok) router.push('/');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" aria-label="Loading" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="pb-10 pt-6 md:pt-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">Heatmap, streaks, weak keys, and lesson analytics — all in one view.</p>
        </div>
        <div className="rounded-[24px] border bg-card/60 p-4 md:p-6 backdrop-blur-xl">
          <LearningProgressDashboard />
        </div>
      </div>
    </div>
  );
}
