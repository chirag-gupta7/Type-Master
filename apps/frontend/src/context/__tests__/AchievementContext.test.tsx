import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementProvider, useAchievements } from '../AchievementContext';
import { TooltipProvider } from '@/components/ui/tooltip';

jest.mock('react-confetti', () => {
  return function MockConfetti() {
    return <div data-testid="confetti" />;
  };
});

jest.mock('framer-motion', () => {
  const React = jest.requireActual('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: any, Tag: any) => {
        const MotionMock = React.forwardRef(({ children, initial, animate, exit, transition, ...props }: any, ref: any) => {
          if (typeof Tag === 'string') {
            return React.createElement(Tag, { ...props, ref }, children);
          }
          return null;
        });
        MotionMock.displayName = `MotionMock(${String(Tag)})`;
        return MotionMock;
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

const achievement = {
  id: 'a1',
  title: 'Speed Demon',
  description: 'Reach 100 WPM',
  category: 'speed',
  points: 50,
};

function Trigger() {
  const { showAchievement } = useAchievements();
  return <button onClick={() => showAchievement(achievement)}>Unlock</button>;
}

const renderWithProviders = (ui: React.ReactElement) =>
  render(<TooltipProvider><AchievementProvider>{ui}</AchievementProvider></TooltipProvider>);

describe('AchievementProvider', () => {
  it('renders children', () => {
    renderWithProviders(<p>Child content</p>);
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('opens the unlock modal when showAchievement is called', async () => {
    renderWithProviders(<Trigger />);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }));
    expect(await screen.findByText('🎉 Achievement Unlocked!')).toBeInTheDocument();
    expect(screen.getByText('Speed Demon')).toBeInTheDocument();
  });

  it('throws when useAchievements is used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Outside() {
      useAchievements();
      return null;
    }
    expect(() => render(<Outside />)).toThrow(
      'useAchievements must be used within an AchievementProvider'
    );
    spy.mockRestore();
  });
});
