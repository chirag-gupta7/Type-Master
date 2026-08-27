'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Trophy, Target, BarChart3, Keyboard, Sparkles, ShieldCheck, Gauge } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog';

export function LandingHero() {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < SAMPLE_TEXT.length) {
        setDisplayText(SAMPLE_TEXT.slice(0, currentIndex + 1));
        setCurrentIndex((i) => i + 1);
      } else {
        const t = setTimeout(() => {
          setCurrentIndex(0);
          setDisplayText('');
        }, 1800);
        // store timeout to clear on unmount via outer timer cleanup
        void t;
      }
    }, 70);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <section className="relative overflow-hidden">
      {/* accent orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[640px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[var(--theme-primary)]/20 via-[var(--theme-secondary)]/15 to-transparent blur-3xl" />
        <div className="absolute top-[28%] -right-24 h-[420px] w-[420px] rounded-full bg-[var(--theme-accent)]/15 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-16">
        <div className="mx-auto max-w-6xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs font-medium backdrop-blur">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
                <Keyboard className="h-3.5 w-3.5" />
              </span>
              Trusted by 12k+ typists • WCAG AA • 60fps typing engine
              <span className="hidden sm:inline-flex items-center gap-1 text-[var(--theme-primary)]">
                <ShieldCheck className="h-3.5 w-3.5" /> Secure & private
              </span>
            </span>
          </motion.div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            {/* Left copy */}
            <div className="text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-[56px] lg:leading-[1.05]"
              >
                Master typing with
                <span className="text-gradient"> speed, accuracy, and style.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-6 text-muted-foreground lg:mx-0 md:text-[17px] md:leading-7"
              >
                Guided lessons, real-time analytics, AI coaching, and playful games — all crafted into a sleek, keyboard-first experience that feels native.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="mt-6 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
              >
                <Link href="/dashboard">
                  <Button variant="primary" size="xl" className="w-full sm:w-auto gap-2 rounded-full">
                    Start typing now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/learn">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto rounded-full">
                    Explore lessons
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start text-xs"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 border">
                  <Gauge className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> Avg +18 WPM in 2 weeks
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 border">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--theme-accent)]" /> AI feedback after every test
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 border">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" /> Achievements & streaks
                </span>
              </motion.div>
            </div>

            {/* Right preview card */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative mx-auto w-full max-w-[560px] lg:mx-0"
            >
              <div className="glass-strong rounded-[24px] p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live preview
                  </span>
                  <span className="text-xs text-muted-foreground">60s • Words • <span className="text-foreground font-medium">No setup</span></span>
                </div>

                <div className="mt-5 rounded-2xl border bg-background/60 p-4 backdrop-blur">
                  <div className="font-mono text-lg md:text-xl leading-8 tracking-wide">
                    <span className="text-foreground">{displayText}</span>
                    <span className="inline-block h-5 w-[2px] translate-y-1 bg-[var(--theme-primary)] animate-blink ml-0.5" aria-hidden />
                    <span className="text-muted-foreground/60">{SAMPLE_TEXT.slice(displayText.length)}</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)]"
                      animate={{ width: `${(displayText.length / SAMPLE_TEXT.length) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'WPM', value: '82', icon: Zap, tint: 'text-amber-500' },
                    { label: 'Accuracy', value: '98%', icon: Target, tint: 'text-emerald-500' },
                    { label: 'Streak', value: '12 days', icon: BarChart3, tint: 'text-sky-500' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border bg-card/70 p-3 text-center">
                      <s.icon className={`mx-auto h-4 w-4 ${s.tint}`} />
                      <div className="mt-1 text-sm font-bold">{s.value}</div>
                      <div className="text-[11px] tracking-wide text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Next up: <span className="text-foreground font-medium">Home row mastery →</span></span>
                  <Link href="/learn" className="font-semibold text-[var(--theme-primary)] hover:underline">Open Learn</Link>
                </div>
              </div>

              {/* floating badge */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -right-2 hidden md:flex items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> 60fps key rendering
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
