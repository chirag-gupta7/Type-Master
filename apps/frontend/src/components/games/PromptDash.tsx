'use client';
import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, ArrowLeft } from 'lucide-react';

const PROMPTS = [
  'Describe a city hidden in the clouds.',
  'The ancient artifact began to glow...',
  'My pet suddenly started talking. It said...',
  'Write about a world where music is illegal.',
  'The last dragon on Earth was just a rumor, until today.',
  'A time traveler arrived, but their machine was broken.',
];

export function PromptDash() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const { setHighScore, incrementGamesPlayed } = useGameStore();
  const highScore = useGameStore((s) => s.highScores['prompt-dash'] || 0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const startGame = () => {
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setText('');
    setTimer(60);
    setScore(0);
    setGameState('running');
    textAreaRef.current?.focus();
  };

  const stopGame = () => {
    setGameState('finished');
    // Calculate WPM: (all characters / 5) / (1 minute)
    const wordsTyped = text.length / 5;
    const wpm = Math.round(wordsTyped);
    setScore(wpm);
    if (wpm > highScore) {
      setHighScore('prompt-dash', wpm);
    }
    incrementGamesPlayed('prompt-dash');
  };

  useEffect(() => {
    if (gameState === 'running') {
      textAreaRef.current?.focus();
      timerInterval.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerInterval.current!);
            stopGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [gameState]);

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Time's Up!</h2>
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-2">Your WPM</p>
          <p className="text-5xl font-bold text-primary mb-4">{score}</p>
          <p className="text-sm text-muted-foreground">High Score: {highScore} WPM</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={startGame} size="lg">
            Play Again
          </Button>
          <Button onClick={() => window.history.back()} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-3xl mx-auto">
      {gameState === 'idle' ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Prompt Dash</h2>
          <p className="text-muted-foreground mb-6 text-center">
            You have 60 seconds to write as much as you can based on a creative prompt. Your score
            is your final WPM.
          </p>
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-2 text-xl font-bold text-primary">
              <Timer />
              <span>{timer}s</span>
            </div>
            <div className="text-xl font-bold">
              WPM: {Math.round(text.length / 5 / ((60 - timer) / 60) || 0)}
            </div>
          </div>
          <p className="text-lg text-muted-foreground italic mb-4 p-4 bg-background/50 rounded-md w-full text-center">
            "{prompt}"
          </p>
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Start writing..."
          />
        </>
      )}
    </div>
  );
}
