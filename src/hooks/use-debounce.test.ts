import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './use-debounce';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Update the value
    rerender({ value: 'updated' });

    // Should still be 'initial' immediately after update
    expect(result.current).toBe('initial');

    // Fast-forward time by 250ms
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    // Fast-forward remaining time
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset the timer if value changes again before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'v1' } }
    );

    rerender({ value: 'v2' });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('v1');

    rerender({ value: 'v3' });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Still v1 because the timer for v2 was cleared and v3 hasn't finished
    expect(result.current).toBe('v1');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('v3');
  });
});
