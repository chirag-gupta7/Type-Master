'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Finger types with associated colors
type FingerType = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';

interface FingerColor {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
}

const FINGER_COLORS: Record<FingerType, FingerColor> = {
  pinky: {
    name: 'Pinky',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    shadowColor: 'shadow-red-500/50',
  },
  ring: {
    name: 'Ring',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500',
    shadowColor: 'shadow-orange-500/50',
  },
  middle: {
    name: 'Middle',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    shadowColor: 'shadow-yellow-500/50',
  },
  index: {
    name: 'Index',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    shadowColor: 'shadow-green-500/50',
  },
  thumb: {
    name: 'Thumb',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    shadowColor: 'shadow-blue-500/50',
  },
};

// Key-to-finger mapping for QWERTY layout
interface KeyMapping {
  key: string;
  finger: FingerType;
  hand: 'left' | 'right';
  row: number;
  position: number;
}

const KEY_MAPPINGS: KeyMapping[] = [
  // Left hand - Row 1 (numbers)
  { key: '`', finger: 'pinky', hand: 'left', row: 0, position: 0 },
  { key: '1', finger: 'pinky', hand: 'left', row: 0, position: 1 },
  { key: '2', finger: 'ring', hand: 'left', row: 0, position: 2 },
  { key: '3', finger: 'middle', hand: 'left', row: 0, position: 3 },
  { key: '4', finger: 'index', hand: 'left', row: 0, position: 4 },
  { key: '5', finger: 'index', hand: 'left', row: 0, position: 5 },

  // Right hand - Row 1
  { key: '6', finger: 'index', hand: 'right', row: 0, position: 6 },
  { key: '7', finger: 'index', hand: 'right', row: 0, position: 7 },
  { key: '8', finger: 'middle', hand: 'right', row: 0, position: 8 },
  { key: '9', finger: 'ring', hand: 'right', row: 0, position: 9 },
  { key: '0', finger: 'pinky', hand: 'right', row: 0, position: 10 },
  { key: '-', finger: 'pinky', hand: 'right', row: 0, position: 11 },
  { key: '=', finger: 'pinky', hand: 'right', row: 0, position: 12 },

  // Left hand - Row 2 (QWERTY)
  { key: 'Q', finger: 'pinky', hand: 'left', row: 1, position: 0 },
  { key: 'W', finger: 'ring', hand: 'left', row: 1, position: 1 },
  { key: 'E', finger: 'middle', hand: 'left', row: 1, position: 2 },
  { key: 'R', finger: 'index', hand: 'left', row: 1, position: 3 },
  { key: 'T', finger: 'index', hand: 'left', row: 1, position: 4 },

  // Right hand - Row 2
  { key: 'Y', finger: 'index', hand: 'right', row: 1, position: 5 },
  { key: 'U', finger: 'index', hand: 'right', row: 1, position: 6 },
  { key: 'I', finger: 'middle', hand: 'right', row: 1, position: 7 },
  { key: 'O', finger: 'ring', hand: 'right', row: 1, position: 8 },
  { key: 'P', finger: 'pinky', hand: 'right', row: 1, position: 9 },
  { key: '[', finger: 'pinky', hand: 'right', row: 1, position: 10 },
  { key: ']', finger: 'pinky', hand: 'right', row: 1, position: 11 },

  // Left hand - Row 3 (Home row - ASDF)
  { key: 'A', finger: 'pinky', hand: 'left', row: 2, position: 0 },
  { key: 'S', finger: 'ring', hand: 'left', row: 2, position: 1 },
  { key: 'D', finger: 'middle', hand: 'left', row: 2, position: 2 },
  { key: 'F', finger: 'index', hand: 'left', row: 2, position: 3 },
  { key: 'G', finger: 'index', hand: 'left', row: 2, position: 4 },

  // Right hand - Row 3 (Home row - JKL;)
  { key: 'H', finger: 'index', hand: 'right', row: 2, position: 5 },
  { key: 'J', finger: 'index', hand: 'right', row: 2, position: 6 },
  { key: 'K', finger: 'middle', hand: 'right', row: 2, position: 7 },
  { key: 'L', finger: 'ring', hand: 'right', row: 2, position: 8 },
  { key: ';', finger: 'pinky', hand: 'right', row: 2, position: 9 },
  { key: "'", finger: 'pinky', hand: 'right', row: 2, position: 10 },

  // Left hand - Row 4 (ZXCV)
  { key: 'Z', finger: 'pinky', hand: 'left', row: 3, position: 0 },
  { key: 'X', finger: 'ring', hand: 'left', row: 3, position: 1 },
  { key: 'C', finger: 'middle', hand: 'left', row: 3, position: 2 },
  { key: 'V', finger: 'index', hand: 'left', row: 3, position: 3 },
  { key: 'B', finger: 'index', hand: 'left', row: 3, position: 4 },

  // Right hand - Row 4
  { key: 'N', finger: 'index', hand: 'right', row: 3, position: 5 },
  { key: 'M', finger: 'index', hand: 'right', row: 3, position: 6 },
  { key: ',', finger: 'middle', hand: 'right', row: 3, position: 7 },
  { key: '.', finger: 'ring', hand: 'right', row: 3, position: 8 },
  { key: '/', finger: 'pinky', hand: 'right', row: 3, position: 9 },

  // Space bar - thumbs
  { key: ' ', finger: 'thumb', hand: 'left', row: 4, position: 0 },
  { key: 'Space', finger: 'thumb', hand: 'right', row: 4, position: 0 },
];

