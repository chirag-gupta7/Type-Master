'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'SpeedDemon', wpm: 152, accuracy: 99, tests: 1247 },
  { rank: 2, name: 'TypingNinja', wpm: 148, accuracy: 98, tests: 892 },
  { rank: 3, name: 'KeyboardWarrior', wpm: 145, accuracy: 99, tests: 1104 },
  { rank: 4, name: 'FastFingers', wpm: 142, accuracy: 97, tests: 756 },
  { rank: 5, name: 'QuickType', wpm: 138, accuracy: 98, tests: 634 },
  { rank: 6, name: 'RapidTyper', wpm: 135, accuracy: 96, tests: 523 },
  { rank: 7, name: 'SwiftKeys', wpm: 132, accuracy: 97, tests: 478 },
  { rank: 8, name: 'LightningHands', wpm: 130, accuracy: 95, tests: 412 },
  { rank: 9, name: 'TypeMaster Pro', wpm: 128, accuracy: 98, tests: 389 },
  { rank: 10, name: 'FlashTyper', wpm: 125, accuracy: 96, tests: 345 },
];

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
            <span className="text-sm font-medium text-[var(--theme-primary)]">Global Leaderboard</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-transparent">
            Top Typists Worldwide
          </h1>
          <p className="text-lg text-muted-foreground">
            Compete with the fastest typists around the globe
          </p>
        </motion.div>

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
            <div className="col-span-2">WPM</div>
            <div className="col-span-2">Accuracy</div>
            <div className="col-span-3">Tests</div>
          </div>

          {/* Leaderboard Entries */}
          {MOCK_LEADERBOARD.map((entry, index) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
              className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 hover:bg-[var(--theme-primary)]/5 transition-colors ${
                entry.rank <= 3 ? 'bg-gradient-to-r from-[var(--theme-primary)]/10 to-transparent' : ''
              }`}
            >
              <div className="col-span-1 flex items-center">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="col-span-4 flex items-center">
                <span className="font-semibold text-foreground">{entry.name}</span>
              </div>
              
              <div className="col-span-2 flex items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--theme-accent)]" />
                  <span className="text-lg font-bold text-[var(--theme-primary)]">{entry.wpm}</span>
                </div>
              </div>
              
              <div className="col-span-2 flex items-center">
                <span className="text-foreground">{entry.accuracy}%</span>
              </div>
              
              <div className="col-span-3 flex items-center">
                <span className="text-muted-foreground">{entry.tests.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">
            Your current rank: <span className="font-semibold text-foreground">#247</span>
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white font-semibold rounded-xl hover:shadow-lg transition-shadow">
            Take a Test to Improve Your Rank
          </button>
        </motion.div>
      </div>
    </div>
  );
}
