import { render, screen } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton', () => {
  it('renders a pulsing placeholder', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('applies pulse animation and merges custom class', () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-full" />);
    const el = screen.getByTestId('skeleton');
    expect(el.className).toMatch(/animate-pulse/);
    expect(el.className).toMatch(/h-4/);
  });
});
