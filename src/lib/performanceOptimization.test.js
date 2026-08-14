import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './performanceOptimization.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not call the function immediately', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();
  });

  it('should call the function exactly once after the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset the timer on repeated calls within the delay period', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(150);

    debounced();
    vi.advanceTimersByTime(150);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('arg1', 42);
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('arg1', 42);
  });

  it('should preserve the this context', () => {
    const context = { value: 42 };
    let capturedThis;

    function fn() {
      capturedThis = this;
    }

    const debounced = debounce(fn, 300);
    debounced.call(context);

    vi.advanceTimersByTime(300);
    expect(capturedThis).toBe(context);
  });

  it('should use default delay of 300ms if not specified', () => {
    const fn = vi.fn();
    const debounced = debounce(fn); // No delay passed

    debounced();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
