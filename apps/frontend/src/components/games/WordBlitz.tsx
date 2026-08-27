'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, ArrowLeft, Zap, Trophy, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WORDS = ['the','be','to','of','and','a','in','that','have','I','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us'];

type Word = { id: number; text: string; x: number; y: number; };

export function WordBlitz() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [words, setWords] = useState<Word[]>([]);
  const wordsRef = useRef<Word[]>([]);
  const nextWordIdRef = useRef(0);
  const applyWords = useCallback((fn: (prev: Word[]) => Word[]) => {
    const next = fn(wordsRef.current);
    wordsRef.current = next;
    setWords(next);
  }, []);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timer, setTimer] = useState(60);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const addInterval = useRef<NodeJS.Timeout | null>(null);
  const fallInterval = useRef<NodeJS.Timeout | null>(null);
  const setHighScore = useGameStore((s) => s.setHighScore);
  const incrementGamesPlayed = useGameStore((s) => s.incrementGamesPlayed);
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const highScore = useGameStore((s) => s.highScores['word-blitz'] || 0);

  const addWord = () => {
    if (!gameAreaRef.current) return;
    const gameWidth = gameAreaRef.current.offsetWidth;
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    applyWords((cur) => [...cur, { id: nextWordIdRef.current++, text: newWord, x: Math.random() * (gameWidth - 80), y: 0 }]);
  };

  const startGame = () => {
    setGameState('running');
    applyWords(() => []);
    setInputValue(''); setScore(0); setCombo(0); setTimer(60);
    addInterval.current = setInterval(addWord, 1050);
    fallInterval.current = setInterval(() => {
      applyWords((cur) => cur.map((w) => ({ ...w, y: w.y + 2.2 })).filter((w) => w.y < 400));
    }, 42);
    timerInterval.current = setInterval(() => {
      setTimer((t) => { if (t <= 1) { stopGame(); return 0; } return t - 1; });
    }, 1000);
  };

  const stopGame = () => {
    setGameState('finished');
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (addInterval.current) clearInterval(addInterval.current);
    if (fallInterval.current) clearInterval(fallInterval.current);
    if (score > highScore) setHighScore('word-blitz', score);
    incrementGamesPlayed('word-blitz');
  };

  useEffect(() => () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (addInterval.current) clearInterval(addInterval.current);
    if (fallInterval.current) clearInterval(fallInterval.current);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const wordIndex = wordsRef.current.findIndex((w) => w.text === typedWord);
      if (wordIndex !== -1) {
        applyWords((cur) => cur.filter((_, i) => i !== wordIndex));
        setScore((s) => s + typedWord.length + Math.min(combo, 5));
        setCombo((c) => c + 1);
        setInputValue('');
      } else if (typedWord) {
        setCombo(0);
      }
    }
  };

  if (gameState === 'finished') {
    const isNewHigh = score > 0 && score >= highScore;
    return (
      <div className="flex flex-col items-center p-6 md:p-8 rounded-[24px] border bg-card/70 backdrop-blur-xl shadow-xl w-full max-w-2xl mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg">
            <Trophy className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Game over!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Word Blitz • 60s sprint</p>
        </motion.div>
        <div className="mt-6 grid w-full grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-xs tracking-widest text-muted-foreground">SCORE</div><div className="mt-1 text-2xl font-bold">{score}</div></div>
          <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-xs tracking-widest text-muted-foreground">BEST</div><div className="mt-1 text-2xl font-bold">{Math.max(score, highScore)}</div></div>
          <div className="rounded-2xl border bg-background/60 p-4 text-center"><div className="text-xs tracking-widest text-muted-foreground">COMBO</div><div className="mt-1 text-2xl font-bold">×{combo}</div></div>
        </div>
        {isNewHigh && <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-500/20"><Sparkles className="h-3.5 w-3.5" /> New high score!</div>}
        <div className="mt-6 flex gap-3">
          <Button onClick={startGame} variant="primary" size="lg" className="rounded-full">Play again</Button>
          <Button onClick={() => setCurrentGame(null)} variant="outline" size="lg" className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" /> Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 md:p-6 rounded-[24px] border bg-card/70 backdrop-blur-xl shadow-xl w-full max-w-2xl mx-auto">
      {gameState === 'idle' ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">Word Blitz</h2>
          <p className="mt-1 text-center text-sm leading-6 text-muted-foreground max-w-md">Words fall from the top. Type the word exactly and press <kbd className="rounded border bg-muted px-1 py-0.5 text-xs">Space</kbd> to clear it. Build a combo for bonus points.</p>
          <ul className="mt-4 grid w-full gap-2 text-sm">
            <li className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2"><Target className="h-4 w-4 text-[var(--theme-primary)]" /> Type fast — speed matters</li>
            <li className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2"><Sparkles className="h-4 w-4 text-amber-500" /> Chain clears → combo bonus</li>
            <li className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2"><Timer className="h-4 w-4 text-muted-foreground" /> Don&apos;t let words hit the bottom</li>
          </ul>
          <Button onClick={startGame} variant="primary" size="lg" className="mt-6 rounded-full px-8">Start — 60s</Button>
        </>
      ) : (
        <>
          <div className="flex w-full items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"><Timer className="h-3.5 w-3.5" /> {timer}s</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium">Score {score}</span>
              <span className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">×{combo} combo</span>
            </div>
          </div>
          <div ref={gameAreaRef} className="mt-4 h-[400px] w-full overflow-hidden rounded-2xl border bg-gradient-to-b from-background/80 to-muted/40 relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-card/60 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-red-500/10 to-transparent" />
            <AnimatePresence>
              {words.map((word) => (
                <motion.span
                  key={word.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute rounded-full border bg-card px-3 py-1 text-sm font-medium shadow-sm"
                  style={{ left: word.x, top: word.y }}
                >
                  {word.text}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <input type="text" value={inputValue} onChange={handleInputChange} className="mt-4 w-full rounded-2xl border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Type words and press Space…" autoFocus aria-label="Word Blitz input" />
          <p className="mt-2 text-xs text-muted-foreground">Tip: keep your eyes on the falling words — muscle memory beats hunting.</p>
        </>
      )}
    </div>
  );
}
