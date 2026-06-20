import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './performanceOptimization';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call the function after the delay', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toBeCalled();

    vi.advanceTimersByTime(50);
    expect(fn).not.toBeCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toBeCalledTimes(1);
  });

  it('should debounce multiple calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toBeCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(1);
  });

  it('should call with the latest arguments', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    vi.advanceTimersByTime(100);
    expect(fn).toBeCalledWith('third');
  });

  it('should preserve the context (this)', () => {
    const fn = vi.fn(function() {
      return this.name;
    });
    const obj = { name: 'test' };
    obj.debouncedFn = debounce(fn, 100);

    obj.debouncedFn();
    vi.advanceTimersByTime(100);

    // In Vitest/Jest, mock.instances[0] refers to 'this' value when the mock was called
    expect(fn.mock.instances[0]).toBe(obj);
  });

  it('should use default delay of 300ms', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn);

    debouncedFn();

    vi.advanceTimersByTime(299);
    expect(fn).not.toBeCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toBeCalledTimes(1);
  });
});
