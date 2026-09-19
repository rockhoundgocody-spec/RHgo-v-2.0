import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [],
    refetch: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Quest: {
        filter: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'q-1' }),
        bulkCreate: vi.fn().mockResolvedValue([{ id: 'q-1' }, { id: 'q-2' }, { id: 'q-3' }]),
      },
    },
  },
}));

let QuestEngine;

describe('QuestEngine - Source Code & Functionality Verification', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    QuestEngine = (await import('./QuestEngine')).default;
  });

  it('renders "Ask Clover" button when no active quests exist', () => {
    const markup = renderToStaticMarkup(<QuestEngine userEmail="explorer@example.com" />);
    expect(markup).toContain('Ask Clover');
  });

  it('verifies generateQuests uses bulkCreate instead of N+1 create calls', () => {
    const source = QuestEngine.toString();
    expect(source).toContain('bulkCreate');
    expect(source).not.toContain('Promise.all(picks.map');
  });
});
