'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { useGameStore } from '@/store/games';
import { generate as generateWords } from 'random-words';

interface FallingWord {
  id: number;
  word: string;
  y: number;
  typed: string;
}

export default function WordBlitz() {
  const [words, setWords] = useState<FallingWord[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentInput, setCurrentInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const { setGame, incrementGamesPlayed, setHighScore } = useGameStore();

  const addWord = useCallback(() => {
    const newWord = Array.isArray(generateWords(1)) ? generateWords(1)[0] : generateWords(1);
    const word: FallingWord = {
      id: Date.now(),
      word: newWord as string,
      y: 0,
      typed: '',
    };
    setWords((prev) => [...prev, word]);
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setTimeLeft(30);
    setWords([]);
    setCurrentInput('');
    setGameOver(false);
    incrementGamesPlayed();
    addWord();
  };

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          setHighScore(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, score, setHighScore]);

  // Fall words
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const fallInterval = setInterval(() => {
      setWords((prev) =>
        prev
          .map((w) => ({ ...w, y: w.y + 2 }))
          .filter((w) => w.y < 100)
      );
    }, 50);

    return () => clearInterval(fallInterval);
  }, [gameStarted, gameOver]);

  // Add new words
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const addInterval = setInterval(() => {
      if (words.length < 5) {
        addWord();
      }
    }, 2000);

    return () => clearInterval(addInterval);
  }, [gameStarted, gameOver, words.length, addWord]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value);

    // Check if any word matches
    const matchedWord = words.find((w) => w.word === value);
    if (matchedWord) {
      setScore((prev) => prev + matchedWord.word.length * 10);
      setWords((prev) => prev.filter((w) => w.id !== matchedWord.id));
      setCurrentInput('');
      addWord();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => setGame(null)}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>

        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="w-8 h-8 text-cyan-400" />
              Word Blitz
            </h1>
            <div className="flex items-center gap-6 text-xl">
              <div>Score: <span className="font-bold text-cyan-400">{score}</span></div>
              <div>Time: <span className="font-bold text-yellow-400">{timeLeft}s</span></div>
            </div>
          </div>

          {!gameStarted && !gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-lg text-muted-foreground mb-6">
                Type words before they fall to the bottom! Each letter is worth 10 points.
              </p>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xl rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
              >
                Start Game
              </button>
            </motion.div>
          )}

          {gameStarted && !gameOver && (
            <>
              {/* Falling words area */}
              <div className="relative h-64 bg-background/50 rounded-xl mb-6 overflow-hidden">
                <AnimatePresence>
                  {words.map((word) => (
                    <motion.div
                      key={word.id}
                      initial={{ y: 0, opacity: 0 }}
                      animate={{ y: `${word.y}%`, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold"
                      style={{
                        color: word.y > 80 ? '#ef4444' : word.y > 60 ? '#f59e0b' : '#06b6d4',
                      }}
                    >
                      {word.word}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Input */}
              <input
                type="text"
                value={currentInput}
                onChange={handleInput}
                autoFocus
                className="w-full px-6 py-4 bg-background border-2 border-cyan-500/50 rounded-xl text-2xl text-center font-bold focus:outline-none focus:border-cyan-500"
                placeholder="Type words here..."
              />
            </>
          )}

          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <h2 className="text-4xl font-bold text-cyan-400 mb-4">Game Over!</h2>
              <p className="text-3xl font-bold mb-6">Final Score: {score}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGame(null)}
                  className="px-6 py-3 bg-background/50 border border-border rounded-xl hover:bg-muted transition-colors"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
