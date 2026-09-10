import { render, screen, fireEvent } from '@testing-library/react';
import { StoryChain } from '../StoryChain';

jest.mock('@/lib/api', () => ({
  aiAPI: {
    getStoryResponse: jest.fn().mockResolvedValue({ response: 'Once upon a time.' }),
    getWritingFeedback: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('framer-motion', () => {
  const React = jest.requireActual('react');
  const MotionDiv = React.forwardRef(
    ({ children, initial, animate, exit, transition, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>{children}</div>
    )
  );
  MotionDiv.displayName = 'MotionDiv';
  return {
    motion: { div: MotionDiv },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('StoryChain', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used to follow the story).
    (Element.prototype as any).scrollIntoView = jest.fn();
  });
  it('renders the idle screen with start button', () => {
    render(<StoryChain />);
    expect(screen.getByRole('heading', { name: 'Story Chain' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start game' })).toBeInTheDocument();
  });

  it('starts the game after the AI provides the opening sentence', async () => {
    render(<StoryChain />);
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));
    expect(await screen.findByPlaceholderText('Type the next sentence…')).toBeInTheDocument();
    expect(screen.getByText('Once upon a time.')).toBeInTheDocument();
  });
});
