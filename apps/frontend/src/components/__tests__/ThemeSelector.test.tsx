import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from '../ThemeSelector';
import { TooltipProvider } from '../ui/tooltip';

// Mock framer-motion to execute animations synchronously in test environment
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      button: React.forwardRef(({ children, whileHover, whileTap, ...props }: any, ref: any) => (
        <button ref={ref} {...props}>{children}</button>
      )),
      div: React.forwardRef(({ children, initial, animate, exit, transition, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>{children}</div>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('ThemeSelector Accessibility', () => {
  it('opens theme picker modal on button click and closes with close button or Escape key', () => {
    render(
      <TooltipProvider>
        <ThemeSelector />
      </TooltipProvider>
    );

    const openButton = screen.getByRole('button', { name: 'Open theme picker' });
    expect(openButton).toBeDefined();

    // Open modal
    fireEvent.click(openButton);

    const closeButton = screen.getByRole('button', { name: 'Close theme picker' });
    expect(closeButton).toBeDefined();

    // Close via close button
    fireEvent.click(closeButton);
    expect(screen.queryByRole('button', { name: 'Close theme picker' })).toBeNull();

    // Open again and close via Escape key
    fireEvent.click(openButton);
    expect(screen.getByRole('button', { name: 'Close theme picker' })).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Close theme picker' })).toBeNull();
  });
});
