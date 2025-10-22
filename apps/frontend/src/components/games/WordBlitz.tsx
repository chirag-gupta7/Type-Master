'use client';
import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, ArrowLeft } from 'lucide-react';
const WORDS = [
  'the',
  'be',
  'to',
  'of',
  'and',
  'a',
  'in',
  'that',
  'have',
  'I',
  'it',
  'for',
  'not',
  'on',
  'with',
  'he',
  'as',
  'you',
  'do',
  'at',
  'this',
  'but',
  'his',
  'by',
  'from',
  'they',
  'we',
  'say',
  'her',
  'she',
  'or',
  'an',
  'will',
  'my',
  'one',
  'all',
  'would',
  'there',
  'their',
  'what',
  'so',
  'up',
  'out',
  'if',
  'about',
  'who',
  'get',
  'which',
  'go',
  'me',
  'when',
  'make',
  'can',
  'like',
  'time',
  'no',
  'just',
  'him',
  'know',
  'take',
  'people',
  'into',
  'year',
  'your',
  'good',
  'some',
  'could',
  'them',
  'see',
  'other',
  'than',
  'then',
  'now',
  'look',
  'only',
  'come',
  'its',
  'over',
  'think',
  'also',
  'back',
  'after',
  'use',
  'two',
  'how',
  'our',
  'work',
  'first',
  'well',
  'way',
  'even',
  'new',
  'want',
  'because',
  'any',
  'these',
  'give',
  'day',
  'most',
  'us',
];
type Word = {
  id: number;
  text: string;
  x: number;
  y: number;
};
export function WordBlitz() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [words, setWords] = useState<Word[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const addInterval = useRef<NodeJS.Timeout | null>(null);
  const fallInterval = useRef<NodeJS.Timeout | null>(null);
  const { setHighScore, incrementGamesPlayed } = useGameStore();
  const highScore = useGameStore((s) => s.highScores['word-blitz'] || 0);
  const addWord = () => {
    if (!gameAreaRef.current) return;
    const gameWidth = gameAreaRef.current.offsetWidth;
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWords((currentWords) => [
      ...currentWords,
      {
        id: Date.now(),
        text: newWord,
        x: Math.random() * (gameWidth - 50),
        y: 0,
      },
    ]);
  };
  const startGame = () => {
    setGameState('running');
    setWords([]);
    setInputValue('');
    setScore(0);
    setTimer(60);
    addInterval.current = setInterval(addWord, 1200);
    fallInterval.current = setInterval(() => {
      setWords((currentWords) =>
        currentWords.map((w) => ({ ...w, y: w.y + 2 })).filter((w) => w.y < 400)
      );
    }, 50);
    timerInterval.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          stopGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };
  const stopGame = () => {
    setGameState('finished');
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (addInterval.current) clearInterval(addInterval.current);
    if (fallInterval.current) clearInterval(fallInterval.current);
    if (score > highScore) {
      setHighScore('word-blitz', score);
    }
    incrementGamesPlayed('word-blitz');
  };
  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (addInterval.current) clearInterval(addInterval.current);
      if (fallInterval.current) clearInterval(fallInterval.current);
    };
  }, []);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const wordIndex = words.findIndex((w) => w.text === typedWord);
      if (wordIndex !== -1) {
        setWords((currentWords) => currentWords.filter((_, i) => i !== wordIndex));
        setScore((s) => s + typedWord.length);
        setInputValue('');
      }
    }
  };
  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Game Over!</h2>
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-2">Final Score</p>
          <p className="text-5xl font-bold text-primary mb-4">{score}</p>
          <p className="text-sm text-muted-foreground">High Score: {highScore}</p>
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
    <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-2xl mx-auto">
      {gameState === 'idle' ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Word Blitz</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Type the falling words before they hit the bottom. Type a word and press space to score.
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
            <div className="text-xl font-bold">Score: {score}</div>
          </div>
          <div
            ref={gameAreaRef}
            className="w-full h-[400px] bg-background/50 rounded-md border relative overflow-hidden mb-4"
          >
            {words.map((word) => (
              <span
                key={word.id}
                className="absolute text-foreground font-medium p-1 rounded"
                style={{ left: word.x, top: word.y }}
              >
                {word.text}
              </span>
            ))}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full p-3 text-lg rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type words here..."
            autoFocus
          />
        </>
      )}
    </div>
  );
}
