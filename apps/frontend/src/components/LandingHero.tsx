'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Trophy, Target, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog';

export function LandingHero() {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [isClient, setIsClient] = useState(false);

  // Initialize particles on client side
  useEffect(() => {
    setIsClient(true);
    const initialParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
    }));
    setParticles(initialParticles);
  }, []);

  // Animated typing effect in hero
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < SAMPLE_TEXT.length) {
        setDisplayText(SAMPLE_TEXT.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      } else {
        // Reset after completion
        setTimeout(() => {
          setCurrentIndex(0);
          setDisplayText('');
        }, 2000);
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-primary)]/10 via-background to-[var(--theme-secondary)]/10 animate-gradient" />

      {/* Floating particles - only render on client */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full bg-[var(--theme-accent)]/30"
              initial={{
                x: particle.x,
                y: particle.y,
              }}
              animate={{
                x: [particle.x, Math.random() * window.innerWidth],
                y: [particle.y, Math.random() * window.innerHeight],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          ))}
        </div>
      )}

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-[var(--theme-primary)] via-[var(--theme-accent)] to-[var(--theme-secondary)] bg-clip-text text-transparent mb-6">
              TypeMaster
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Master the art of typing. Track your progress, compete with friends, and unlock
              achievements.
            </p>
          </motion.div>

          {/* Live typing preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl border border-[var(--theme-primary)]/30 rounded-2xl p-8 shadow-2xl"
            style={{
              boxShadow: `0 0 40px ${getComputedStyle(document.documentElement).getPropertyValue('--theme-primary')}20`,
            }}
          >
            <div className="text-3xl font-mono text-muted-foreground mb-4">
              {displayText}
              <span className="inline-block w-1 h-8 bg-[var(--theme-accent)] animate-pulse ml-1" />
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>85 WPM</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--theme-accent)]" />
                <span>98% Accuracy</span>
              </div>
            </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard">
              <button className="group px-8 py-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                Start Typing Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/learn">
              <button className="px-8 py-4 bg-background/50 backdrop-blur-sm border-2 border-[var(--theme-primary)]/50 text-foreground font-semibold text-lg rounded-xl hover:bg-[var(--theme-primary)]/10 transition-all duration-300">
                Learn & Practice
              </button>
            </Link>
          </motion.div>

          {/* Quick stats for logged-in users */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="pt-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: 'Tests Taken', value: '247', icon: Zap },
                { label: 'Avg WPM', value: '82', icon: BarChart3 },
                { label: 'Best WPM', value: '118', icon: Trophy },
                { label: 'Accuracy', value: '96%', icon: Target },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-4 text-center"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-[var(--theme-accent)]" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
