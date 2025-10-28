'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Zap, Feather, Link2, Lock, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/games';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Lazy load game components
const WordBlitz = dynamic(
  () => import('@/components/games/WordBlitz').then((mod) => ({ default: mod.WordBlitz })),
  {
    loading: () => <GameLoading />,
    ssr: false,
  }
);

const PromptDash = dynamic(
  () => import('@/components/games/PromptDash').then((mod) => ({ default: mod.PromptDash })),
  {
    loading: () => <GameLoading />,
    ssr: false,
  }
);

const StoryChain = dynamic(
  () => import('@/components/games/StoryChain').then((mod) => ({ default: mod.StoryChain })),
  {
    loading: () => <GameLoading />,
    ssr: false,
  }
);

function GameLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-lg text-muted-foreground">Loading game...</div>
    </div>
  );
}

const GAMES = [
  {
    id: 'word-blitz' as const,
    title: 'Word Blitz',
    description:
      'Type the falling words as fast as you can to score points. A classic test of speed.',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-400',
    difficulty: 'Easy',
  },
  {
    id: 'prompt-dash' as const,
    title: 'Prompt Dash',
    description:
      'A 60-second creative sprint. Write as much as you can based on a random prompt. Score is your WPM.',
    icon: Feather,
    gradient: 'from-purple-500 to-pink-500',
    difficulty: 'Medium',
  },
  {
    id: 'story-chain' as const,
    title: 'Story Chain',
    description:
      'Build a story with an AI, one sentence at a time. How many sentences can you add in 3 minutes?',
    icon: Link2,
    gradient: 'from-green-500 to-lime-400',
    difficulty: 'Hard',
  },
];

export default function GamesClient() {
  const router = useRouter();
  const { status } = useSession();
  const { currentGame, setCurrentGame, gamesPlayed, isGuest, incrementGamesPlayed } =
    useGameStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const setGuestMode = useGameStore((s) => s.setGuestMode);

  const callbackUrl = useMemo(() => '/games', []);

  useEffect(() => {
    if (status === 'authenticated') {
      setGuestMode(false);
    }

    if (status === 'unauthenticated') {
      setGuestMode(true);
    }
  }, [setGuestMode, status]);

  const handleGameSelect = (gameId: (typeof GAMES)[number]['id']) => {
    if (isGuest && gamesPlayed >= 1) {
      setShowLoginModal(true);
      return;
    }

    if (isGuest) {
      incrementGamesPlayed();
    }

    setCurrentGame(gameId);
  };

  if (currentGame === 'word-blitz') return <WordBlitz />;
  if (currentGame === 'prompt-dash') return <PromptDash />;
  if (currentGame === 'story-chain') return <StoryChain />;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[var(--theme-primary)]/10 px-4 py-2 rounded-full mb-4">
            <Play className="w-5 h-5 text-[var(--theme-primary)]" />
            <span className="text-sm font-medium text-[var(--theme-primary)]">Typing Games</span>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-transparent">
            Make Practice Fun
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Challenge yourself with engaging typing games designed to improve speed and accuracy
          </p>

          {isGuest && (
            <p className="mt-4 text-sm text-yellow-400">
              ⚡ Guest mode: You can play 1 game. Login for unlimited access!
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {GAMES.map((game, index) => {
            const Icon = game.icon;
            const isLocked = isGuest && gamesPlayed >= 1;

            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: isLocked ? 1 : 1.05, y: isLocked ? 0 : -8 }}
                whileTap={{ scale: isLocked ? 1 : 0.98 }}
              >
                <button
                  onClick={() => handleGameSelect(game.id)}
                  disabled={isLocked}
                  className="w-full h-full bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {isLocked ? (
                        <Lock className="w-8 h-8 text-white" />
                      ) : (
                        <Icon className="w-8 h-8 text-white" />
                      )}
                    </div>

                    <h3 className="text-2xl font-bold mb-2 text-foreground">{game.title}</h3>

                    <p className="text-muted-foreground text-sm mb-4">{game.description}</p>

                    <span className="inline-block px-3 py-1 bg-background/50 rounded-full text-xs font-medium">
                      {game.difficulty}
                    </span>

                    {isLocked && (
                      <div className="mt-4 text-xs text-yellow-400">🔒 Login to unlock</div>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--theme-primary)]">{gamesPlayed}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--theme-secondary)]">0</div>
              <div className="text-sm text-muted-foreground">High Scores</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--theme-accent)]">-</div>
              <div className="text-sm text-muted-foreground">Rank</div>
            </div>
          </div>
        </motion.div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-8 max-w-md mx-4 text-center"
          >
            <Lock className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-2xl font-bold mb-2">Unlock Unlimited Games</h2>
            <p className="text-muted-foreground mb-6">
              You've played your free game! Login to unlock unlimited access to all typing games.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 px-6 py-3 bg-background/50 border border-border rounded-xl hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white rounded-xl hover:shadow-lg transition-shadow"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                }}
                className="flex-1 px-6 py-3 bg-card/40 border border-border rounded-xl hover:bg-muted transition-shadow"
              >
                Sign Up
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
