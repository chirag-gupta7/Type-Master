'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface AnimatedHandOverlayProps {
  targetKey?: string;
  pressedKey?: string;
  isCorrect?: boolean;
  className?: string;
}

// Finger-to-key mapping with color zones
const FINGER_ZONES = {
  leftPinky: {
    keys: ['Q', 'A', 'Z', '1', '`', 'Tab', 'CapsLock', 'Shift'],
    color: 'from-red-500/40 via-pink-500/30 to-transparent',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  leftRing: {
    keys: ['W', 'S', 'X', '2'],
    color: 'from-orange-500/40 via-orange-400/30 to-transparent',
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  leftMiddle: {
    keys: ['E', 'D', 'C', '3'],
    color: 'from-yellow-500/40 via-yellow-400/30 to-transparent',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  leftIndex: {
    keys: ['R', 'F', 'V', 'T', 'G', 'B', '4', '5'],
    color: 'from-green-500/40 via-green-400/30 to-transparent',
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },
  rightIndex: {
    keys: ['Y', 'H', 'N', 'U', 'J', 'M', '6', '7'],
    color: 'from-green-500/40 via-green-400/30 to-transparent',
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },
  rightMiddle: {
    keys: ['I', 'K', ',', '8'],
    color: 'from-yellow-500/40 via-yellow-400/30 to-transparent',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  rightRing: {
    keys: ['O', 'L', '.', '9'],
    color: 'from-orange-500/40 via-orange-400/30 to-transparent',
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  rightPinky: {
    keys: ['P', ';', '/', '0', '[', ']', "'", '\\', 'Enter', 'Backspace', '-', '='],
    color: 'from-red-500/40 via-pink-500/30 to-transparent',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  thumbs: {
    keys: [' ', 'Space'],
    color: 'from-blue-500/40 via-cyan-400/30 to-transparent',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
};

const getFingerZone = (key: string) => {
  const upperKey = key.toUpperCase();
  for (const [zone, data] of Object.entries(FINGER_ZONES)) {
    if (data.keys.includes(upperKey) || data.keys.includes(key)) {
      return { zone, ...data };
    }
  }
  return null;
};

export function AnimatedHandOverlay({
  targetKey,
  pressedKey,
  isCorrect: _isCorrect,
  className = '',
}: AnimatedHandOverlayProps) {
  const targetZone = useMemo(() => (targetKey ? getFingerZone(targetKey) : null), [targetKey]);
  const pressedZone = useMemo(() => (pressedKey ? getFingerZone(pressedKey) : null), [pressedKey]);

  return (
    <div className={`relative ${className}`}>
      {/* Left Hand */}
      <motion.div
        className="absolute left-0 top-0 w-64 h-64 pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <svg viewBox="0 0 200 300" className="w-full h-full">
          <defs>
            <filter id="glow-left">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="leftPinkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="leftRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="leftMiddleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="leftIndexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="leftThumbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Palm */}
          <motion.path
            d="M 80 150 Q 60 180 60 220 L 60 280 Q 60 290 70 290 L 120 290 Q 130 290 130 280 L 130 150 Z"
            fill="url(#leftThumbGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'thumbs' ? 1 : 0.3,
              scale: targetZone?.zone === 'thumbs' ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Pinky */}
          <motion.path
            d="M 20 80 L 15 40 Q 15 30 20 28 Q 25 30 25 40 L 30 80 Z"
            fill="url(#leftPinkyGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'leftPinky' ? 1 : 0.3,
              scale: targetZone?.zone === 'leftPinky' ? 1.1 : 1,
              y: pressedZone?.zone === 'leftPinky' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Ring Finger */}
          <motion.path
            d="M 40 60 L 35 20 Q 35 10 40 8 Q 45 10 45 20 L 50 60 Z"
            fill="url(#leftRingGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'leftRing' ? 1 : 0.3,
              scale: targetZone?.zone === 'leftRing' ? 1.1 : 1,
              y: pressedZone?.zone === 'leftRing' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Middle Finger */}
          <motion.path
            d="M 60 55 L 55 15 Q 55 5 60 3 Q 65 5 65 15 L 70 55 Z"
            fill="url(#leftMiddleGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'leftMiddle' ? 1 : 0.3,
              scale: targetZone?.zone === 'leftMiddle' ? 1.1 : 1,
              y: pressedZone?.zone === 'leftMiddle' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Index Finger */}
          <motion.path
            d="M 80 60 L 75 20 Q 75 10 80 8 Q 85 10 85 20 L 90 60 Z"
            fill="url(#leftIndexGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'leftIndex' ? 1 : 0.3,
              scale: targetZone?.zone === 'leftIndex' ? 1.1 : 1,
              y: pressedZone?.zone === 'leftIndex' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Thumb */}
          <motion.path
            d="M 100 180 Q 110 160 130 160 Q 140 160 140 170 Q 140 180 130 190 Q 110 200 100 200 Z"
            fill="url(#leftThumbGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'thumbs' ? 1 : 0.3,
              scale: targetZone?.zone === 'thumbs' ? 1.1 : 1,
              x: pressedZone?.zone === 'thumbs' ? 5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        {/* Finger Label */}
        {targetZone && targetZone.zone.startsWith('left') && (
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold"
            style={{ color: targetZone.glowColor.replace('0.4', '1') }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {targetZone.zone
              .replace('left', '')
              .replace(/([A-Z])/g, ' $1')
              .trim()}
          </motion.div>
        )}
      </motion.div>

      {/* Right Hand */}
      <motion.div
        className="absolute right-0 top-0 w-64 h-64 pointer-events-none"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <svg viewBox="0 0 200 300" className="w-full h-full transform scale-x-[-1]">
          <defs>
            <linearGradient id="rightPinkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="rightRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="rightMiddleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="rightIndexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Palm */}
          <motion.path
            d="M 80 150 Q 60 180 60 220 L 60 280 Q 60 290 70 290 L 120 290 Q 130 290 130 280 L 130 150 Z"
            fill="url(#leftThumbGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'thumbs' ? 1 : 0.3,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Pinky */}
          <motion.path
            d="M 20 80 L 15 40 Q 15 30 20 28 Q 25 30 25 40 L 30 80 Z"
            fill="url(#rightPinkyGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'rightPinky' ? 1 : 0.3,
              scale: targetZone?.zone === 'rightPinky' ? 1.1 : 1,
              y: pressedZone?.zone === 'rightPinky' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Ring Finger */}
          <motion.path
            d="M 40 60 L 35 20 Q 35 10 40 8 Q 45 10 45 20 L 50 60 Z"
            fill="url(#rightRingGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'rightRing' ? 1 : 0.3,
              scale: targetZone?.zone === 'rightRing' ? 1.1 : 1,
              y: pressedZone?.zone === 'rightRing' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Middle Finger */}
          <motion.path
            d="M 60 55 L 55 15 Q 55 5 60 3 Q 65 5 65 15 L 70 55 Z"
            fill="url(#rightMiddleGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'rightMiddle' ? 1 : 0.3,
              scale: targetZone?.zone === 'rightMiddle' ? 1.1 : 1,
              y: pressedZone?.zone === 'rightMiddle' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Index Finger */}
          <motion.path
            d="M 80 60 L 75 20 Q 75 10 80 8 Q 85 10 85 20 L 90 60 Z"
            fill="url(#rightIndexGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'rightIndex' ? 1 : 0.3,
              scale: targetZone?.zone === 'rightIndex' ? 1.1 : 1,
              y: pressedZone?.zone === 'rightIndex' ? -5 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Thumb */}
          <motion.path
            d="M 100 180 Q 110 160 130 160 Q 140 160 140 170 Q 140 180 130 190 Q 110 200 100 200 Z"
            fill="url(#leftThumbGrad)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            filter="url(#glow-left)"
            animate={{
              opacity: targetZone?.zone === 'thumbs' ? 1 : 0.3,
              scale: targetZone?.zone === 'thumbs' ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        </svg>

        {/* Finger Label */}
        {targetZone && targetZone.zone.startsWith('right') && (
          <motion.div
            className="absolute bottom-4 right-1/2 translate-x-1/2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold"
            style={{ color: targetZone.glowColor.replace('0.4', '1') }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {targetZone.zone
              .replace('right', '')
              .replace(/([A-Z])/g, ' $1')
              .trim()}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
