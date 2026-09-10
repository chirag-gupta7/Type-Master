import { render, screen } from '@testing-library/react';
import { WPMProgressChart } from '../WPMProgressChart';
import { WpmHistoryChart } from '../WpmHistoryChart';
import type { LessonWPMData } from '@/types';
import type { WpmHistoryPoint } from '@/types';

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

jest.mock('recharts', () => {
  const React = jest.requireActual('react');
  const Chart = ({ children }: any) => <div>{children}</div>;
  const Null = () => null;
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: Chart,
    AreaChart: Chart,
    Bar: Null,
    Area: Null,
    Cell: Null,
    XAxis: Null,
    YAxis: Null,
    CartesianGrid: Null,
    Tooltip: Null,
    Legend: Null,
  };
});

const lessonData: LessonWPMData[] = [
  {
    lessonId: 'l1',
    lessonTitle: 'Home Row Basics',
    level: 1,
    data: [{ date: '2026-08-01', wpm: 45, accuracy: 96 }],
  },
];

const historyData: WpmHistoryPoint[] = [
  { date: '2026-08-01', wpm: 40, accuracy: 95 },
  { date: '2026-08-02', wpm: 45, accuracy: 96 },
];

describe('WPMProgressChart', () => {
  it('renders title and per-lesson summary', () => {
    render(<WPMProgressChart data={lessonData} />);
    expect(screen.getByText('Best WPM by Lesson')).toBeInTheDocument();
    expect(screen.getByText('Home Row Basics')).toBeInTheDocument();
  });

  it('shows an empty state without data', () => {
    render(<WPMProgressChart data={[]} />);
    expect(screen.getByText('No best-per-lesson data yet')).toBeInTheDocument();
  });
});

describe('WpmHistoryChart', () => {
  it('renders title and stats summary', () => {
    render(<WpmHistoryChart data={historyData} />);
    expect(screen.getByText('WPM History')).toBeInTheDocument();
    expect(screen.getByText('Avg WPM')).toBeInTheDocument();
  });

  it('shows an empty state without data', () => {
    render(<WpmHistoryChart data={[]} />);
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });
});
