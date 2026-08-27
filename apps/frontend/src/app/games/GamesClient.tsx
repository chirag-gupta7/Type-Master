'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Zap, Feather, Link2, Lock, Play, Trophy, Clock, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/games';
import { useRouter } from 'next/navigation';
import { gameAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

const WordBlitz = dynamic(() => import('@/components/games/WordBlitz').then((m) => ({ default: m.WordBlitz })), { loading: () => <GameLoading />, ssr: false });
const PromptDash = dynamic(() => import('@/components/games/PromptDash').then((m) => ({ default: m.PromptDash })), { loading: () => <GameLoading />, ssr: false });
const StoryChain = dynamic(() => import('@/components/games/StoryChain').then((m) => ({ default: m.StoryChain })), { loading: () => <GameLoading />, ssr: false });

function GameLoading() { return <div className="flex items-center justify-center min-h-[400px] text-sm text-muted-foreground">Loading game…</div>; }

const GAMES = [
  { id: 'word-blitz' as const, title: 'Word Blitz', desc: 'Falling words, fast fingers. Clear words before they hit the bottom.', icon: Zap, gradient: 'from-blue-500 to-cyan-400', accent: 'bg-blue-500', time: '60s', difficulty: 'Easy' },
  { id: 'prompt-dash' as const, title: 'Prompt Dash', desc: '60-second creative sprint with AI prompts and live WPM scoring.', icon: Feather, gradient: 'from-violet-500 to-fuchsia-500', accent: 'bg-violet-500', time: '60s', difficulty: 'Medium' },
  { id: 'story-chain' as const, title: 'Story Chain', desc: 'Co-write with AI, one sentence at a time. How far can you go in 3 minutes?', icon: Link2, gradient: 'from-emerald-500 to-teal-500', accent: 'bg-emerald-500', time: '3m', difficulty: 'Hard' },
];

export default function GamesClient() {
  const router = useRouter();
  const { currentGame, setCurrentGame, gamesPlayed, isGuest, backendGamesPlayed, backendHighScores, setBackendStats, hydrateGuestGamesPlayed } = useGameStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const setGuestMode = useGameStore((s) => s.setGuestMode);
  const highScore = useGameStore((s) => s.highScore);
  const callbackUrl = useMemo(() => '/games', []);

  useEffect(() => {
    const determineMode = () => {
      const hasToken = Boolean(localStorage.getItem('accessToken'));
      setGuestMode(!hasToken);
      hydrateGuestGamesPlayed();
    };
    determineMode();
    window.addEventListener('storage', determineMode);
    return () => window.removeEventListener('storage', determineMode);
  }, [setGuestMode, hydrateGuestGamesPlayed]);

  useEffect(() => {
    if (isGuest) return;
    const fetchStats = async () => {
      try {
        const res = await gameAPI.getStats();
        if (!res?.success || !res.data) return;
        const highs: Record<'word-blitz' | 'prompt-dash' | 'story-chain', number> = { 'word-blitz': 0, 'prompt-dash': 0, 'story-chain': 0 };
        res.data.gameStats.forEach((stat) => {
          const key = stat.gameType.toLowerCase().replace('_', '-') as 'word-blitz' | 'prompt-dash' | 'story-chain';
          if (highs[key] !== undefined) highs[key] = Math.max(highs[key], stat.bestScore);
        });
        setBackendStats({ totalGamesPlayed: res.data.totalGamesPlayed, highs });
      } catch { /* ignore */ }
    };
    fetchStats();
  }, [isGuest, setBackendStats]);

  const handleGameSelect = (gameId: (typeof GAMES)[number]['id']) => {
    if (isGuest && gamesPlayed >= 1) { setShowLoginModal(true); return; }
    setCurrentGame(gameId);
  };

  if (currentGame === 'word-blitz') return <div className="min-h-[60vh] pt-6"><WordBlitz /></div>;
  if (currentGame === 'prompt-dash') return <div className="min-h-[60vh] pt-6"><PromptDash /></div>;
  if (currentGame === 'story-chain') return <div className="min-h-[60vh] pt-6"><StoryChain /></div>;

  return (
    <div className="pb-10 pt-6 md:pt-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <Play className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> Typing Games • Playful practice
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Make practice <span className="text-gradient">fun</span></h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">Three focused games that build speed, flow, and creativity — with leaderboards and progress that carry over.</p>
          {isGuest && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"><Lock className="h-3.5 w-3.5" /> Guest: 1 free game — sign in for unlimited</p>}
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {GAMES.map((game, index) => {
            const Icon = game.icon;
            const isLocked = isGuest && gamesPlayed >= 1;
            return (
              <motion.div key={game.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.06 }} whileHover={{ y: isLocked ? 0 : -4 }} className="group">
                <button
                  onClick={() => handleGameSelect(game.id)}
                  disabled={isLocked}
                  aria-label={`Play ${game.title}`}
                  className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px] border bg-card/70 p-5 text-left backdrop-blur transition hover:bg-card disabled:opacity-60 text-foreground focus-ring"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-[0.08] transition`} aria-hidden />
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${game.gradient} text-white shadow-sm`}>
                    {isLocked ? <Lock className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{game.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2">{game.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 font-medium"><Clock className="h-3 w-3" /> {game.time}</span>
                    <span className={`rounded-full px-2.5 py-1 font-semibold text-white ${game.accent}`}>{game.difficulty}</span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--theme-primary)]">Play <Play className="h-3.5 w-3.5" /></span>
                  {isLocked && <div className="mt-3 text-xs font-medium text-amber-600">🔒 Sign in to unlock</div>}
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mt-8 rounded-[20px] border bg-card/60 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4 text-amber-500" /> Your stats</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-2xl font-bold">{backendGamesPlayed || gamesPlayed}</div><div className="text-xs tracking-widest text-muted-foreground">PLAYED</div></div>
            <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-2xl font-bold">{Math.max(highScore || 0, backendHighScores['word-blitz'], backendHighScores['prompt-dash'], backendHighScores['story-chain'])}</div><div className="text-xs tracking-widest text-muted-foreground">BEST SCORE</div></div>
            <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-2xl font-bold flex items-center justify-center gap-1"><Sparkles className="h-4 w-4 text-[var(--theme-primary)]" /> —</div><div className="text-xs tracking-widest text-muted-foreground">RANK</div></div>
          </div>
        </motion.div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-[20px] border bg-card p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600"><Lock className="h-6 w-6" /></div>
            <h2 className="mt-4 text-center text-xl font-bold">Unlock unlimited games</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">You&apos;ve used your free game. Sign in to keep playing and save progress.</p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={() => setShowLoginModal(false)} className="rounded-full">Cancel</Button>
              <Button variant="primary" onClick={() => { setShowLoginModal(false); router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`); }} className="rounded-full">Sign in</Button>
              <Button variant="outline" onClick={() => { setShowLoginModal(false); router.push(`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`); }} className="rounded-full">Create account</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
