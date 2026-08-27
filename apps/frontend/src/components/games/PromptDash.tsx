'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, ArrowLeft, Loader2, Sparkles, Trophy, Feather, Wand2 } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { motion } from 'framer-motion';

const FALLBACK_PROMPTS = [
  'Describe a city hidden in the clouds.',
  'The ancient artifact began to glow...',
  'My pet suddenly started talking. It said...',
  'Write about a world where music is illegal.',
  'The last dragon on Earth was just a rumor, until today.',
  'A time traveler arrived, but their machine was broken.',
];

export const computeLiveWpm = (charCount: number, secondsElapsed: number): number =>
  secondsElapsed > 0 ? Math.round(charCount / 5 / (secondsElapsed / 60)) : 0;

export function PromptDash() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const setHighScore = useGameStore((s) => s.setHighScore);
  const incrementGamesPlayed = useGameStore((s) => s.incrementGamesPlayed);
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const previousFeedback = useGameStore((s) => s.lastWritingFeedback['prompt-dash'] || null);
  const setWritingFeedback = useGameStore((s) => s.setWritingFeedback);
  const highScore = useGameStore((s) => s.highScores['prompt-dash'] || 0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const generateWritingFeedback = useCallback(
    async (writtenText: string, priorFeedback: string | null) => {
      const cleaned = writtenText.trim();
      if (!cleaned) { setAiFeedback('Add more writing next time to unlock personalized feedback.'); setWritingFeedback('prompt-dash', null); return; }
      setIsFeedbackLoading(true);
      try {
        const data = await aiAPI.getWritingFeedback({ text: cleaned, type: 'prompt-dash', priorFeedback });
        if (data.feedback) { setAiFeedback(data.feedback); setWritingFeedback('prompt-dash', data.feedback); }
        else { setAiFeedback('The AI coach could not generate feedback this round. Try another prompt.'); setWritingFeedback('prompt-dash', null); }
      } catch { setAiFeedback('Something went wrong while generating feedback. Please try again later.'); }
      finally { setIsFeedbackLoading(false); }
    }, [setWritingFeedback]
  );

  const generateNewPrompt = async () => {
    setIsLoading(true);
    try {
      const data = await aiAPI.generateWritingPrompt();
      setPrompt(data.prompt ?? FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]);
    } catch { setPrompt(FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]); }
    finally { setIsLoading(false); }
  };

  const startGame = async () => {
    await generateNewPrompt();
    setText(''); setTimer(60); setScore(0); setGameState('running'); setAiFeedback(null); setIsFeedbackLoading(false);
    setTimeout(() => textAreaRef.current?.focus(), 50);
  };

  const stopGame = () => {
    setGameState('finished');
    const wpm = Math.round(text.length / 5);
    setScore(wpm);
    if (wpm > highScore) setHighScore('prompt-dash', wpm);
    incrementGamesPlayed('prompt-dash');
    generateWritingFeedback(text, previousFeedback);
  };

  useEffect(() => {
    if (gameState === 'running') {
      textAreaRef.current?.focus();
      timerInterval.current = setInterval(() => {
        setTimer((t) => { if (t <= 1) { clearInterval(timerInterval.current!); stopGame(); return 0; } return t - 1; });
      }, 1000);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [gameState]);

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center p-6 md:p-8 bg-card/70 backdrop-blur-xl border rounded-[24px] shadow-xl w-full max-w-3xl mx-auto">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg"><Trophy className="h-7 w-7" /></div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Time&apos;s up!</h2>
          <p className="text-sm text-muted-foreground">Prompt Dash • 60 seconds</p>
        </motion.div>
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-xs tracking-widest text-muted-foreground">WPM</div><div className="text-3xl font-bold">{score}</div></div>
          <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-xs tracking-widest text-muted-foreground">BEST</div><div className="text-3xl font-bold">{Math.max(score, highScore)}</div></div>
        </div>
        {(isFeedbackLoading || aiFeedback) && (
          <div className="mt-6 w-full rounded-2xl border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[var(--theme-primary)]" /> AI Writing Coach</div>
            {isFeedbackLoading ? <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reviewing your writing…</div> : aiFeedback ? <p className="mt-2 text-sm leading-6">{aiFeedback}</p> : null}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Button onClick={startGame} variant="primary" size="lg" className="rounded-full">Play again</Button>
          <Button onClick={() => setCurrentGame(null)} variant="outline" size="lg" className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" /> Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 md:p-6 bg-card/70 backdrop-blur-xl border rounded-[24px] shadow-xl w-full max-w-3xl mx-auto">
      {gameState === 'idle' ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"><Feather className="h-6 w-6" /></div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">Prompt Dash</h2>
          <p className="mt-1 text-center text-sm leading-6 text-muted-foreground max-w-lg">A 60-second creative sprint. You&apos;ll get a prompt — write as much as you can. Your score is WPM, then an AI coach gives feedback.</p>
          <div className="mt-4 grid w-full gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2"><Wand2 className="h-4 w-4 text-violet-500" /> AI-generated prompt each run</div>
            <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2"><Timer className="h-4 w-4 text-muted-foreground" /> 60 seconds • keep the flow going</div>
          </div>
          <Button onClick={startGame} variant="primary" size="lg" className="mt-6 rounded-full px-8" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating prompt…</> : 'Start game'}
          </Button>
        </>
      ) : (
        <>
          <div className="flex w-full items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"><Timer className="h-3.5 w-3.5" /> {timer}s</span>
            <span className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium">WPM {computeLiveWpm(text.length, 60 - timer)}</span>
          </div>
          <div className="mt-4 w-full rounded-2xl border bg-gradient-to-br from-violet-500/10 via-background to-fuchsia-500/10 p-4">
            <div className="text-xs tracking-widest text-muted-foreground">PROMPT</div>
            <p className="mt-1 text-center text-base font-medium italic">&ldquo;{prompt}&rdquo;</p>
          </div>
          <label className="mt-4 w-full text-sm font-medium" htmlFor="promptdash-input">Your writing</label>
          <textarea
            id="promptdash-input"
            ref={textAreaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1 w-full h-64 rounded-2xl border bg-background p-4 text-[15px] leading-6 focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Start writing… let the prompt guide you."
            aria-label="Prompt Dash writing area"
          />
          <div className="mt-2 flex w-full items-center justify-between text-xs text-muted-foreground">
            <span>{text.length} characters • {text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
            <span className="hidden sm:inline">Auto-saves for AI feedback at the end.</span>
          </div>
        </>
      )}
    </div>
  );
}