interface HandPositionGuideProps {
  targetKey?: string;
  showArrow?: boolean;
  showFingerLabels?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * HandPositionGuide Component
 *
 * Displays animated hand silhouettes with finger-to-key mapping.
 * Shows which finger should press which key with color coding and animations.
 */
export function HandPositionGuide({
  targetKey,
  showArrow = true,
  showFingerLabels = true,
  compact = false,
  className,
}: HandPositionGuideProps) {
  // Normalize target key
  const normalizedTarget = targetKey
    ? targetKey === ' '
      ? 'Space'
      : targetKey.toUpperCase()
    : null;

  // Find the finger and hand for the target key
  const targetMapping = normalizedTarget
    ? KEY_MAPPINGS.find((m) => m.key.toUpperCase() === normalizedTarget)
    : null;

  const targetFinger = targetMapping?.finger;
  const targetHand = targetMapping?.hand;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Hands Visualization */}
      <div className="relative">
        <div className="flex justify-center items-end gap-8 md:gap-16">
          {/* Left Hand */}
          <div className="relative">
            <Hand
              hand="left"
              activeFinger={targetHand === 'left' ? targetFinger : undefined}
              compact={compact}
            />
            {showArrow && targetHand === 'left' && targetFinger && (
              <AnimatedArrow finger={targetFinger} direction="down" />
            )}
          </div>

          {/* Right Hand */}
          <div className="relative">
            <Hand
              hand="right"
              activeFinger={targetHand === 'right' ? targetFinger : undefined}
              compact={compact}
            />
            {showArrow && targetHand === 'right' && targetFinger && (
              <AnimatedArrow finger={targetFinger} direction="down" />
            )}
          </div>
        </div>

