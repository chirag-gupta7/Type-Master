'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap, BookOpen, Gamepad2, BarChart3, Trophy, Users, Target, Clock, Brain, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    title: 'Quick Test',
    desc: 'Jump into a focused test — 30s, 60s, or 3m. Real-time WPM, accuracy, and error analysis.',
    icon: Zap,
    href: '/dashboard',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Learn & Practice',
    desc: 'Structured curriculum with unlocks, checkpoints, and code-aware lessons that actually transfer.',
    icon: BookOpen,
    href: '/learn',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    title: 'Typing Games',
    desc: 'Word Blitz, Prompt Dash, Story Chain — competitive, joyful practice that sticks.',
    icon: Gamepad2,
    href: '/games',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Progress',
    desc: 'Heatmaps, streaks, weak-key analysis, and WPM trends that tell a clear improvement story.',
    icon: BarChart3,
    href: '/progress',
    gradient: 'from-orange-500 to-pink-500',
  },
  {
    title: 'Achievements',
    desc: 'Milestones for speed, consistency, and mastery — celebrated without getting in your way.',
    icon: Trophy,
    href: '/achievements',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    title: 'Leaderboard',
    desc: 'Compare your best with the global community. Per-game rankings, refreshed live.',
    icon: Users,
    href: '/leaderboard',
    gradient: 'from-sky-500 to-cyan-500',
  },
];

export function FeatureCards() {
  return (
    <section className="relative py-10 md:py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to master typing</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm md:text-[15px] leading-6 text-muted-foreground">
              A complete toolkit — not just a test. Practice with purpose, track what matters, and enjoy the process.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={f.href}
                  className="group relative flex h-full flex-col rounded-[20px] border bg-card/70 p-5 backdrop-blur hover:bg-card transition-colors focus-ring"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-sm`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-5 text-muted-foreground line-clamp-3">{f.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--theme-primary)]">
                    Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: Target, title: 'Precision-first', desc: 'Weak-key & finger maps guide what to practice next.' },
              { icon: Clock, title: 'Respects your time', desc: 'Bite-size lessons, instant tests, zero friction.' },
              { icon: Brain, title: 'Adaptive & calm', desc: 'AI feedback and smart unlocks keep you in flow.' },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3 rounded-2xl border bg-card/60 p-4">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                  <b.icon className="h-4 w-4 text-foreground" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{b.title}</div>
                  <div className="text-sm leading-5 text-muted-foreground">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
