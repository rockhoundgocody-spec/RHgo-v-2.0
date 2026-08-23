import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      self: 1,
      top: 2,
    };
  }
});

describe('cn utility', () => {
  let cn;

  beforeAll(async () => {
    const utils = await import('./utils.js');
    cn = utils.cn;
  });

  it('should merge basic class names', () => {
    expect(cn('px-2', 'py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500');
  });

  it('should correctly resolve conflicting Tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
    expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle conditional and falsy inputs gracefully', () => {
    expect(cn('btn', true && 'btn-active', false && 'btn-disabled')).toBe('btn btn-active');
    expect(cn('base', null, undefined, false, '')).toBe('base');
  });

  it('should handle object syntax for class names', () => {
    expect(cn({ 'bg-blue-500': true, 'text-white': false, 'p-4': true })).toBe('bg-blue-500 p-4');
  });

  it('should handle arrays and nested array inputs', () => {
    expect(cn(['px-2', ['py-1', { 'text-red-500': true, 'hidden': false }]])).toBe('px-2 py-1 text-red-500');
  });

  it('should return empty string when no arguments or only falsy arguments are provided', () => {
    expect(cn()).toBe('');
    expect(cn(null, undefined, false, 0, '')).toBe('');
  });

  it('should handle complex mixed input types', () => {
    expect(
      cn(
        'flex items-center',
        ['justify-between', { 'opacity-50': false, 'hover:opacity-100': true }],
        undefined,
        'p-4 p-6',
        { 'w-full': true }
      )
    ).toBe('flex items-center justify-between hover:opacity-100 p-6 w-full');
  });
});
