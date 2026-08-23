import { render, screen, fireEvent } from '@testing-library/react';
import { AchievementToast } from '../AchievementToast';

describe('AchievementToast Accessibility', () => {
  const mockAchievement = {
    id: 'ach-1',
    title: 'Speed Demon',
    description: 'Reach 100 WPM',
    category: 'speed',
    points: 50,
  };

  it('renders close button with accessible aria-label and handles click', () => {
    const handleClose = jest.fn();
    render(<AchievementToast achievement={mockAchievement} onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: 'Dismiss notification' });
    expect(closeButton).toBeDefined();
    expect(closeButton).not.toBeNull();

    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
