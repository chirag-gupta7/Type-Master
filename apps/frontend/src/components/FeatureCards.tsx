'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap,
  BookOpen,
  Gamepad2,
  BarChart3,
  Trophy,
  Users,
  Target,
  Clock,
  Brain,
} from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Quick Test',
    description: 'Jump into a typing test instantly. Choose from 30s, 60s, or 3-minute sessions.',
    icon: Zap,
    href: '/dashboard',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Learn & Practice',
    description:
      'Progressive lessons designed to improve your typing speed and accuracy systematically.',
    icon: BookOpen,
    href: '/learn',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Typing Games',
    description:
      'Make practice fun with engaging games like Word Blitz, Accuracy Challenge, and Speed Race.',
    icon: Gamepad2,
    href: '/games',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Progress Dashboard',
    description: 'Track your improvement over time with detailed analytics and visual charts.',
    icon: BarChart3,
    href: '/progress',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    title: 'Achievements',
    description:
      'Unlock badges and milestones as you master different typing skills and challenges.',
    icon: Trophy,
    href: '/achievements',
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    title: 'Leaderboard',
    description: 'Compete with typists worldwide and climb the rankings to prove your skills.',
    icon: Users,
    href: '/leaderboard',
    gradient: 'from-teal-500 to-cyan-500',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export function FeatureCards() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background pointer-events-none" />

      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] bg-clip-text text-transparent">
            Everything You Need to Master Typing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From beginner lessons to competitive leaderboards, we've got all the tools to accelerate
            your typing journey.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                variants={item}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={feature.href}>
                  <div className="group relative h-full bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Glassmorphism effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Neon glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
                      style={{
                        background: `linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))`,
                      }}
                    />

                    <div className="relative z-10">
                      {/* Icon with gradient background */}
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-[var(--theme-accent)] transition-colors duration-300">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Arrow indicator */}
                      <div className="mt-4 flex items-center text-sm font-medium text-[var(--theme-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Get started
                        <svg
                          className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: Target,
                title: '98% Accuracy',
                description: 'Real-time feedback',
              },
              {
                icon: Clock,
                title: 'Save Time',
                description: 'Type 2x faster',
              },
              {
                icon: Brain,
                title: 'Smart Learning',
                description: 'Adaptive lessons',
              },
            ].map((benefit, index) => {
              const BenefitIcon = benefit.icon;

              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center mb-3">
                    <BenefitIcon className="w-6 h-6 text-[var(--theme-primary)]" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
