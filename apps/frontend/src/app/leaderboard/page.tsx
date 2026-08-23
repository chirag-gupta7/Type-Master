'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { gameAPI } from '@/lib/api';

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string | null;
  score: number;
  wpm: number | null;
  accuracy: number | null;
  duration: number | null;
  createdAt: string;
};

const GAME_TABS = [
  { value: 'WORD_BLITZ', label: 'Word Blitz' },
  { value: 'PROMPT_DASH', label: 'Prompt Dash' },
  { value: 'STORY_CHAIN', label: 'Story Chain' },
] as const;

type GameTab = (typeof GAME_TABS)[number]['value'];

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-400" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />;
    case 3:
      return <Medal className="w-6 h-6 text-amber-600" />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
}

export default function LeaderboardPage() {
  const [gameType, setGameType] = useState<GameTab>('WORD_BLITZ');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (type: GameTab) => {
    setLoading(true);
    setError(null);

    try {
      const response = await gameAPI.getLeaderboard(type);
      setEntries(response.data?.leaderboard ?? []);
    } catch {
      setError('Could not load the leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeaderboard(gameType);
  }, [gameType, fetchLeaderboard]);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[var(--theme-primary)]/10 px-4 py-2 rounded-full mb-4">
            <Trophy className="w-5 h-5 text-[var(--theme-primary)]" />
            <span className="text-sm font-medium text-[var(--theme-primary)]">
              Global Leaderboard
            </span>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-transparent">
            Top Typists Worldwide
          </h1>
          <p className="text-lg text-muted-foreground">
            Compete with the fastest typists around the globe
          </p>
        </motion.div>

        {/* Game type selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {GAME_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setGameType(tab.value)}
              disabled={loading}
              aria-pressed={gameType === tab.value}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                gameType === tab.value
                  ? 'bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white shadow-lg'
                  : 'bg-card/40 backdrop-blur-xl border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl overflow-hidden shadow-xl"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-card/60 border-b border-border text-sm font-semibold text-muted-foreground">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-3">Score</div>
            <div className="col-span-2">Best WPM</div>
            <div className="col-span-2">Accuracy</div>
          </div>

          {error && (
            <div className="px-6 py-10 text-center text-sm text-red-400">
              {error}
              <button
                onClick={() => void fetchLeaderboard(gameType)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {!error && loading && (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              Loading leaderboard...
            </div>
          )}

          {!error && !loading && entries.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No scores yet. Be the first to set a record!
            </div>
          )}

          {!error &&
            !loading &&
            entries.map((entry) => (
              <motion.div
                key={`${gameType}-${entry.userId}-${entry.rank}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * entry.rank }}
                className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-[var(--theme-primary)]/5 transition-colors ${
                  entry.rank <= 3
                    ? 'bg-gradient-to-r from-[var(--theme-primary)]/10 to-transparent'
                    : ''
                }`}
              >
                <div className="col-span-1 flex items-center">{getRankIcon(entry.rank)}</div>

                <div className="col-span-4 flex items-center">
                  <span className="font-semibold text-foreground truncate">
                    {entry.username || 'Anonymous'}
                  </span>
                </div>

                <div className="col-span-3 flex items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--theme-accent)]" />
                    <span className="text-lg font-bold text-[var(--theme-primary)]">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="text-foreground">{entry.wpm ?? '-'}</span>
                </div>

                <div className="col-span-2 flex items-center">
                  <span className="text-foreground">
                    {entry.accuracy != null ? `${Math.round(entry.accuracy)}%` : '-'}
                  </span>
                </div>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </div>
  );
}
