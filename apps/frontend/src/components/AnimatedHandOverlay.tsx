'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  targetKey?: string;
  pressedKey?: string;
  isCorrect?: boolean;
  className?: string;
}

const FINGER_ZONES: Record<string, { keys: string[]; color: string; glow: string }> = {
  leftPinky: { keys: ['Q','A','Z','1','`','Tab','CapsLock','Shift'], color: 'from-red-500/45 to-transparent', glow: 'rgba(239,68,68,0.4)' },
  leftRing: { keys: ['W','S','X','2'], color: 'from-orange-500/45 to-transparent', glow: 'rgba(249,115,22,0.4)' },
  leftMiddle: { keys: ['E','D','C','3'], color: 'from-yellow-500/45 to-transparent', glow: 'rgba(234,179,8,0.4)' },
  leftIndex: { keys: ['R','F','V','T','G','B','4','5'], color: 'from-green-500/45 to-transparent', glow: 'rgba(34,197,94,0.4)' },
  rightIndex: { keys: ['Y','H','N','U','J','M','6','7'], color: 'from-green-500/45 to-transparent', glow: 'rgba(34,197,94,0.4)' },
  rightMiddle: { keys: ['I','K',',','8'], color: 'from-yellow-500/45 to-transparent', glow: 'rgba(234,179,8,0.4)' },
  rightRing: { keys: ['O','L','.','9'], color: 'from-orange-500/45 to-transparent', glow: 'rgba(249,115,22,0.4)' },
  rightPinky: { keys: ['P',';','/','0','[',']',"'",'\\','Enter','Backspace','-','='], color: 'from-red-500/45 to-transparent', glow: 'rgba(239,68,68,0.4)' },
  thumbs: { keys: [' ','Space'], color: 'from-blue-500/45 to-transparent', glow: 'rgba(59,130,246,0.4)' },
};

const getFingerZone = (key: string) => {
  const upper = key.toUpperCase();
  for (const [zone, data] of Object.entries(FINGER_ZONES)) if (data.keys.includes(upper) || data.keys.includes(key)) return { zone, ...data };
  return null;
};

export function AnimatedHandOverlay({ targetKey, pressedKey, className = '' }: Props) {
  const targetZone = useMemo(() => (targetKey ? getFingerZone(targetKey) : null), [targetKey]);
  const pressedZone = useMemo(() => (pressedKey ? getFingerZone(pressedKey) : null), [pressedKey]);

  const HandSVG = ({ side }: { side: 'left' | 'right' }) => {
    const isLeft = side === 'left';
    const zones = isLeft ? ['leftPinky','leftRing','leftMiddle','leftIndex','thumbs'] : ['rightPinky','rightRing','rightMiddle','rightIndex','thumbs'];
    // keep reuse by mirroring left gradients via transform
    return (
      <div className={cn('relative w-[220px] h-[280px] rounded-2xl border bg-card/40 backdrop-blur p-2', targetZone && zones.includes(targetZone.zone) && 'ring-1 ring-[var(--theme-primary)]/30')}>
        <svg viewBox="0 0 200 300" className={cn('h-full w-full', !isLeft && 'scale-x-[-1]')}>
          <defs>
            <filter id={`glow-${side}`}><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id={`grad-${side}-pinky`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.65"/><stop offset="100%" stopColor="#ec4899" stopOpacity="0.3"/></linearGradient>
            <linearGradient id={`grad-${side}-ring`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f97316" stopOpacity="0.65"/><stop offset="100%" stopColor="#fb923c" stopOpacity="0.3"/></linearGradient>
            <linearGradient id={`grad-${side}-middle`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#eab308" stopOpacity="0.65"/><stop offset="100%" stopColor="#facc15" stopOpacity="0.3"/></linearGradient>
            <linearGradient id={`grad-${side}-index`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.65"/><stop offset="100%" stopColor="#4ade80" stopOpacity="0.3"/></linearGradient>
            <linearGradient id={`grad-${side}-thumb`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.65"/><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3"/></linearGradient>
          </defs>
          <motion.path d="M 80 150 Q 60 180 60 220 L 60 280 Q 60 290 70 290 L 120 290 Q 130 290 130 280 L 130 150 Z" fill={`url(#grad-${side}-thumb)`} stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#glow-${side})`} animate={{ opacity: targetZone?.zone === 'thumbs' ? 1 : 0.35, scale: targetZone?.zone === 'thumbs' ? 1.03 : 1 }} transition={{ duration: 0.25 }} />
          <motion.path d="M 20 80 L 15 40 Q 15 30 20 28 Q 25 30 25 40 L 30 80 Z" fill={`url(#grad-${side}-pinky)`} stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#glow-${side})`} animate={{ opacity: targetZone?.zone === (isLeft ? 'leftPinky' : 'rightPinky') ? 1 : 0.35, y: pressedZone?.zone === (isLeft ? 'leftPinky' : 'rightPinky') ? -4 : 0 }} transition={{ duration: 0.2 }} />
          <motion.path d="M 40 60 L 35 20 Q 35 10 40 8 Q 45 10 45 20 L 50 60 Z" fill={`url(#grad-${side}-ring)`} stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#glow-${side})`} animate={{ opacity: targetZone?.zone === (isLeft ? 'leftRing' : 'rightRing') ? 1 : 0.35, y: pressedZone?.zone === (isLeft ? 'leftRing' : 'rightRing') ? -4 : 0 }} transition={{ duration: 0.2 }} />
          <motion.path d="M 60 55 L 55 15 Q 55 5 60 3 Q 65 5 65 15 L 70 55 Z" fill={`url(#grad-${side}-middle)`} stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#glow-${side})`} animate={{ opacity: targetZone?.zone === (isLeft ? 'leftMiddle' : 'rightMiddle') ? 1 : 0.35, y: pressedZone?.zone === (isLeft ? 'leftMiddle' : 'rightMiddle') ? -4 : 0 }} transition={{ duration: 0.2 }} />
          <motion.path d="M 80 60 L 75 20 Q 75 10 80 8 Q 85 10 85 20 L 90 60 Z" fill={`url(#grad-${side}-index)`} stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#glow-${side})`} animate={{ opacity: targetZone?.zone === (isLeft ? 'leftIndex' : 'rightIndex') ? 1 : 0.35, y: pressedZone?.zone === (isLeft ? 'leftIndex' : 'rightIndex') ? -4 : 0 }} transition={{ duration: 0.2 }} />
          <motion.path d="M 100 180 Q 110 160 130 160 Q 140 160 140 170 Q 140 180 130 190 Q 110 200 100 200 Z" fill={`url(#grad-${side}-thumb)`} stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#glow-${side})`} animate={{ opacity: targetZone?.zone === 'thumbs' ? 1 : 0.35, x: pressedZone?.zone === 'thumbs' ? 4 : 0 }} transition={{ duration: 0.2 }} />
        </svg>
        {targetZone && ((isLeft && targetZone.zone.startsWith('left')) || (!isLeft && targetZone.zone.startsWith('right')) || targetZone.zone === 'thumbs') && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border bg-card px-2.5 py-1 text-[11px] font-semibold tracking-wide" style={{ color: targetZone.glow.replace('0.4','1') }}>
            {targetZone.zone.replace('left','').replace('right','').replace('thumbs','Thumb').replace(/([A-Z])/g,' $1').trim()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-4', className)} role="img" aria-label="Hand overlay showing active finger">
      <HandSVG side="left" />
      <HandSVG side="right" />
    </div>
  );
}
