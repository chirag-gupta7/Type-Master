/**
 * AchievementUnlockAnimation Component
 *
 * Displays a celebration animation when an achievement is unlocked
 * Features:
 * - Confetti effect using canvas
 * - Bouncing achievement card
 * - Sound effect support (optional)
 * - Auto-dismiss with manual control
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles } from 'lucide-react';
import { AchievementIcon } from './AchievementCard';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  life: number;
}

interface AchievementUnlockAnimationProps {
  isOpen: boolean;
  // Removed onClose prop to keep props serializable for "use client" entry files.
  // Use the dispatched 'achievement-unlock-close' CustomEvent to handle close from parent.
  achievement: {
    title: string;
    description: string;
    icon: AchievementIcon;
    points: number;
  };
  duration?: number; // Auto-close duration in ms (0 to disable)
}

const CONFETTI_COLORS = [
  '#FFD700', // Gold
  '#FFA500', // Orange
  '#FF6347', // Tomato
  '#FF69B4', // Pink
  '#87CEEB', // Sky Blue
  '#98FB98', // Pale Green
  '#DDA0DD', // Plum
  '#F0E68C', // Khaki
];

export const AchievementUnlockAnimation: React.FC<AchievementUnlockAnimationProps> = ({
  isOpen,
  achievement,
  duration = 5000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);

  // Dispatchable close event so parent (server components) can remain serializable.
  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievement-unlock-close'));
    }
  };

  // Initialize confetti particles
  const createConfetti = () => {
    const particles: Particle[] = [];
    const particleCount = 150;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 3 + Math.random() * 8;

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - Math.random() * 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0.15 + Math.random() * 0.1,
        life: 1,
      });
    }

    return particles;
  };

  // Animate confetti
  const animateConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.gravity;
      particle.rotation += particle.rotationSpeed;
      particle.life -= 0.01;

      // Draw particle
      if (particle.life > 0) {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;

        // Draw rectangle (confetti piece)
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size / 2);

        ctx.restore();
      }

      return particle.life > 0 && particle.y < canvas.height + 100;
    });

    // Continue animation if particles exist
    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animateConfetti);
    } else {
      animationFrameRef.current = null;
    }
  };

  // Start/stop confetti animation when isOpen changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (isOpen) {
      // Prepare canvas
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      // create particles and start animation
      particlesRef.current = createConfetti();
      animationFrameRef.current = requestAnimationFrame(animateConfetti);

      // Auto-close after duration
      if (duration > 0) {
        // store timer id
        autoCloseTimerRef.current = window.setTimeout(() => {
          handleClose();
        }, duration);
      }
    }

    return () => {
      // cleanup animation frame and timer
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (autoCloseTimerRef.current != null) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      // clear particles
      particlesRef.current = [];
    };
  }, [isOpen, duration]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Confetti Canvas */}
          <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ width: '100vw', height: '100vh' }}
          />

          {/* Achievement Card */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{
                scale: 1,
                rotate: 0,
                opacity: 1,
                y: [0, -20, 0],
              }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              className="pointer-events-auto relative bg-gradient-to-br from-yellow-500/30 to-yellow-400/20 p-8 rounded-2xl shadow-2xl max-w-lg w-full mx-4"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Sparkles decoration */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute -top-4 -left-4"
              >
                <Sparkles className="w-8 h-8 text-yellow-300 fill-yellow-300" />
              </motion.div>

              <motion.div
                animate={{
                  rotate: [0, -360],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute -bottom-4 -right-4"
              >
                <Sparkles className="w-8 h-8 text-amber-300 fill-amber-300" />
              </motion.div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 10,
                }}
                className="flex justify-center mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold text-white mb-2">Achievement Unlocked!</h2>
                <h3 className="text-2xl font-bold text-yellow-100 mb-3">{achievement.title}</h3>
                <p className="text-yellow-50 mb-4">{achievement.description}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full">
                  <Sparkles className="w-5 h-5 text-yellow-100" />
                  <span className="text-lg font-bold text-white">+{achievement.points} Points</span>
                </div>
              </motion.div>

              {/* Pulse rings */}
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 border-4 border-yellow-300 rounded-2xl pointer-events-none"
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AchievementUnlockAnimation;
