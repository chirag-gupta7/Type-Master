'use client';

import { useState, useEffect } from 'react';
import { getFingerForKey } from '@/components/HandPositionGuide';
import { HandModel3D } from '@/components/HandModel3D';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Trophy,
  Zap,
  Target,
  Award,
  TrendingUp,
} from 'lucide-react';

const DEMO_KEYS = [
  'A',
  'S',
  'D',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  ';',
  'Q',
  'W',
  'E',
  'R',
  'T',
  'Y',
  'U',
  'I',
  'O',
  'P',
  'Z',
  'X',
  'C',
  'V',
  'B',
  'N',
  'M',
  ',',
  '.',
  '/',
  ' ',
];

const HOME_ROW_KEYS = ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'];

export default function HandPositionDemo() {
  const [currentKey, setCurrentKey] = useState<string>('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>(HOME_ROW_KEYS);
  // Legacy 2D guide removed; these toggles now tune the 3D presentation instead.
  const [showPressureIndicators, setShowPressureIndicators] = useState(true);
  const [showWristGuides, setShowWristGuides] = useState(true);
  const [showTips, setShowTips] = useState(false);

  // Auto-play demonstration
  useEffect(() => {
    if (!autoPlay) return;

    let index = 0;
    const interval = setInterval(() => {
      setCurrentKey(keySequence[index]);
      index = (index + 1) % keySequence.length;
    }, 1500);

    return () => clearInterval(interval);
  }, [autoPlay, keySequence]);

  // Manual keyboard input
  useEffect(() => {
    if (autoPlay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent spacebar from scrolling
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
      }

      // Ignore modifier keys
      if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return;

      const key = e.key === ' ' ? 'Space' : e.key.toUpperCase();
      setCurrentKey(key);

      // Clear after 1 second
      setTimeout(() => {
        setCurrentKey('');
      }, 1000);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoPlay]);

  const fingerInfo = currentKey ? getFingerForKey(currentKey) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <motion.div
          className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
            style={{
              textShadow: '0 0 60px rgba(59, 130, 246, 0.3)',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Master Touch Typing Hand Position
          </motion.h1>

          <motion.p
            className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Experience proper typing technique through interactive 3D hand models and real-time
            visual guidance
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { icon: Zap, label: 'Real-time Feedback', color: 'from-yellow-500 to-orange-500' },
              { icon: Trophy, label: 'Achievement System', color: 'from-purple-500 to-pink-500' },
              { icon: Target, label: 'Precision Training', color: 'from-green-500 to-emerald-500' },
              { icon: TrendingUp, label: 'Progress Tracking', color: 'from-blue-500 to-cyan-500' },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-3`}
                  style={{
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-gray-300 font-medium">{feature.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Interactive 3D Hand Models Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-white">
            Interactive 3D Hand Models
          </h2>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* Left Hand */}
            <motion.div
              className="bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8"
              whileHover={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <p className="text-sm uppercase tracking-widest text-cyan-400 mb-4 text-center">
                Left Hand Focus
              </p>
              <HandModel3D
                hand="left"
                activeFinger={
                  currentKey && getFingerForKey(currentKey)?.hand === 'left'
                    ? getFingerForKey(currentKey)?.color.name
                    : undefined
                }
                showPressureIndicators={showPressureIndicators}
                showWristGuide={showWristGuides}
              />
            </motion.div>

            {/* Right Hand */}
            <motion.div
              className="bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8"
              whileHover={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <p className="text-sm uppercase tracking-widest text-cyan-400 mb-4 text-center">
                Right Hand Focus
              </p>
              <HandModel3D
                hand="right"
                activeFinger={
                  currentKey && getFingerForKey(currentKey)?.hand === 'right'
                    ? getFingerForKey(currentKey)?.color.name
                    : undefined
                }
                showPressureIndicators={showPressureIndicators}
                showWristGuide={showWristGuides}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Progressive Learning Modules */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Learning Modules</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Home Row',
                keys: 'ASDF JKL;',
                level: 'Beginner',
                color: 'from-green-500 to-emerald-500',
              },
              {
                title: 'Top Row',
                keys: 'QWERTY UIOP',
                level: 'Beginner',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                title: 'Bottom Row',
                keys: 'ZXCVBNM',
                level: 'Intermediate',
                color: 'from-yellow-500 to-orange-500',
              },
              {
                title: 'Numbers',
                keys: '1234567890',
                level: 'Advanced',
                color: 'from-purple-500 to-pink-500',
              },
            ].map((module, i) => (
              <motion.button
                key={module.title}
                className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-left hover:border-white/30 transition-all group"
                whileHover={{ scale: 1.05, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
              >
                <div
                  className={`w-full h-2 rounded-full bg-gradient-to-r ${module.color} mb-4 group-hover:shadow-lg transition-all`}
                  style={{
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                  }}
                />
                <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                <p className="text-sm text-gray-400 mb-3 font-mono">{module.keys}</p>
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                  {module.level}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Controls Panel */}
        <motion.div
          className="bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="space-y-6">
            {/* Auto-play Control */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  size="lg"
                  onClick={() => {
                    setAutoPlay(!autoPlay);
                    if (autoPlay) setCurrentKey('');
                  }}
                  className={`gap-2 transition-all duration-300 ${
                    autoPlay
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0'
                  }`}
                  style={{
                    boxShadow: autoPlay
                      ? '0 0 30px rgba(239, 68, 68, 0.5)'
                      : '0 0 30px rgba(59, 130, 246, 0.5)',
                  }}
                >
                  {autoPlay ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause Demo
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Auto-play
                    </>
                  )}
                </Button>

                {autoPlay && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setKeySequence(HOME_ROW_KEYS)}
                      className={`transition-all duration-300 ${
                        keySequence === HOME_ROW_KEYS
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                          : 'bg-black/40 text-gray-400 border border-white/20 hover:border-green-500/50'
                      }`}
                      style={{
                        boxShadow:
                          keySequence === HOME_ROW_KEYS
                            ? '0 0 20px rgba(34, 197, 94, 0.5)'
                            : 'none',
                      }}
                    >
                      Home Row
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setKeySequence(DEMO_KEYS)}
                      className={`transition-all duration-300 ${
                        keySequence === DEMO_KEYS
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                          : 'bg-black/40 text-gray-400 border border-white/20 hover:border-purple-500/50'
                      }`}
                      style={{
                        boxShadow:
                          keySequence === DEMO_KEYS ? '0 0 20px rgba(168, 85, 247, 0.5)' : 'none',
                      }}
                    >
                      All Keys
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Display Options & Current Key Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Options */}
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-4 text-sm text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  Display Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showPressureIndicators}
                      onChange={(e) => setShowPressureIndicators(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 checked:bg-cyan-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-cyan-400 transition-colors">
                      Show Pressure Indicators
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showWristGuides}
                      onChange={(e) => setShowWristGuides(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 checked:bg-cyan-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-cyan-400 transition-colors">
                      Show Wrist Guides
                    </span>
                  </label>
                </div>
              </div>

              {/* Current Key Info with Neon Effect */}
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <h3 className="font-semibold mb-4 text-sm text-purple-400 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  Active Key Info
                </h3>
                {currentKey && fingerInfo ? (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/10">
                      <span className="text-xs text-gray-500 w-16">Key:</span>
                      <motion.span
                        className="text-3xl font-bold font-mono text-cyan-400"
                        animate={{
                          textShadow: [
                            '0 0 10px rgba(34,211,238,0.5)',
                            '0 0 20px rgba(34,211,238,1)',
                            '0 0 10px rgba(34,211,238,0.5)',
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {currentKey === 'SPACE' ? '␣' : currentKey}
                      </motion.span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/10">
                      <span className="text-xs text-gray-500 w-16">Hand:</span>
                      <span className="text-sm font-semibold capitalize text-white">
                        {fingerInfo.hand}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/10">
                      <span className="text-xs text-gray-500 w-16">Finger:</span>
                      <span
                        className={`text-sm font-semibold ${fingerInfo.color.color}`}
                        style={{
                          textShadow: '0 0 10px currentColor',
                        }}
                      >
                        {fingerInfo.color.name}
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 italic">
                      {autoPlay ? '🎬 Auto-play running...' : '⌨️ Press any key'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Input Hint */}
            <AnimatePresence>
              {!autoPlay && (
                <motion.div
                  className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 text-center backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <p className="text-sm text-gray-300">
                    <span className="inline-block mr-2 animate-bounce">⌨️</span>
                    <span className="font-semibold text-cyan-400">Pro Tip:</span> Press any key to
                    activate real-time finger guidance
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Enhanced Color Legend with Neon Effects */}
        <motion.div
          className="bg-gradient-to-br from-[#1a1a1a]/90 to-[#0f0f0f]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          <h3 className="text-center text-lg font-semibold text-white uppercase tracking-wider mb-6 flex items-center justify-center gap-3">
            <Award className="h-5 w-5 text-cyan-400" />
            Finger Color Reference
            <Award className="h-5 w-5 text-cyan-400" />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { color: 'bg-red-500', name: 'Pinky', glow: 'rgba(239, 68, 68, 0.6)' },
              { color: 'bg-orange-500', name: 'Ring', glow: 'rgba(249, 115, 22, 0.6)' },
              { color: 'bg-yellow-500', name: 'Middle', glow: 'rgba(234, 179, 8, 0.6)' },
              { color: 'bg-green-500', name: 'Index', glow: 'rgba(34, 197, 94, 0.6)' },
              { color: 'bg-blue-500', name: 'Thumb', glow: 'rgba(59, 130, 246, 0.6)' },
            ].map((finger, i) => (
              <motion.div
                key={finger.name}
                className="flex flex-col items-center gap-3 p-4 bg-black/30 rounded-xl border border-white/10 hover:border-white/30 hover:bg-black/40 transition-all group"
                whileHover={{ scale: 1.05, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + i * 0.05 }}
              >
                <motion.div
                  className={`w-12 h-12 rounded-full ${finger.color}`}
                  style={{
                    boxShadow: `0 0 20px ${finger.glow}`,
                  }}
                  whileHover={{
                    boxShadow: [
                      `0 0 20px ${finger.glow}`,
                      `0 0 40px ${finger.glow}`,
                      `0 0 20px ${finger.glow}`,
                    ],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                  {finger.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 5. Quick Tips (Collapsible) */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold">Quick Typing Tips</h3>
            {showTips ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {showTips && (
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep your fingers on the home row (ASDF JKL;) when not typing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Use the correct finger for each key to build muscle memory</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Return to home position after each keystroke</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Keep your wrists elevated and relaxed to avoid strain</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Practice regularly with the animated guide for best results</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
