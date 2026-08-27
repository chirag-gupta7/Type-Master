'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Hand } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

  const fingers: Record<string, { name: string; color: string; glow: string; pos: { x: number; y: number } }> = {
    pinky: { name: 'Pinky', color: '#ef4444', glow: 'rgba(239,68,68,0.45)', pos: isLeft ? { x: 28, y: 78 } : { x: 172, y: 78 } },
    ring: { name: 'Ring', color: '#f97316', glow: 'rgba(249,115,22,0.45)', pos: isLeft ? { x: 50, y: 60 } : { x: 150, y: 60 } },
    middle: { name: 'Middle', color: '#eab308', glow: 'rgba(234,179,8,0.45)', pos: isLeft ? { x: 72, y: 50 } : { x: 128, y: 50 } },
    index: { name: 'Index', color: '#22c55e', glow: 'rgba(34,197,94,0.45)', pos: isLeft ? { x: 94, y: 60 } : { x: 106, y: 60 } },
    thumb: { name: 'Thumb', color: '#3b82f6', glow: 'rgba(59,130,246,0.45)', pos: isLeft ? { x: 118, y: 178 } : { x: 82, y: 178 } },
  };

  return (
    <div className={`relative overflow-hidden rounded-[20px] border bg-card/60 backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card/40">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest">
          <Hand className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> {isLeft ? 'LEFT' : 'RIGHT'} HAND
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={() => setRotationY((p) => (p + 15) % 360)} className="h-7 w-7 rounded-full" aria-label="Rotate hand model">
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rotate</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={() => setScale((p) => Math.min(p + 0.1, 1.5))} className="h-7 w-7 rounded-full" aria-label="Zoom in">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={() => setScale((p) => Math.max(p - 0.1, 0.75))} className="h-7 w-7 rounded-full" aria-label="Zoom out">
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <motion.div
        className="relative h-[360px]"
        style={{ perspective: '1000px' }}
        animate={{ rotateY: rotationY, scale }}
        transition={{ duration: 0.4 }}
      >
        <svg viewBox="0 0 200 300" className="h-full w-full">
          <defs>
            <radialGradient id={`palm-${hand}`} cx="50%" cy="40%">
              <stop offset="0%" stopColor="hsl(var(--card))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="1" />
            </radialGradient>
            <filter id={`shadow-${hand}`}>
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.25" />
            </filter>
            <filter id={`glow-${hand}`}>
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Palm */}
          <path
            d={isLeft ? 'M 72 148 Q 52 176 52 218 L 52 276 Q 52 290 66 290 L 134 290 Q 144 290 144 276 L 144 148 Q 144 138 134 138 L 82 138 Q 72 138 72 148 Z' : 'M 56 148 Q 52 138 62 138 L 118 138 Q 128 138 128 148 L 144 218 L 144 276 Q 144 290 130 290 L 66 290 Q 52 290 52 276 L 52 218 Q 52 176 56 148 Z'}
            fill={`url(#palm-${hand})`}
            stroke="hsl(var(--border))"
            strokeWidth="1.2"
            filter={`url(#shadow-${hand})`}
          />

          {Object.entries(fingers).map(([key, f]) => {
            const isActive = activeFinger?.toLowerCase() === key.toLowerCase();
            return (
              <g key={key}>
                <motion.ellipse
                  cx={f.pos.x}
                  cy={f.pos.y}
                  rx={isActive ? 12 : 10}
                  ry={isActive ? 34 : 28}
                  fill={f.color}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1.2"
                  filter={isActive ? `url(#glow-${hand})` : undefined}
                  animate={{ scale: isActive ? 1.06 : 1, opacity: isActive ? 1 : 0.9 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformOrigin: `${f.pos.x}px ${f.pos.y}px` } as React.CSSProperties}
                />
                {showPressureIndicators && isActive && (
                  <motion.circle cx={f.pos.x} cy={f.pos.y - 46} r="7" fill={f.color} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }} transition={{ duration: 1, repeat: Infinity }} />
                )}
                <text x={f.pos.x} y={f.pos.y + 56} textAnchor="middle" fontSize="10" fontWeight="600" fill={isActive ? f.color : 'hsl(var(--muted-foreground))'}>{f.name}</text>
              </g>
            );
          })}

          {showWristGuide && (
            <g>
              <motion.line x1="42" y1="286" x2="158" y2="286" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="6 6" animate={{ strokeOpacity: [0.35, 0.85, 0.35] }} transition={{ duration: 2, repeat: Infinity }} />
              <text x="100" y="280" textAnchor="middle" fontSize="9" fill="#22c55e">Wrist level</text>
            </g>
          )}
        </svg>

        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur">
          {isLeft ? 'Left' : 'Right'} hand • {Math.round(rotationY)}° • {scale.toFixed(1)}×
        </div>
      </motion.div>
    </div>
  );
}
