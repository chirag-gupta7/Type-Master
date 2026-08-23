import React from 'react';
import { render, screen } from '@testing-library/react';
import TypingTest from '../TypingTest';

// Mock framer-motion to avoid animation timing issues in test environment
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('TypingTest Accessibility', () => {
  it('renders duration buttons with proper ARIA attributes and type="button"', () => {
    render(<TypingTest />);

    const button30s = screen.getByRole('button', {
      name: 'Select 30 seconds test duration',
    });
    expect(button30s).toBeDefined();
    expect(button30s.getAttribute('type')).toBe('button');

    const button1m = screen.getByRole('button', {
      name: 'Select 1 minutes test duration',
    });
    expect(button1m).toBeDefined();
    expect(button1m.getAttribute('aria-pressed')).toBe('true');

    const startButton = screen.getByRole('button', { name: /Start|Loading/i });
    expect(startButton).toBeDefined();
    expect(startButton.getAttribute('type')).toBe('button');
  });
});
