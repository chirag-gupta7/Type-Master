import { render, screen } from '@testing-library/react';
import ResultsScreen from '../ResultsScreen';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

jest.mock('@/lib/api', () => ({
  lessonAPI: { saveLessonProgress: jest.fn() },
  testAPI: { saveTestResult: jest.fn() },
  achievementAPI: { checkAchievements: jest.fn() },
}));

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
    motion: { div: mockTag('div'), circle: mockTag('circle') },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

const baseProps = {
  wpm: 60,
  accuracy: 95,
  errors: 2,
  duration: 60,
  correctChars: 300,
  incorrectChars: 5,
  missedChars: 0,
};

describe('ResultsScreen', () => {
  it('renders WPM hero stat and accuracy badge', () => {
    render(<ResultsScreen {...baseProps} />);
    expect(screen.getByText('WORDS PER MINUTE')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Detailed stats')).toBeInTheDocument();
  });

  it('renders character breakdown counts', () => {
    render(<ResultsScreen {...baseProps} />);
    expect(screen.getByText('Correct 300')).toBeInTheDocument();
    expect(screen.getByText('Incorrect 5')).toBeInTheDocument();
  });

  it('renders footer actions and AI feedback when provided', () => {
    render(
      <ResultsScreen
        {...baseProps}
        footer={<button>Retry test</button>}
        aiFeedback="Great rhythm, watch your left pinky."
      />
    );
    expect(screen.getByRole('button', { name: 'Retry test' })).toBeInTheDocument();
    expect(screen.getByText('AI Feedback')).toBeInTheDocument();
    expect(screen.getByText('Great rhythm, watch your left pinky.')).toBeInTheDocument();
  });
});
