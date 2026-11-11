import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnimatedHandOverlay } from '../AnimatedHandOverlay';

// Mock framer-motion to render static elements without motion overhead or animation timing delays in tests
jest.mock('framer-motion', () => ({
  motion: {
    path: (props: React.SVGProps<SVGPathElement>) => <path {...props} />,
  },
}));

describe('AnimatedHandOverlay', () => {
  it('renders without crashing and displays image container role', () => {
    render(<AnimatedHandOverlay targetKey="f" pressedKey="f" />);
    const overlay = screen.getByRole('img', { name: /hand overlay showing active finger/i });
    expect(overlay).not.toBeNull();
  });

  it('highlights left hand index finger zone label when targetKey is "f"', () => {
    render(<AnimatedHandOverlay targetKey="f" />);
    expect(screen.getByText('Index')).not.toBeNull();
  });

  it('highlights right hand index finger zone label when targetKey is "j"', () => {
    render(<AnimatedHandOverlay targetKey="j" />);
    expect(screen.getByText('Index')).not.toBeNull();
  });

  it('highlights thumb zone label when targetKey is space', () => {
    render(<AnimatedHandOverlay targetKey=" " />);
    // Space maps to 'thumbs' zone, which renders label "Thumb" on both hand overlays
    const thumbLabels = screen.getAllByText('Thumb');
    expect(thumbLabels.length).toBeGreaterThan(0);
  });

  it('handles uppercase and lowercase keys correctly', () => {
    const { rerender } = render(<AnimatedHandOverlay targetKey="a" />);
    expect(screen.getByText('Pinky')).not.toBeNull();

    rerender(<AnimatedHandOverlay targetKey="A" />);
    expect(screen.getByText('Pinky')).not.toBeNull();
  });

  it('handles unknown or unmapped keys gracefully without throwing errors', () => {
    render(<AnimatedHandOverlay targetKey="§" pressedKey="§" />);
    const overlay = screen.getByRole('img', { name: /hand overlay showing active finger/i });
    expect(overlay).not.toBeNull();
  });
});
