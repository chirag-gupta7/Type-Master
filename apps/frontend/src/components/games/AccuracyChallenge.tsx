'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, X } from 'lucide-react';
import { useGameStore } from '@/store/games';
import { generateTestText } from '@/lib/textGenerator';

export default function AccuracyChallenge() {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [progress, setProgress] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const {
    setCurrentGame,
    startGame: beginSession,
    resetGame,
    incrementGamesPlayed,
  } = useGameStore();

  const handleStartGame = () => {
    const newText = generateTestText(60, undefined, 'easy');
    setText(newText);
    setUserInput('');
    setMistakes(0);
    setProgress(0);
    setGameStarted(true);
    setGameOver(false);
    setWon(false);
    beginSession();
    incrementGamesPlayed();
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const currentChar = text[userInput.length];
    const typedChar = userInput[userInput.length - 1];

    if (userInput.length > 0 && currentChar !== typedChar) {
      // Mistake made!
      setMistakes((prev) => prev + 1);
      setGameOver(true);
    }

    const newProgress = (userInput.length / text.length) * 100;
    setProgress(newProgress);

    if (userInput.length === text.length && userInput === text) {
      setGameOver(true);
      setWon(true);
    }
  }, [userInput, text, gameStarted, gameOver]);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => {
            resetGame();
            setCurrentGame(null);
          }}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>

        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-purple-400" />
              Accuracy Challenge
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-xl">
                Mistakes: <span className="font-bold text-red-400">{mistakes}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {gameStarted && (
            <div className="mb-6">
              <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {Math.round(progress)}% Complete
              </p>
            </div>
          )}

          {!gameStarted && !gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-lg text-muted-foreground mb-6">
                Type the text with 100% accuracy. One mistake and you start over!
              </p>
              <button
                onClick={handleStartGame}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
              >
                Start Challenge
              </button>
            </motion.div>
          )}

          {gameStarted && !gameOver && (
            <div>
              {/* Text display with cursor - Click to focus */}
              <div
                className="bg-background/50 rounded-xl p-6 text-2xl font-mono leading-relaxed min-h-[200px] cursor-text relative"
                onClick={() => {
                  // Focus on hidden input when text area is clicked
                  document.getElementById('hidden-accuracy-input')?.focus();
                }}
              >
                {text.split('').map((char, idx) => {
                  const isTyped = idx < userInput.length;
                  const isCorrect = isTyped && userInput[idx] === char;
                  const isCurrent = idx === userInput.length;

                  return (
                    <span
                      key={idx}
                      className={`relative ${isCurrent ? 'bg-purple-500/30' : ''} ${
                        isTyped && isCorrect ? 'text-green-400' : ''
                      } ${isTyped && !isCorrect ? 'text-red-500 underline decoration-2' : ''} ${
                        !isTyped ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {/* Visual cursor */}
                      {isCurrent && (
                        <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-purple-400 animate-pulse" />
                      )}
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Hidden input for capturing keystrokes */}
              <input
                id="hidden-accuracy-input"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                autoFocus
                className="sr-only"
                aria-label="Type the text above"
              />

              <p className="text-sm text-muted-foreground text-center mt-4">
                Click on the text area to start typing
              </p>
            </div>
          )}

          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              {won ? (
                <>
                  <h2 className="text-4xl font-bold text-green-400 mb-4">🎉 Perfect!</h2>
                  <p className="text-2xl mb-6">You completed the challenge with 100% accuracy!</p>
                </>
              ) : (
                <>
                  <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-4xl font-bold text-red-400 mb-4">Mistake!</h2>
                  <p className="text-xl mb-6">You made {mistakes} mistake(s). Try again!</p>
                </>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStartGame}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    resetGame();
                    setCurrentGame(null);
                  }}
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
