import { render, screen } from '@testing-library/react';
import { VisualKeyboard } from '../VisualKeyboard';

describe('VisualKeyboard', () => {
  it('renders the keyboard region with space key and legend', () => {
    render(<VisualKeyboard />);
    expect(screen.getByRole('region', { name: 'Visual keyboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Space')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Miss')).toBeInTheDocument();
  });

  it('highlights the target key', () => {
    const { container } = render(<VisualKeyboard targetKey="a" />);
    const key = container.querySelector('[data-keycode="KeyA"]');
    expect(key).not.toBeNull();
    expect(key!.className).toMatch(/scale-\[1\.02\]/);
  });

  it('marks a wrong pressed key as incorrect', () => {
    const { container } = render(<VisualKeyboard pressedKey="b" isCorrect={false} />);
    const key = container.querySelector('[data-keycode="KeyB"]');
    expect(key).not.toBeNull();
    expect(key!.className).toMatch(/bg-red-500/);
  });
});
