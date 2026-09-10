import { render, screen } from '@testing-library/react';
import { HandPositionGuide, getFingerForKey } from '../HandPositionGuide';

jest.mock('framer-motion', () => {
  const React = jest.requireActual('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: any, Tag: any) => {
        const MotionMock = React.forwardRef(({ children, initial, animate, exit, transition, ...props }: any, ref: any) => {
          if (typeof Tag === 'string') {
            return React.createElement(Tag, { ...props, ref }, children);
          }
          return null;
        });
        MotionMock.displayName = `MotionMock(${String(Tag)})`;
        return MotionMock;
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('getFingerForKey', () => {
  it('maps home-row keys to the correct finger and hand', () => {
    expect(getFingerForKey('a')).toMatchObject({ finger: 'pinky', hand: 'left' });
    expect(getFingerForKey('F')).toMatchObject({ finger: 'index', hand: 'left' });
    expect(getFingerForKey('j')).toMatchObject({ finger: 'index', hand: 'right' });
  });

  it('maps space to a thumb with color metadata', () => {
    const result = getFingerForKey(' ');
    expect(result).not.toBeNull();
    expect(result!.finger).toBe('thumb');
    expect(result!.color.name).toBe('Thumb');
  });

  it('returns null for unmapped keys', () => {
    expect(getFingerForKey('F13')).toBeNull();
    expect(getFingerForKey('😀')).toBeNull();
  });
});

describe('HandPositionGuide', () => {
  it('renders finger legend and target hint', () => {
    const { container } = render(<HandPositionGuide targetKey="a" />);
    expect(screen.getByText('Pinky')).toBeInTheDocument();
    expect(screen.getByText('Pinky Finger')).toBeInTheDocument();
    expect(container.textContent).toMatch(/Press.*a.*left pinky/s);
  });
});
