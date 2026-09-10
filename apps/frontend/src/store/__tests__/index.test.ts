import { useTypingStore } from '../index';

const reset = (preserveText = false) => useTypingStore.getState().resetTest(preserveText);

beforeEach(() => {
  reset();
  jest.restoreAllMocks();
});

describe('typing store (index)', () => {
  it('starts waiting with empty text', () => {
    const s = useTypingStore.getState();
    expect(s.status).toBe('waiting');
    expect(s.textToType).toBe('');
    expect(s.accuracy).toBe(100);
    expect(s.mistakes).toEqual([]);
  });

  it('startTest resets metrics and stores text', () => {
    useTypingStore.getState().startTest('hello');
    const s = useTypingStore.getState();
    expect(s.textToType).toBe('hello');
    expect(s.userInput).toBe('');
    expect(s.errors).toBe(0);
    expect(s.wpm).toBe(0);
  });

  it('ignores input longer than the target text', () => {
    useTypingStore.getState().startTest('ab');
    useTypingStore.getState().setUserInput('abcde');
    expect(useTypingStore.getState().userInput).toBe('');
  });

  it('starts the timer on first character and tracks a mistake', () => {
    useTypingStore.getState().startTest('abcdef');
    useTypingStore.getState().setUserInput('axc');
    const s = useTypingStore.getState();
    expect(s.startTime).not.toBeNull();
    expect(s.status).toBe('in-progress');
    expect(s.errors).toBe(1);
    expect(s.mistakes).toHaveLength(1);
    expect(s.mistakes[0]).toMatchObject({ position: 1, key: 'x', expected: 'b' });
    expect(s.accuracy).toBeLessThan(100);
    expect(s.wpm).toBeGreaterThanOrEqual(0);
  });

  it('does not duplicate mistakes at the same position', () => {
    useTypingStore.getState().startTest('abc');
    useTypingStore.getState().setUserInput('x');
    useTypingStore.getState().setUserInput('xy');
    const positions = useTypingStore.getState().mistakes.map((m) => m.position);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('backspace below a mistake position prunes it', () => {
    useTypingStore.getState().startTest('abc');
    useTypingStore.getState().setUserInput('axc');
    expect(useTypingStore.getState().mistakes).toHaveLength(1);
    useTypingStore.getState().setUserInput('a');
    expect(useTypingStore.getState().mistakes).toHaveLength(0);
  });

  it('sanitizes newlines and collapses repeated spaces', () => {
    useTypingStore.getState().startTest('a b c d e f');
    useTypingStore.getState().setUserInput('a\nb  c');
    expect(useTypingStore.getState().userInput).not.toContain('\n');
    expect(useTypingStore.getState().userInput).not.toContain('  ');
  });

  it('auto-finishes when the full text is typed', () => {
    useTypingStore.getState().startTest('ab');
    useTypingStore.getState().setUserInput('a');
    expect(useTypingStore.getState().status).toBe('in-progress');
    useTypingStore.getState().setUserInput('ab');
    expect(useTypingStore.getState().status).toBe('finished');
  });

  it('endTest without a start is a no-op', () => {
    useTypingStore.getState().endTest();
    expect(useTypingStore.getState().status).toBe('waiting');
  });

  it('resetTest clears by default and preserves text on demand', () => {
    useTypingStore.getState().startTest('keep me');
    useTypingStore.getState().setUserInput('k');
    useTypingStore.getState().resetTest(true);
    expect(useTypingStore.getState().textToType).toBe('keep me');
    expect(useTypingStore.getState().userInput).toBe('');
    useTypingStore.getState().resetTest();
    expect(useTypingStore.getState().textToType).toBe('');
  });

  it('perfect typing yields 100 accuracy and zero errors at finish', () => {
    const t0 = 1_000_000;
    const spy = jest.spyOn(Date, 'now').mockReturnValue(t0);
    useTypingStore.getState().startTest('abcd');
    useTypingStore.getState().setUserInput('a');
    spy.mockReturnValue(t0 + 60_000);
    useTypingStore.getState().setUserInput('abcd');
    const s = useTypingStore.getState();
    expect(s.status).toBe('finished');
    expect(s.errors).toBe(0);
    expect(s.accuracy).toBe(100);
  });
});
