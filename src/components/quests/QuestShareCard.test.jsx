import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useId: () => ':r0:',
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    analytics: {
      track: vi.fn(),
    },
  },
}));

import QuestShareCard from './QuestShareCard.jsx';

describe('QuestShareCard', () => {
  it('contains expected accessibility and modal dialog attributes in compiled component source code', () => {
    const source = QuestShareCard.toString();
    expect(source).toContain('role: "dialog"');
    expect(source).toContain('"aria-modal": "true"');
    expect(source).toContain('titleId');
    expect(source).toContain('Dismiss quest completion card');
    expect(source).toContain('focus-visible:ring-2');
    expect(source).toContain('"aria-hidden": "true"');
  });

  it('renders null when quests array is empty', () => {
    const res = QuestShareCard({ quests: [], onDismiss: vi.fn() });
    expect(res).toBeNull();
  });

  it('renders null when quests prop is undefined', () => {
    const res = QuestShareCard({ quests: undefined, onDismiss: vi.fn() });
    expect(res).toBeNull();
  });

  it('renders modal dialog tree when quest is provided', () => {
    const mockQuest = {
      id: 'q1',
      title: 'Find 3 Quartz',
      quest_type: 'daily',
      xp_reward: 100,
      clover_message: 'Great job!',
    };
    const element = QuestShareCard({ quests: [mockQuest], onDismiss: vi.fn() });
    expect(element).not.toBeNull();
  });
});
