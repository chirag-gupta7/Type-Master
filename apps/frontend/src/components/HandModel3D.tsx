'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/button';

interface HandModel3DProps {
  hand: 'left' | 'right';
  activeFinger?: string;
  showPressureIndicators?: boolean;
  showWristGuide?: boolean;
  className?: string;
}

export function HandModel3D({
  hand,
  activeFinger,
  showPressureIndicators = true,
  showWristGuide = true,
  className = '',
}: HandModel3DProps) {
  const [rotationY, setRotationY] = useState(0);
  const [scale, setScale] = useState(1);

  const isLeft = hand === 'left';

  // Finger definitions with 3D perspective
  const fingers = {
    pinky: {
      name: 'Pinky',
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.8)',
      position: isLeft ? { x: 20, y: 80 } : { x: 180, y: 80 },
    },
    ring: {
      name: 'Ring',
      color: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.8)',
      position: isLeft ? { x: 45, y: 60 } : { x: 155, y: 60 },
    },
    middle: {
      name: 'Middle',
      color: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.8)',
      position: isLeft ? { x: 70, y: 50 } : { x: 130, y: 50 },
    },
    index: {
      name: 'Index',
      color: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.8)',
      position: isLeft ? { x: 95, y: 60 } : { x: 105, y: 60 },
    },
    thumb: {
      name: 'Thumb',
      color: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.8)',
      position: isLeft ? { x: 120, y: 180 } : { x: 80, y: 180 },
    },
  };

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-0 right-0 z-10 flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setRotationY((prev) => (prev + 15) % 360)}
          className="w-8 h-8 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-white/10"
        >
          <RotateCw className="h-4 w-4 text-cyan-400" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setScale((prev) => Math.min(prev + 0.1, 1.5))}
          className="w-8 h-8 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-white/10"
        >
          <ZoomIn className="h-4 w-4 text-cyan-400" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.7))}
          className="w-8 h-8 bg-black/50 backdrop-blur-sm border-white/20 hover:bg-white/10"
        >
          <ZoomOut className="h-4 w-4 text-cyan-400" />
        </Button>
      </div>

      {/* 3D Hand Model */}
      <motion.div
        className="relative w-full h-[400px]"
        style={{
          perspective: '1000px',
        }}
        animate={{
          rotateY: rotationY,
          scale: scale,
        }}
        transition={{ duration: 0.5 }}
      >
        <svg
          viewBox="0 0 200 300"
          className="w-full h-full drop-shadow-2xl"
          style={{
            filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))',
          }}
        >
          <defs>
            {/* 3D Lighting Effect */}
            <radialGradient id={`palmGlow-${hand}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
            </radialGradient>

            {/* Shadow */}
            <filter id={`shadow-${hand}`}>
              <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
              <feOffset dx="0" dy="10" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glow Filter */}
            <filter id={`glow-${hand}`}>
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Palm Base */}
          <motion.path
            d={
              isLeft
                ? 'M 70 150 Q 50 180 50 220 L 50 280 Q 50 295 65 295 L 135 295 Q 145 295 145 280 L 145 150 Q 145 140 135 140 L 80 140 Q 70 140 70 150 Z'
                : 'M 55 150 Q 50 140 60 140 L 120 140 Q 130 140 130 150 L 130 280 Q 130 295 120 295 L 65 295 Q 50 295 50 280 L 50 220 Q 50 180 55 150 Z'
            }
            fill="url(#palmGlow-${hand})"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
            filter={`url(#shadow-${hand})`}
            className="transition-all duration-300"
            style={{
              fill: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
            }}
          />

          {/* Render Each Finger */}
          {Object.entries(fingers).map(([key, finger]) => {
            const isActive = activeFinger?.toLowerCase() === key.toLowerCase();
            return (
              <g key={key}>
                {/* Finger */}
                <motion.ellipse
                  cx={finger.position.x}
                  cy={finger.position.y}
                  rx={isActive ? 12 : 10}
                  ry={isActive ? 35 : 30}
                  fill={finger.color}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="2"
                  filter={isActive ? `url(#glow-${hand})` : undefined}
                  animate={{
                    scale: isActive ? [1, 1.1, 1] : 1,
                    opacity: isActive ? 1 : 0.7,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isActive ? Infinity : 0,
                    repeatType: 'reverse',
                  }}
                  style={{
                    transformOrigin: `${finger.position.x}px ${finger.position.y}px`,
                    boxShadow: isActive ? `0 0 30px ${finger.glowColor}` : 'none',
                  }}
                />

                {/* Pressure Indicator */}
                {showPressureIndicators && isActive && (
                  <motion.circle
                    cx={finger.position.x}
                    cy={finger.position.y - 50}
                    r="8"
                    fill={finger.color}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}

                {/* Finger Label */}
                <text
                  x={finger.position.x}
                  y={finger.position.y + 60}
                  textAnchor="middle"
                  className="text-xs font-semibold"
                  fill={isActive ? finger.color : 'rgba(255, 255, 255, 0.5)'}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 5px ${finger.glowColor})` : 'none',
                  }}
                >
                  {finger.name}
                </text>
              </g>
            );
          })}

          {/* Wrist Guide Lines */}
          {showWristGuide && (
            <g>
              <motion.line
                x1="40"
                y1="290"
                x2="160"
                y2="290"
                stroke="#22c55e"
                strokeWidth="2"
                strokeDasharray="5,5"
                animate={{
                  strokeOpacity: [0.3, 0.8, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <text
                x="100"
                y="285"
                textAnchor="middle"
                className="text-xs"
                fill="#22c55e"
                opacity="0.7"
              >
                Wrist Level
              </text>
            </g>
          )}
        </svg>

        {/* Hand Label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <motion.div
            className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-full border border-cyan-500/30"
            whileHover={{ scale: 1.05 }}
            style={{
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
            }}
          >
            <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wide">
              {isLeft ? 'Left' : 'Right'} Hand
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Rotation Indicator */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
        Rotation: {rotationY}° | Scale: {scale.toFixed(1)}x
      </div>
    </div>
  );
}
