'use client';
import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, CornerDownLeft, ArrowLeft } from 'lucide-react';

const AI_STARTERS = [
  'The dusty old book fell from the shelf, opening to a strange map.',
  'A single red light blinked on the abandoned console.',
  'The alley was empty, except for a cat with unusual green eyes.',
];
const AI_RESPONSES = [
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
  const [timer, setTimer] = useState(90);
  const [score, setScore] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const { setHighScore, incrementGamesPlayed } = useGameStore();
  const highScore = useGameStore((s) => s.highScores['story-chain'] || 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const storyEndRef = useRef<HTMLDivElement>(null);

  const startGame = () => {
    setStory([AI_STARTERS[Math.floor(Math.random() * AI_STARTERS.length)]]);
    setUserInput('');
    setTimer(90);
    setScore(0);
    setGameState('running');
  };

  const stopGame = () => {
    setGameState('finished');
    if (score > highScore) {
      setHighScore('story-chain', score);
    }
    incrementGamesPlayed('story-chain');
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newUserSentence = userInput.trim();
    const aiResponse = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];

    setStory([...story, newUserSentence, aiResponse]);
    setScore(score + 1);
    setUserInput('');
  };

  useEffect(() => {
    if (gameState === 'running') {
      inputRef.current?.focus();
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

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [story]);

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Story Complete!</h2>
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-2">Sentences Added</p>
          <p className="text-5xl font-bold text-primary mb-4">{score}</p>
          <p className="text-sm text-muted-foreground">High Score: {highScore} sentences</p>
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
          <h2 className="text-2xl font-bold mb-4">Story Chain</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Write a story one sentence at a time, alternating with an AI. See how many sentences you
            can add in 90 seconds!
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
            <div className="text-xl font-bold">Your Sentences: {score}</div>
          </div>
          <div className="w-full h-64 overflow-y-auto p-4 bg-background/50 rounded-md mb-4 flex flex-col gap-2">
            {story.map((sentence, index) => (
              <p
                key={index}
                className={
                  index % 2 === 0 ? 'text-muted-foreground' : 'text-foreground font-medium'
                }
              >
                {index % 2 === 0 ? 'AI: ' : 'You: '}
                {sentence}
              </p>
            ))}
            <div ref={storyEndRef} />
          </div>
          <form onSubmit={handleUserSubmit} className="w-full flex gap-2">
            <input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-grow p-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type the next sentence..."
            />
            <Button type="submit" size="icon" aria-label="Submit sentence">
              <CornerDownLeft />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
