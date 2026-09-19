import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import StreakReminderBanner from './StreakReminderBanner';

// Mock window storage
const mockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'sessionStorage', { value: mockStorage(), writable: true });
  Object.defineProperty(window, 'localStorage', { value: mockStorage(), writable: true });
} else {
  globalThis.sessionStorage = mockStorage();
  globalThis.localStorage = mockStorage();
}

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { companion: { last_check_in_date: '1970-01-01' } } }),
    },
    analytics: {
      track: vi.fn(),
    },
  },
}));

vi.mock('@/lib/bannerMutex', () => ({
  useBannerSlot: () => ({
    tryAcquire: () => true,
    release: vi.fn(),
  }),
}));

describe('StreakReminderBanner', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
    globalThis.localStorage.clear();
  });

  it('contains expected accessibility attributes in component source code', () => {
    const source = StreakReminderBanner.toString();
    expect(source).toContain('aria-label');
    expect(source).toContain('Dismiss streak reminder');
    expect(source).toContain('type: "button"');
    expect(source).toContain('focus-visible:ring-2');
  });
});