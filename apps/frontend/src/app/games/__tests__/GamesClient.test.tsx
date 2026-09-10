import { render, screen } from '@testing-library/react';
import GamesClient from '../GamesClient';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/api', () => ({
  gameAPI: { getStats: jest.fn() },
}));

jest.mock('@/store/games', () => {
  const state = {
    currentGame: null,
    gamesPlayed: 0,
    isGuest: true,
    backendGamesPlayed: 0,
    backendHighScores: { 'word-blitz': 0, 'prompt-dash': 0, 'story-chain': 0 },
    highScore: 0,
    setCurrentGame: jest.fn(),
    setGuestMode: jest.fn(),
    hydrateGuestGamesPlayed: jest.fn(),
    setBackendStats: jest.fn(),
  };
  return { useGameStore: (sel: any) => (typeof sel === 'function' ? sel(state) : state) };
});

jest.mock('framer-motion', () => {
  const React = jest.requireActual('react');
  const MotionDiv = React.forwardRef(
    ({ children, initial, animate, exit, transition, whileHover, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )
  );
  MotionDiv.displayName = 'MotionDiv';
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('GamesClient', () => {
  it('renders the games catalogue with all three games', () => {
    render(<GamesClient />);
    expect(screen.getByRole('heading', { name: /Make practice fun/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Word Blitz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Prompt Dash' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Story Chain' })).toBeInTheDocument();
  });

  it('shows guest notice and stats panel', () => {
    render(<GamesClient />);
    expect(screen.getByText(/Guest: 1 free game/)).toBeInTheDocument();
    expect(screen.getByText('Your stats')).toBeInTheDocument();
  });
});
