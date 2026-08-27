'use client';

import { motion } from 'framer-motion';
import { Medal, Crown, TrendingUp, RefreshCw, Users, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { gameAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

type LeaderboardEntry = { rank: number; userId: string; username: string | null; score: number; wpm: number | null; accuracy: number | null; duration: number | null; createdAt: string; };

const GAME_TABS = [
  { value: 'WORD_BLITZ', label: 'Word Blitz' },
  { value: 'PROMPT_DASH', label: 'Prompt Dash' },
  { value: 'STORY_CHAIN', label: 'Story Chain' },
] as const;
type GameTab = (typeof GAME_TABS)[number]['value'];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-zinc-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

export default function LeaderboardPage() {
  const [gameType, setGameType] = useState<GameTab>('WORD_BLITZ');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [globalAvg, setGlobalAvg] = useState<{ wpm: number; accuracy: number; totalTests: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (type: GameTab) => {
    setLoading(true); setError(null);
    try {
      const res = await gameAPI.getLeaderboard(type);
      setEntries(res.data?.leaderboard ?? []);
      setGlobalAvg(res.data?.globalAvg ?? null);
    }
    catch { setError('Could not load the leaderboard. Please try again later.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchLeaderboard(gameType); }, [gameType, fetchLeaderboard]);

  return (
    <div className="pb-10 pt-6 md:pt-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Users className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> Global Leaderboard
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Top typists <span className="text-gradient">worldwide</span></h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Compete across three games. Rankings are per-game and update live.</p>
        </motion.div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {GAME_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setGameType(tab.value)}
              disabled={loading}
              aria-pressed={gameType === tab.value}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-ring ${gameType === tab.value ? 'bg-foreground text-background shadow-sm' : 'border bg-card hover:bg-accent'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {globalAvg && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border bg-card/60 p-4 text-center">
              <div className="text-xs tracking-widest text-muted-foreground">GLOBAL AVG WPM</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{globalAvg.wpm}</div>
            </div>
            <div className="rounded-2xl border bg-card/60 p-4 text-center">
              <div className="text-xs tracking-widest text-muted-foreground">GLOBAL AVG ACCURACY</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{globalAvg.accuracy}%</div>
            </div>
            <div className="rounded-2xl border bg-card/60 p-4 text-center">
              <div className="text-xs tracking-widest text-muted-foreground">TYPING TESTS</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{globalAvg.totalTests.toLocaleString()}</div>
            </div>
          </div>
        )}
        {globalAvg && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Beat the global average to join the top typists. Every test counts.</p>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.1 }} className="mt-6 overflow-hidden rounded-[20px] border bg-card/60 backdrop-blur-xl shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold tracking-widest text-muted-foreground border-b bg-muted/30">
            <div className="col-span-1">RANK</div><div className="col-span-5">PLAYER</div><div className="col-span-2">SCORE</div><div className="col-span-2">WPM</div><div className="col-span-2">ACC</div>
          </div>

          {error && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={() => void fetchLeaderboard(gameType)} className="mt-4 rounded-full gap-2"><RefreshCw className="h-4 w-4" /> Retry</Button>
            </div>
          )}
          {!error && loading && <div className="px-6 py-10 text-center text-sm text-muted-foreground">Loading leaderboard…</div>}
          {!error && !loading && entries.length === 0 && <div className="px-6 py-10 text-center text-sm text-muted-foreground">No scores yet. Be the first to set a record! <Sparkles className="inline h-4 w-4" /></div>}

          {!error && !loading && entries.map((e) => (
            <motion.div
              key={`${gameType}-${e.userId}-${e.rank}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.02 * e.rank }}
              className={`grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-5 py-3.5 border-b border-border/50 hover:bg-accent/50 transition ${e.rank <= 3 ? 'bg-gradient-to-r from-[var(--theme-primary)]/10 to-transparent' : ''}`}
            >
              <div className="col-span-2 md:col-span-1 flex items-center">{getRankIcon(e.rank)}</div>
              <div className="col-span-5 flex items-center min-w-0"><span className="truncate text-sm font-semibold">{e.username || 'Anonymous'}</span></div>
              <div className="col-span-5 md:col-span-2 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-[var(--theme-primary)] hidden md:block" /><span className="text-sm font-bold tabular-nums">{e.score.toLocaleString()}</span></div>
              <div className="hidden md:flex col-span-2 items-center text-sm tabular-nums">{e.wpm ?? '—'}</div>
              <div className="hidden md:flex col-span-2 items-center text-sm tabular-nums">{e.accuracy != null ? `${Math.round(e.accuracy)}%` : '—'}</div>
              {/* mobile secondary line */}
              <div className="col-span-12 md:hidden flex gap-3 text-xs text-muted-foreground -mt-1">
                <span>WPM {e.wpm ?? '—'}</span><span>Acc {e.accuracy != null ? `${Math.round(e.accuracy)}%` : '—'}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
