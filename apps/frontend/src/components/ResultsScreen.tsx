'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, BarChart3, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MistakeAnalysis } from '@/components/MistakeAnalysis';
import { useSession } from 'next-auth/react';
import { lessonAPI, testAPI, achievementAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface MistakeDetail { key: string; expected: string; position: number; }

interface ResultsScreenProps {
  lessonId?: string;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  mistakes?: MistakeDetail[];
  footer?: ReactNode;
  aiFeedback?: string | null;
  isFeedbackLoading?: boolean;
  onRetry?: () => void;
  onContinue?: () => void;
}

export default function ResultsScreen({
  lessonId, wpm, accuracy, errors, duration, correctChars, incorrectChars, missedChars, mistakes = [], footer, aiFeedback, isFeedbackLoading, onRetry, onContinue,
}: ResultsScreenProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const savingRef = useRef(false);
  const lastSavedAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken || !lessonId || wpm <= 0 || savingRef.current) return;
    const attemptKey = `${lessonId}-${wpm}-${accuracy}-${errors}-${duration}`;
    if (lastSavedAttemptRef.current === attemptKey) return;
    let isActive = true; savingRef.current = true;
    const persist = async () => {
      try {
        await lessonAPI.saveLessonProgress({ lessonId, wpm, accuracy, completed: accuracy >= 90 });
        if (!isActive) return;
        // Check achievements after lesson save (backend auto-awards, but frontend needs to refresh cache and show toast)
        try {
          await achievementAPI.checkAchievements();
        } catch {
          // ignore achievement check failure
        }
        if (!isActive) return;
        lastSavedAttemptRef.current = attemptKey;
        toast({ title: 'Progress saved', description: 'Your lesson score has been recorded.' });
      } catch {
        if (isActive) { lastSavedAttemptRef.current = null; toast({ title: 'Could not save progress', description: 'Please try again.' }); }
      } finally { if (isActive) savingRef.current = false; }
    };
    void persist();
    return () => { isActive = false; savingRef.current = false; };
  }, [session?.accessToken, lessonId, wpm, accuracy, errors, duration, toast]);

  // Auto-save typing test results (non-lesson) and check achievements
  useEffect(() => {
    if (!session?.accessToken || lessonId || wpm <= 0 || accuracy <= 0 || savingRef.current) return;
    // Only for generic typing tests (no lessonId)
    const attemptKey = `test-${wpm}-${accuracy}-${errors}-${duration}`;
    if (lastSavedAttemptRef.current === attemptKey) return;
    let isActive = true;
    savingRef.current = true;
    const persistTest = async () => {
      try {
        const safeDuration = duration as 30 | 60 | 180;
        const normalizedDuration: 30 | 60 | 180 = safeDuration === 30 || safeDuration === 60 || safeDuration === 180 ? safeDuration : 60;
        const rawCalc = Math.round(((correctChars + incorrectChars) / 5 / Math.max(duration, 1)) * 60);
        await testAPI.saveTestResult({
          wpm,
          accuracy,
          rawWpm: rawCalc || wpm,
          errors,
          duration: normalizedDuration,
          mode: 'WORDS',
        });
        if (!isActive) return;
        lastSavedAttemptRef.current = attemptKey;
      } catch {
        if (isActive) lastSavedAttemptRef.current = null;
      } finally {
        if (isActive) savingRef.current = false;
      }
    };
    void persistTest();
    return () => {
      isActive = false;
      savingRef.current = false;
    };
  }, [session?.accessToken, lessonId, wpm, accuracy, errors, duration, correctChars, incorrectChars]);

  const totalChars = correctChars + incorrectChars + missedChars;
  const safeTotal = Math.max(totalChars, 1);
  const safeDuration = Math.max(duration, 1);
  const rawWpm = Math.round(((correctChars + incorrectChars) / 5 / safeDuration) * 60);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  const weakKeys = mistakes.length > 0
    ? Object.values(mistakes.reduce((acc, m) => {
        const key = m.key === ' ' ? '␣' : m.key;
        if (!acc[key]) acc[key] = { key, errorCount: 0 };
        acc[key].errorCount++; return acc;
      }, {} as Record<string, { key: string; errorCount: number }>)).sort((a, b) => b.errorCount - a.errorCount)
    : [];

  const practiceText = weakKeys.length > 0 ? weakKeys.slice(0, 10).map((wk) => wk.key).join(' ').repeat(10).slice(0, 200) : '';

  if (showDetailedAnalysis) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="detailed" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="w-full">
          <MistakeAnalysis weakKeys={weakKeys} practiceText={practiceText} onRetry={onRetry} onContinue={onContinue} />
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setShowDetailedAnalysis(false)} className="rounded-full">← Back to results</Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full space-y-4">
      {/* Hero stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-[20px] border bg-card p-6">
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--theme-primary)]/25 to-transparent blur-2xl" />
          <div className="text-xs font-medium tracking-widest text-muted-foreground">WORDS PER MINUTE</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight">{wpm}</span>
            <span className="text-sm font-medium text-muted-foreground">WPM</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600"><Zap className="h-3.5 w-3.5" /> Net</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {duration}s • Raw {rawWpm} WPM • {errors} errors
          </div>
        </div>

        <div className="rounded-[20px] border bg-card p-6 flex flex-col items-center justify-center">
          <div className="text-xs font-medium tracking-widest text-muted-foreground">ACCURACY</div>
          <div className="relative mt-3 h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="54" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
              <motion.circle
                cx="64" cy="64" r="54" fill="none" stroke="url(#grad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`} initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - accuracy / 100) }} transition={{ duration: 1.1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--theme-primary)" />
                  <stop offset="100%" stopColor="var(--theme-secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-3xl font-bold tracking-tight">{accuracy}<span className="text-lg text-muted-foreground">%</span></span>
            </div>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"><Target className="h-3.5 w-3.5 text-emerald-500" /> {accuracy >= 95 ? 'Excellent' : accuracy >= 90 ? 'Great' : accuracy >= 80 ? 'Good' : 'Keep practicing'}</div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="rounded-[20px] border bg-card p-4">
        <h3 className="px-1 text-sm font-semibold">Detailed stats</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatBox label="Raw WPM" value={rawWpm} />
          <StatBox label="Net WPM" value={wpm} />
          <StatBox label="Accuracy" value={`${accuracy}%`} />
          <StatBox label="Errors" value={errors} />
          <StatBox label="Correct" value={correctChars} highlight="green" />
          <StatBox label="Duration" value={`${duration}s`} />
        </div>
      </div>

      {/* Character breakdown */}
      <div className="rounded-[20px] border bg-card p-4">
        <h3 className="text-sm font-semibold">Character breakdown</h3>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted flex">
          <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${(correctChars / safeTotal) * 100}%` }} />
          <div className="bg-red-500 transition-all duration-700" style={{ width: `${(incorrectChars / safeTotal) * 100}%` }} />
          <div className="bg-zinc-400 transition-all duration-700" style={{ width: `${(missedChars / safeTotal) * 100}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Correct {correctChars}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Incorrect {incorrectChars}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-zinc-400" /> Missed {missedChars}</span>
        </div>
      </div>

      {(isFeedbackLoading || aiFeedback) && (
        <div className="rounded-[20px] border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[var(--theme-primary)]" /> AI Feedback</div>
          {isFeedbackLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing your performance…</div>
          ) : aiFeedback ? (
            <p className="mt-2 text-sm leading-6 text-foreground/90">{aiFeedback}</p>
          ) : null}
        </div>
      )}

      {mistakes.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setShowDetailedAnalysis(true)} className="gap-2 rounded-full">
            <BarChart3 className="h-4 w-4" /> View detailed analysis
          </Button>
        </div>
      )}

      {footer && <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">{footer}</div>}
    </motion.div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: 'green' | 'red' }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-3 text-center">
      <div className="text-[11px] tracking-widest text-muted-foreground">{label.toUpperCase()}</div>
      <div className={cn('mt-1 text-xl font-bold tabular-nums', highlight === 'green' && 'text-emerald-500', highlight === 'red' && 'text-red-500')}>{value}</div>
    </div>
  );
}
