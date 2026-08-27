'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, CornerDownLeft, ArrowLeft, Loader2, Sparkles, Trophy, BookOpen, Wand2 } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { motion } from 'framer-motion';

const FALLBACK_STARTERS = [
  'The dusty old book fell from the shelf, opening to a strange map.',
  'A single red light blinked on the abandoned console.',
  'The alley was empty, except for a cat with unusual green eyes.',
];
const FALLBACK_RESPONSES = [
  'Suddenly, a loud noise echoed from the floor above.',
  'But they had a strange feeling they were being watched.',
  'It was unlike anything they had ever seen before.',
  'A hidden door creaked open in the shadows.',
  'They knew at that moment, nothing would be the same.',
];

export function StoryChain() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [story, setStory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [timer, setTimer] = useState(180);
  const [score, setScore] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const setHighScore = useGameStore((s) => s.setHighScore);
  const incrementGamesPlayed = useGameStore((s) => s.incrementGamesPlayed);
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const previousFeedback = useGameStore((s) => s.lastWritingFeedback['story-chain'] || null);
  const setWritingFeedback = useGameStore((s) => s.setWritingFeedback);
  const highScore = useGameStore((s) => s.highScores['story-chain'] || 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const storyEndRef = useRef<HTMLDivElement>(null);

  const generateWritingFeedback = useCallback(async (storySentences: string[], priorFeedback: string | null) => {
    const userSentences = storySentences.filter((_, i) => i % 2 === 1);
    const combined = userSentences.join(' ').trim();
    if (!combined) { setAiFeedback('Add more of your story next time to unlock detailed guidance.'); setWritingFeedback('story-chain', null); return; }
    setIsFeedbackLoading(true);
    try {
      const data = await aiAPI.getWritingFeedback({ text: combined, type: 'story-chain', priorFeedback });
      if (data.feedback) { setAiFeedback(data.feedback); setWritingFeedback('story-chain', data.feedback); }
      else { setAiFeedback('The storytelling coach could not review this round. Try another story.'); setWritingFeedback('story-chain', null); }
    } catch { setAiFeedback('Something went wrong while generating feedback. Please try again later.'); }
    finally { setIsFeedbackLoading(false); }
  }, [setWritingFeedback]);

  const getAiResponse = async (currentStory: string[]): Promise<string> => {
    try {
      const data = await aiAPI.getStoryResponse(currentStory);
      if (data.response) return data.response;
      if (currentStory.length === 0) return FALLBACK_STARTERS[Math.floor(Math.random() * FALLBACK_STARTERS.length)];
      return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    } catch {
      if (currentStory.length === 0) return FALLBACK_STARTERS[Math.floor(Math.random() * FALLBACK_STARTERS.length)];
      return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    }
  };

  const startGame = async () => {
    setIsStarting(true);
    const first = await getAiResponse([]);
    setStory([first]); setUserInput(''); setTimer(180); setScore(0); setGameState('running'); setAiFeedback(null); setIsFeedbackLoading(false);
    setIsStarting(false);
  };

  const stopGame = () => {
    setGameState('finished');
    if (score > highScore) setHighScore('story-chain', score);
    incrementGamesPlayed('story-chain');
    generateWritingFeedback(story, previousFeedback);
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim() || isAiThinking) return;
    const next = userInput.trim();
    setUserInput(''); setIsAiThinking(true);
    const aiResponse = await getAiResponse([...story, next]);
    setStory([...story, next, aiResponse]); setScore((s) => s + 1); setIsAiThinking(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (gameState === 'running') {
      inputRef.current?.focus();
      timerInterval.current = setInterval(() => setTimer((t) => { if (t <= 1) { clearInterval(timerInterval.current!); stopGame(); return 0; } return t - 1; }), 1000);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [gameState]);

  useEffect(() => { storyEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [story]);

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center p-6 md:p-8 bg-card/70 backdrop-blur-xl border rounded-[24px] shadow-xl w-full max-w-3xl mx-auto">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg"><Trophy className="h-7 w-7" /></div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Story complete!</h2>
          <p className="text-sm text-muted-foreground">Story Chain • 3 minutes</p>
        </motion.div>
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-xs tracking-widest text-muted-foreground">SENTENCES</div><div className="text-3xl font-bold">{score}</div></div>
          <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-xs tracking-widest text-muted-foreground">BEST</div><div className="text-3xl font-bold">{Math.max(score, highScore)}</div></div>
        </div>
        {(isFeedbackLoading || aiFeedback) && (
          <div className="mt-6 w-full rounded-2xl border bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-[var(--theme-primary)]" /> AI Story Coach</div>
            {isFeedbackLoading ? <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reviewing your story…</div> : aiFeedback ? <p className="mt-2 text-sm leading-6">{aiFeedback}</p> : null}
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><BookOpen className="h-6 w-6" /></div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">Story Chain</h2>
          <p className="mt-1 text-center text-sm leading-6 text-muted-foreground max-w-lg">Co-write a story with AI, one sentence at a time. You have 3 minutes — add as many sentences as you can.</p>
          <div className="mt-4 grid w-full gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2"><Wand2 className="h-4 w-4 text-emerald-500" /> AI starts, you continue</div>
            <div className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2"><Timer className="h-4 w-4 text-muted-foreground" /> 3 minutes • alternating sentences</div>
          </div>
          <Button onClick={startGame} variant="primary" size="lg" className="mt-6 rounded-full px-8" disabled={isStarting}>
            {isStarting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is starting the story…</> : 'Start game'}
          </Button>
        </>
      ) : (
        <>
          <div className="flex w-full items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"><Timer className="h-3.5 w-3.5" /> {timer}s</span>
            <span className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium">Your sentences {score}</span>
          </div>
          <div className="mt-4 w-full h-[320px] overflow-y-auto rounded-2xl border bg-background/60 p-4 flex flex-col gap-2">
            {story.map((sentence, index) => (
              <div key={index} className={index % 2 === 0 ? 'rounded-2xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground' : 'rounded-2xl bg-foreground px-3 py-2 text-sm text-background'}>
                <span className="text-xs font-semibold tracking-widest opacity-70">{index % 2 === 0 ? 'AI' : 'YOU'}</span>
                <p className="mt-1 leading-6">{sentence}</p>
              </div>
            ))}
            {isAiThinking && <p className="flex items-center gap-2 text-sm italic text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> AI is thinking…</p>}
            <div ref={storyEndRef} />
          </div>
          <form onSubmit={handleUserSubmit} className="mt-4 flex w-full gap-2">
            <label htmlFor="story-input" className="sr-only">Next sentence</label>
            <input id="story-input" ref={inputRef} value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={isAiThinking} className="flex-1 rounded-2xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" placeholder={isAiThinking ? 'AI is writing…' : 'Type the next sentence…'} />
            <Button type="submit" size="icon" aria-label="Submit sentence" disabled={isAiThinking} className="rounded-2xl h-[44px] w-[44px]"><CornerDownLeft className="h-4 w-4" /></Button>
          </form>
        </>
      )}
    </div>
  );
}
