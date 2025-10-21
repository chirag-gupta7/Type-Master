'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { useGameStore } from '@/store/games';
import { generateTestText } from '@/lib/textGenerator';

export default function SpeedRace() {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [personalBest, setPersonalBest] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const { setGame, incrementGamesPlayed, setHighScore } = useGameStore();

  const startGame = useCallback(() => {
    const newText = generateTestText(60, undefined, 'medium');
    setText(newText);
    setUserInput('');
    setWpm(0);
    setStartTime(null);
    setGameStarted(true);
    setGameOver(false);
    incrementGamesPlayed();
  }, [incrementGamesPlayed]);

  useEffect(() => {
    if (!gameStarted || !startTime) return;

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
      const words = userInput.trim().split(/\s+/).length;
      const currentWpm = Math.round(words / elapsedMinutes);
      setWpm(currentWpm);
    }, 100);

    return () => clearInterval(interval);
  }, [userInput, startTime, gameStarted]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    setUserInput(value);

    if (value === text) {
      setGameOver(true);
      if (wpm > personalBest) {
        setPersonalBest(wpm);
        setHighScore(wpm);
      }
    }
  };

  const progress = (userInput.length / text.length) * 100;

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
              <Trophy className="w-8 h-8 text-orange-400" />
              Speed Race
            </h1>
            <div className="flex items-center gap-6 text-xl">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-orange-400">{wpm} WPM</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Best: <span className="font-bold text-foreground">{personalBest}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {gameStarted && (
            <div className="mb-6">
              <div className="h-3 bg-background/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {!gameStarted && !gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-lg text-muted-foreground mb-6">
                Type as fast as you can to beat your personal best WPM!
              </p>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-xl rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
              >
                Start Race
              </button>
            </motion.div>
          )}

          {gameStarted && !gameOver && (
            <div className="grid grid-cols-2 gap-6">
              {/* Text to type */}
              <div className="bg-background/50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Type this:</h3>
                <div className="text-lg font-mono leading-relaxed text-muted-foreground">
                  {text}
                </div>
              </div>

              {/* Input area */}
              <div className="bg-background/50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Your typing:</h3>
                <textarea
                  value={userInput}
                  onChange={handleInput}
                  autoFocus
                  rows={10}
                  className="w-full bg-background border-2 border-orange-500/50 rounded-lg p-3 text-lg font-mono focus:outline-none focus:border-orange-500 resize-none"
                  placeholder="Start typing..."
                />
              </div>
            </div>
          )}

          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              {wpm > personalBest && (
                <div className="text-6xl mb-4">🎉</div>
              )}
              <h2 className="text-4xl font-bold text-orange-400 mb-4">
                {wpm > personalBest ? 'New Record!' : 'Race Complete!'}
              </h2>
              <p className="text-3xl font-bold mb-2">{wpm} WPM</p>
              {wpm > personalBest && (
                <p className="text-lg text-green-400 mb-6">You beat your previous best!</p>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Race Again
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
