import { renderHook, act } from '@testing-library/react';
import { useUiStore } from '../ui';

const reset = () => useUiStore.setState({ isLoading: false });

beforeEach(reset);

describe('ui store', () => {
  it('starts not loading', () => {
    const { result } = renderHook(() => useUiStore());
    expect(result.current.isLoading).toBe(false);
  });

  it('toggles loading on and off', () => {
    const { result } = renderHook(() => useUiStore());
    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.isLoading).toBe(true);
    act(() => {
      result.current.setLoading(false);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('is idempotent for repeated values', () => {
    const { result } = renderHook(() => useUiStore());
    act(() => {
      result.current.setLoading(true);
      result.current.setLoading(true);
    });
    expect(result.current.isLoading).toBe(true);
  });
});
