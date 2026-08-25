import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AchievementUnlockModal } from '../AchievementUnlockModal';

jest.mock('react-confetti', () => {
  return function MockConfetti() {
    return <div data-testid="confetti" />;
  };
});

describe('AchievementUnlockModal', () => {
  const dummyAchievement = {
    id: 'test-1',
    title: 'Speed Demon',
    description: 'Reach 100 WPM in a test',
    category: 'speed',
    points: 50,
  };

  const renderModal = (props: { achievement: typeof dummyAchievement | null; isOpen: boolean }) => {
    return render(
      <TooltipProvider>
        <AchievementUnlockModal {...props} />
      </TooltipProvider>
    );
  };

  it('renders modal with proper accessibility attributes when open', () => {
    renderModal({
      achievement: dummyAchievement,
      isOpen: true,
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('achievement-modal-title');

    const title = screen.getByText('🎉 Achievement Unlocked!');
    expect(title).toBeDefined();
    expect(title.getAttribute('id')).toBe('achievement-modal-title');
  });

  it('renders close button with correct aria-label and dispatches close event on click', () => {
    const handleClose = jest.fn();
    window.addEventListener('achievement-modal-close', handleClose);

    renderModal({
      achievement: dummyAchievement,
      isOpen: true,
    });

    const closeButton = screen.getByRole('button', { name: 'Close achievement modal' });
    expect(closeButton).toBeDefined();

    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);

    window.removeEventListener('achievement-modal-close', handleClose);
  });

  it('does not render content when isOpen is false', () => {
    renderModal({
      achievement: dummyAchievement,
      isOpen: false,
    });

    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeNull();
  });
});
