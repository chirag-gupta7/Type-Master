'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FastForward, Timer } from 'lucide-react';
import { useGameStore } from '@/store/games';

// Predefined sentences for the game
const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Practice makes perfect in everything you do.',
  'Typing fast requires both speed and accuracy.',
  'Keep your fingers on the home row keys.',
  'The keyboard is a powerful tool for communication.',
  'Master the art of touch typing today.',
  'Every keystroke brings you closer to perfection.',
  'Focus on accuracy first, speed will follow.',
  'Consistency is key to improving your skills.',
  'Challenge yourself to type better each day.',
  'Proper posture improves typing performance.',
  'Regular practice leads to muscle memory.',
  'Stay calm and keep typing steadily.',
  'Your typing speed reflects your dedication.',
  'Embrace mistakes as learning opportunities.',
  'Rhythm and flow make typing effortless.',
  'Good typing skills boost productivity.',
  'Patience and practice yield great results.',
  'Type with confidence and determination.',
  'Excellence comes from persistent effort.',
];

export default function SentenceSprint() {
  const [currentSentence, setCurrentSentence] = useState('');
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [sentencesCompleted, setSentencesCompleted] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const {
    setCurrentGame,
    startGame: beginSession,
    resetGame,
    incrementGamesPlayed,
    setHighScore,
  } = useGameStore();

  // Initialize game
  const handleStartGame = useCallback(() => {
    const shuffled = [...SENTENCES].sort(() => Math.random() - 0.5);
    setCurrentSentence(shuffled[0]);
    setSentenceIndex(0);
    setUserInput('');
    setSentencesCompleted(0);
    setTimeLeft(60);
    setGameStarted(true);
    setGameOver(false);
    beginSession();
    incrementGamesPlayed();
  }, [beginSession, incrementGamesPlayed]);

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          setHighScore(sentencesCompleted);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, sentencesCompleted, setHighScore]);

  // Check input and handle sentence completion
  useEffect(() => {
    if (!gameStarted || gameOver || !currentSentence) return;

    // Check if sentence is complete and correct
    if (userInput === currentSentence) {
      const newCount = sentencesCompleted + 1;
      setSentencesCompleted(newCount);

      // Move to next sentence
      const nextIndex = sentenceIndex + 1;
      if (nextIndex < SENTENCES.length) {
        setSentenceIndex(nextIndex);
        setCurrentSentence(SENTENCES[nextIndex]);
      } else {
        // Reshuffle and start over if we run out
        const shuffled = [...SENTENCES].sort(() => Math.random() - 0.5);
        setSentenceIndex(0);
        setCurrentSentence(shuffled[0]);
      }
      setUserInput('');
    }
  }, [userInput, currentSentence, gameStarted, gameOver, sentenceIndex, sentencesCompleted]);

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
              <FastForward className="w-8 h-8 text-green-400" />
              Sentence Sprint
            </h1>
            <div className="flex items-center gap-6 text-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-400">{sentencesCompleted}</span>
                <span className="text-sm">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-yellow-400">{timeLeft}s</span>
              </div>
            </div>
          </div>

          {!gameStarted && !gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <p className="text-lg text-muted-foreground mb-6">
                Type sentences as quickly and accurately as possible. Complete as many as you can in
                60 seconds!
              </p>
              <button
                onClick={handleStartGame}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xl rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
              >
                Start Sprint
              </button>
            </motion.div>
          )}

          {gameStarted && !gameOver && (
            <div>
              {/* Sentence display with direct typing overlay */}
              <div
                className="bg-background/50 rounded-xl p-6 text-2xl font-mono leading-relaxed min-h-[120px] cursor-text relative mb-4"
                onClick={() => {
                  document.getElementById('hidden-sprint-input')?.focus();
                }}
              >
                {currentSentence.split('').map((char, idx) => {
                  const isTyped = idx < userInput.length;
                  const isCorrect = isTyped && userInput[idx] === char;
                  const isCurrent = idx === userInput.length;

                  return (
                    <span
                      key={idx}
                      className={`relative ${isCurrent ? 'bg-green-500/30' : ''} ${
                        isTyped && isCorrect ? 'text-green-400' : ''
                      } ${isTyped && !isCorrect ? 'text-red-500 underline decoration-2' : ''} ${
                        !isTyped ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-green-400 animate-pulse" />
                      )}
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Hidden input */}
              <input
                id="hidden-sprint-input"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                autoFocus
                className="sr-only"
                aria-label="Type the sentence above"
              />

              <p className="text-sm text-muted-foreground text-center">
                Click on the sentence to start typing
              </p>
            </div>
          )}

          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <h2 className="text-4xl font-bold text-green-400 mb-4">Time's Up!</h2>
              <p className="text-3xl font-bold mb-2">You typed:</p>
              <p className="text-5xl font-bold text-green-400 mb-6">
                {sentencesCompleted} sentences!
              </p>

              {sentencesCompleted >= 10 && (
                <p className="text-lg text-yellow-400 mb-4">🏆 Outstanding performance!</p>
              )}
              {sentencesCompleted >= 5 && sentencesCompleted < 10 && (
                <p className="text-lg text-blue-400 mb-4">👏 Great job!</p>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStartGame}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Play Again
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