        {/* Target Key Label */}
        {targetKey && targetMapping && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-4"
          >
            <p className="text-sm text-muted-foreground">
              Press{' '}
              <span className="font-bold text-foreground">
                {targetKey === ' ' ? 'Space' : targetKey}
              </span>{' '}
              with your{' '}
              <span className={cn('font-semibold', FINGER_COLORS[targetMapping.finger].color)}>
                {targetMapping.hand} {FINGER_COLORS[targetMapping.finger].name.toLowerCase()}
              </span>
            </p>
          </motion.div>
        )}
      </div>

      {/* Finger Legend */}
      {showFingerLabels && (
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(FINGER_COLORS).map(([finger, colors]) => (
            <div
              key={finger}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all',
                colors.bgColor,
                colors.borderColor,
                targetFinger === finger && 'ring-2 ring-offset-2'
              )}
            >
              <div className={cn('w-3 h-3 rounded-full', colors.color.replace('text-', 'bg-'))} />
              <span className={cn('text-sm font-medium', colors.color)}>{colors.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Home Row Reminder */}
      {!targetKey && (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Home Row Position:</span> Keep your fingers on{' '}
            <span className="font-mono font-bold">ASDF</span> (left hand) and{' '}
            <span className="font-mono font-bold">JKL;</span> (right hand)
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Hand Component - Renders a single hand with finger highlights
 */
interface HandProps {
  hand: 'left' | 'right';
  activeFinger?: FingerType;
  compact?: boolean;
}

function Hand({ hand, activeFinger, compact = false }: HandProps) {
  const fingers: FingerType[] =
    hand === 'left'
      ? ['pinky', 'ring', 'middle', 'index', 'thumb']
      : ['thumb', 'index', 'middle', 'ring', 'pinky'];

  const size = compact ? 'small' : 'normal';
  const handWidth = size === 'small' ? 120 : 160;
  const handHeight = size === 'small' ? 140 : 180;

  return (
    <div className="relative" style={{ width: handWidth, height: handHeight }}>
      <svg viewBox={`0 0 ${handWidth} ${handHeight}`} className="w-full h-full">
        {/* Palm */}
        <motion.rect
          x={hand === 'left' ? 15 : 25}
          y={handHeight - 80}
          width={handWidth - 40}
          height={70}
          rx="15"
          className={cn(
            'fill-card stroke-border transition-all duration-300',
            activeFinger && 'stroke-2'
          )}
          initial={{ opacity: 0.8 }}
          animate={{
            opacity: activeFinger ? 1 : 0.8,
            scale: activeFinger ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Fingers */}
        {fingers.map((finger, index) => {
          const isActive = activeFinger === finger;
          const colors = FINGER_COLORS[finger];

          // Calculate finger positions
          let x: number, y: number, width: number, height: number;

          if (finger === 'thumb') {
            // Thumb position (side of hand)
            x = hand === 'left' ? 5 : handWidth - 25;
            y = handHeight - 60;
            width = 18;
            height = 45;
          } else {
            // Regular finger positions
            const fingerIndex = hand === 'left' ? index : index - 1;
            const spacing = (handWidth - 50) / 4;
            x = 20 + fingerIndex * spacing;
            y = handHeight - 150 - Math.abs(fingerIndex - 1.5) * 8; // Slight arch
            width = 16;
            height = 75;
          }

          return (
            <motion.g key={`${hand}-${finger}`}>
              {/* Finger */}
              <motion.rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx="8"
                className={cn(
                  'transition-all duration-300',
                  isActive
                    ? `${colors.bgColor} ${colors.borderColor} stroke-2`
                    : 'fill-card stroke-border'
                )}
                initial={{ scale: 1 }}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? y - 5 : y,
                }}
                transition={{
                  duration: 0.3,
                  type: 'spring',
                  stiffness: 300,
                }}
              />

              {/* Finger tip highlight */}
              {isActive && (
                <motion.circle
                  cx={x + width / 2}
                  cy={y + 5}
                  r="4"
                  className={colors.color.replace('text-', 'fill-')}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    opacity: [0, 1, 0.8],
                  }}
                  transition={{ duration: 0.5 }}
                />
              )}

              {/* Glow effect for active finger */}
              {isActive && (
                <motion.rect
                  x={x - 4}
                  y={y - 4}
                  width={width + 8}
                  height={height + 8}
                  rx="10"
                  className={cn(colors.borderColor, 'fill-none stroke-2')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Hand Label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground capitalize">
        {hand} Hand
      </div>
    </div>
  );
}

/**
 * AnimatedArrow Component - Shows arrow pointing to target key
 */
interface AnimatedArrowProps {
  finger: FingerType;
  direction: 'up' | 'down' | 'left' | 'right';
}

function AnimatedArrow({ finger, direction }: AnimatedArrowProps) {
  const colors = FINGER_COLORS[finger];

  const rotations = {
    up: 180,
    down: 0,
    left: 90,
    right: -90,
  };

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 -bottom-12"
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: [0.3, 1, 0.3],
        y: [-10, -5, -10],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        style={{ transform: `rotate(${rotations[direction]}deg)` }}
      >
        <motion.path
          d="M12 4L12 20M12 20L6 14M12 20L18 14"
          className={cn('stroke-current', colors.color)}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  );
}

/**
 * Get finger for a specific key
 * Useful for external components
 */
export function getFingerForKey(key: string): {
  finger: FingerType;
  hand: 'left' | 'right';
  color: FingerColor;
} | null {
  const normalizedKey = key === ' ' ? 'Space' : key.toUpperCase();
  const mapping = KEY_MAPPINGS.find((m) => m.key.toUpperCase() === normalizedKey);

  if (!mapping) return null;

  return {
    finger: mapping.finger,
    hand: mapping.hand,
    color: FINGER_COLORS[mapping.finger],
  };
}
