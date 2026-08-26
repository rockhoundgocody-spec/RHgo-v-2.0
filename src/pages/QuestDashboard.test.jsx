import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: {} }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [] }) }));

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

let QuestCard;

describe('QuestCard', () => {
  beforeAll(async () => {
    QuestCard = (await import('./QuestDashboard')).QuestCard;
  });

  it('exposes keyboard focus, expansion state, and progress semantics', () => {
    const markup = renderToStaticMarkup(
      <QuestCard
        q={{
          id: 'quest-1',
          title: 'Find Quartz',
          description: 'Log two quartz specimens.',
          quest_type: 'daily',
          progress: 1,
          target_count: 2,
          xp_reward: 50,
          status: 'active',
        }}
      />
    );

    expect(markup).toContain('role="button"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls=');
    expect(markup).toContain('focus-visible:ring-amethyst/80');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="50"');
    expect(markup).toContain('motion-reduce:transition-none');
  });
});
