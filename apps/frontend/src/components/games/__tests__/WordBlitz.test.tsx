import { render, screen, fireEvent } from '@testing-library/react';
import { WordBlitz } from '../WordBlitz';

jest.mock('framer-motion', () => {
  const React = jest.requireActual('react');
  const mockTag = (Tag: any) => {
    const MockTag = React.forwardRef(({ children, initial, animate, exit, transition, ...props }: any, ref: any) => (
      <Tag ref={ref} {...props}>{children}</Tag>
    ));
    MockTag.displayName = `MockTag(${String(Tag)})`;
    return MockTag;
  };
  return {
    motion: { div: mockTag('div'), span: mockTag('span') },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('WordBlitz', () => {
  it('renders the idle screen with start button', () => {
    render(<WordBlitz />);
    expect(screen.getByRole('heading', { name: 'Word Blitz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start — 60s' })).toBeInTheDocument();
  });

  it('starts the game and shows the typing input', () => {
    render(<WordBlitz />);
    fireEvent.click(screen.getByRole('button', { name: 'Start — 60s' }));
    expect(screen.getByLabelText('Word Blitz input')).toBeInTheDocument();
    expect(screen.getByText(/Score 0/)).toBeInTheDocument();
  });
});
