'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTypingStore } from '@/store';
import { getTest } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Target, Zap } from 'lucide-react';

const TypingTest: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    textToType,
    userInput,
    wpm,
    accuracy,
    startTest,
    setUserInput,
    endTest,
    resetTest,
    startTime,
  } = useTypingStore();

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeDuration, setActiveDuration] = useState<30 | 60 | 180>(60);
  const [view, setView] = useState<'initial' | 'typing' | 'results'>('initial');

  const prepareTest = useCallback(async (duration: 30 | 60 | 180) => {
    resetTest();
    setActiveDuration(duration);
    setTimeLeft(duration);
    try {
      const data = await getTest(duration);
      startTest(data.text);
      setView('initial');
    } catch (error) {
      console.error('Failed to fetch text:', error);
    }
  }, [resetTest, startTest]);

  useEffect(() => {
    prepareTest(activeDuration);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'typing' && status === 'in-progress' && startTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = activeDuration - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          endTest();
          setView('results');
          clearInterval(timer);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, status, startTime, activeDuration, endTest]);

  const handleStartClick = () => {
    setView('typing');
    setTimeout(() => {
        inputRef.current?.focus();
    }, 100);
  };

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (status === 'waiting' && value.length > 0 && view === 'typing') {
      useTypingStore.setState({ startTime: Date.now(), status: 'in-progress' });
    }
    if (status !== 'finished') {
      setUserInput(value);
    }
  };

  const handleRestart = () => {
    prepareTest(activeDuration);
    setView('initial');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const Character = ({ char, index }: { char: string; index: number }) => {
    let charState: 'correct' | 'incorrect' | 'untyped' = 'untyped';
    let hasCursor = index === userInput.length && view === 'typing' && status !== 'finished';

    if (index < userInput.length) {
      charState = char === userInput[index] ? 'correct' : 'incorrect';
    }
    
    return (
      <span className={cn(
        "relative",
        charState === 'correct' && 'text-primary-foreground',
        charState === 'incorrect' && 'text-red-500 underline',
        charState === 'untyped' && 'text-muted-foreground',
      )}>
        {hasCursor && <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-yellow-400 animate-blink rounded-full" />}
        {char === ' ' && charState === 'incorrect' ? <span className='bg-red-500/50'>&nbsp;</span> : char}
      </span>
    );
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground font-sans w-full">
      <AnimatePresence mode="wait">
        {view === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center text-center"
          >
            <h1 className="text-6xl font-bold mb-2 animate-tracking-in-expand">TypeMaster</h1>
            <p className="text-xl text-muted-foreground mb-10">Test your typing skills.</p>
            <div className="mb-10 flex items-center justify-center gap-2 md:gap-4 p-2 bg-secondary/50 rounded-lg">
              {[30, 60, 180].map((duration) => (
                <button
                  key={duration}
                  onClick={() => prepareTest(duration as 30 | 60 | 180)}
                  className={cn(
                    "px-4 py-2 md:px-6 md:py-3 rounded-md text-lg font-medium transition-all duration-300",
                    activeDuration === duration ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {duration === 30 ? '30s' : `${duration/60}m`}
                </button>
              ))}
            </div>
            <button
              onClick={handleStartClick}
              disabled={!textToType}
              className="px-12 py-4 bg-yellow-400 text-background font-bold text-2xl rounded-lg shadow-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {textToType ? 'Start' : 'Loading...'}
            </button>
          </motion.div>
        )}

        {view === 'typing' && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-8 px-4 py-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-6 text-xl">
                <div className="flex items-center gap-2"><Zap className="text-yellow-400" /> <span>{wpm} WPM</span></div>
                <div className="flex items-center gap-2"><Target className="text-yellow-400" /> <span>{accuracy}%</span></div>
              </div>
              <div className="flex items-center gap-2 text-2xl font-semibold"><Clock className="text-yellow-400" /> <span>{formatTime(timeLeft)}</span></div>
            </div>
            
            <div
              className="text-3xl font-mono leading-relaxed tracking-wider text-left h-40 overflow-hidden relative w-full"
              onClick={() => inputRef.current?.focus()}
            >
                <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent z-10" />
                <motion.div
                  className="transition-transform duration-200 ease-linear"
                  animate={{ y: `-${Math.floor(userInput.length / 55) * 3.25}rem` }}
                  transition={{ type: "spring", stiffness: 500, damping: 50 }}
                >
                {textToType.split('').map((char, i) => (
                  <Character key={`${char}_${i}`} char={char} index={i} />
                ))}
              </motion.div>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent z-10" />
            </div>

            <input
              ref={inputRef}
              type="text"
              className="sr-only"
              value={userInput}
              onChange={handleUserInput}
              disabled={status === 'finished'}
            />
             <button onClick={handleRestart} className="mt-8 flex items-center gap-2 text-muted-foreground hover:text-primary-foreground transition-colors">
                <RefreshCw size={16} />
                <span>Restart</span>
            </button>
          </motion.div>
        )}

        {view === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="text-center p-10 bg-secondary/50 rounded-xl shadow-2xl"
          >
            <h2 className="text-4xl font-bold text-yellow-400 mb-4 animate-text-focus-in">Results</h2>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-2xl my-8">
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground text-lg">WPM</span>
                <span className="font-bold text-5xl">{wpm}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground text-lg">Accuracy</span>
                <span className="font-bold text-5xl">{accuracy}%</span>
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="mt-6 flex items-center gap-3 mx-auto px-8 py-4 bg-primary text-primary-foreground font-semibold text-xl rounded-lg shadow-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105"
            >
              <RefreshCw />
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TypingTest;
